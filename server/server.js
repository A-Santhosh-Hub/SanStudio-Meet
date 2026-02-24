const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const os = require('os');
const { RoomManager } = require('./rooms');
const { AuthManager } = require('./auth');

// Detect LAN IP at startup
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
const LAN_IP = getLanIP();


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10e6, // 10MB for file sharing
});

app.use(cors());
app.use(express.json());

const rooms = new RoomManager();

// REST: Generate a new room ID
app.get('/api/create-room', (req, res) => {
  const roomId = uuidv4().slice(0, 9).replace(/-/g, '').substring(0, 9);
  const formatted = `${roomId.slice(0, 3)}-${roomId.slice(3, 6)}-${roomId.slice(6, 9)}`;
  res.json({ roomId: formatted });
});

// REST: Check if room exists and if it needs a password
app.get('/api/room/:roomId', (req, res) => {
  const room = rooms.getRoom(req.params.roomId);
  if (!room) return res.json({ exists: false });
  res.json({
    exists: true,
    hasPassword: !!room.passwordHash,
    locked: room.locked,
    participantCount: room.participants.size,
  });
});

// REST: Return server's LAN IP and client port
app.get('/api/server-info', (req, res) => {
  res.json({ lanIP: LAN_IP, clientPort: 5173, serverPort: PORT || 3001 });
});

// ── AUTH ENDPOINTS ────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ error: 'Username and password required' });
  const result = AuthManager.login(username, password);
  res.json(result);
});



app.post('/api/auth/create-coach', (req, res) => {
  const { adminUsername, adminPassword, username, password, displayName } = req.body;
  const adminCheck = AuthManager.login(adminUsername, adminPassword);
  if (adminCheck.error || adminCheck.user.role !== 'admin') {
    return res.json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const result = AuthManager.createCoach(username, password, displayName);
  res.json(result);
});

app.post('/api/auth/create-student', (req, res) => {
  const { adminUsername, adminPassword, username, password, displayName } = req.body;
  const adminCheck = AuthManager.login(adminUsername, adminPassword);
  if (adminCheck.error || adminCheck.user.role !== 'admin') {
    return res.json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const result = AuthManager.createStudent(username, password, displayName);
  res.json(result);
});

app.post('/api/auth/update-user', (req, res) => {
  const { adminUsername, adminPassword, targetUsername, updates } = req.body;
  const adminCheck = AuthManager.login(adminUsername, adminPassword);
  if (adminCheck.error || adminCheck.user.role !== 'admin') {
    return res.json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const result = AuthManager.updateUser(targetUsername, updates);
  res.json(result);
});

app.post('/api/auth/delete-user', (req, res) => {
  const { adminUsername, adminPassword, targetUsername } = req.body;
  const adminCheck = AuthManager.login(adminUsername, adminPassword);
  if (adminCheck.error || adminCheck.user.role !== 'admin') {
    return res.json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const result = AuthManager.deleteUser(targetUsername);
  res.json(result);
});

// ── ADMIN STATS ────────────────────────────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  const roomStats = rooms.getRoomStats();
  const users = AuthManager.getAll();
  res.json({
    activeRooms: roomStats.length,
    totalParticipants: rooms.getTotalParticipants(),
    totalUsers: users.length,
    rooms: roomStats,
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
    })),
  });
});


io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // ── JOIN ROOM ──────────────────────────────────────────────
  socket.on('join-room', async ({ roomId, name, password, isHost, role }) => {
    // Guard: ignore duplicate joins from same socket
    if (socket.data.roomId === roomId) {
      console.log(`[DUPLICATE JOIN] ${socket.id} tried to join ${roomId} again, ignored.`);
      return;
    }
    const room = rooms.getRoom(roomId);

    // If room is locked
    if (room && room.locked && !isHost) {
      socket.emit('error', { message: 'This meeting is locked.' });
      return;
    }

    // Password check
    if (room && room.passwordHash) {
      if (!password) {
        socket.emit('password-required');
        return;
      }
      const valid = await bcrypt.compare(password, room.passwordHash);
      if (!valid) {
        socket.emit('error', { message: 'Incorrect meeting password.' });
        return;
      }
    }

    const participant = {
      id: socket.id,
      name,
      isHost: isHost || !room, // first joiner or declared host
      role: role || 'student',
      muted: role === 'student', // Students start muted
      videoOff: role === 'student', // Students start video off
      handRaised: false,
      canSpeak: false, // For interactive/lecture mode temporary approval
    };

    if (!room) {
      // Create new room
      rooms.createRoom(roomId, socket.id);
      participant.isHost = true;
      rooms.addParticipant(roomId, participant);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.name = name;
      socket.data.isHost = true;

      socket.emit('joined-room', {
        participants: rooms.getParticipants(roomId),
        isHost: true,
        waitingList: [],
        controlMode: room ? room.controlMode : 'lecture'
      });
    } else if (room.waitingRoomEnabled && !isHost) {
      // Add to waiting room
      rooms.addToWaiting(roomId, { id: socket.id, name });
      socket.data.roomId = roomId;
      socket.data.name = name;

      socket.emit('waiting-room', { message: 'Waiting for host to admit you.' });

      // Notify host
      const hostId = rooms.getHostId(roomId);
      io.to(hostId).emit('waiting-user', { id: socket.id, name });
    } else {
      // Join directly (host rejoining or non-host with waiting room disabled)
      const actuallyHost = rooms.getHostId(roomId) === socket.id || isHost;
      participant.isHost = actuallyHost;
      rooms.addParticipant(roomId, participant);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.name = name;
      socket.data.isHost = actuallyHost;

      socket.emit('joined-room', {
        participants: rooms.getParticipants(roomId),
        isHost: actuallyHost,
        waitingList: room.waiting || [],
        controlMode: room.controlMode
      });

      // Notify others in room
      socket.to(roomId).emit('user-joined', participant);
    }
  });

  // ── HOST ADMITS USER ───────────────────────────────────────
  socket.on('admit-user', ({ userId, roomId }) => {
    const room = rooms.getRoom(roomId);
    if (!room) return;
    if (rooms.getHostId(roomId) !== socket.id) return;

    const waitingUser = room.waiting.find(u => u.id === userId);
    if (!waitingUser) return;

    rooms.removeFromWaiting(roomId, userId);
    const participant = {
      id: userId,
      name: waitingUser.name,
      isHost: false,
      muted: false,
      videoOff: false,
      handRaised: false,
    };
    rooms.addParticipant(roomId, participant);

    const admittedSocket = io.sockets.sockets.get(userId);
    if (admittedSocket) {
      admittedSocket.join(roomId);
      admittedSocket.emit('admitted', {
        participants: rooms.getParticipants(roomId),
        isHost: false,
      });
      socket.to(roomId).emit('user-joined', participant);
    }
  });

  // ── HOST DENIES USER ───────────────────────────────────────
  socket.on('deny-user', ({ userId, roomId }) => {
    rooms.removeFromWaiting(roomId, userId);
    io.to(userId).emit('denied', { message: 'Host denied your entry.' });
  });

  // ── WEBRTC SIGNALING ───────────────────────────────────────
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── CHAT ───────────────────────────────────────────────────
  socket.on('chat-message', ({ roomId, message, type = 'text' }) => {
    const participant = rooms.getParticipant(roomId, socket.id);
    const payload = {
      id: uuidv4(),
      sender: socket.data.name || 'Unknown',
      senderId: socket.id,
      message,
      type, // 'text' | 'emoji' | 'file'
      timestamp: Date.now(),
    };
    io.to(roomId).emit('chat-message', payload);
  });

  // ── FILE SHARE ────────────────────────────────────────────
  socket.on('file-share', ({ roomId, fileName, fileType, fileData }) => {
    io.to(roomId).emit('file-share', {
      sender: socket.data.name || 'Unknown',
      senderId: socket.id,
      fileName,
      fileType,
      fileData,
      timestamp: Date.now(),
    });
  });

  // ── HOST CONTROLS ─────────────────────────────────────────
  socket.on('mute-user', ({ targetId, roomId }) => {
    if (rooms.getHostId(roomId) !== socket.id) return;
    io.to(targetId).emit('force-mute');
    rooms.updateParticipant(roomId, targetId, { muted: true });
    io.to(roomId).emit('participant-updated', { id: targetId, muted: true });
  });

  socket.on('allow-student', ({ targetId, roomId }) => {
    const room = rooms.getRoom(roomId);
    const participant = rooms.getParticipant(roomId, socket.id);
    if (!room || (participant.role !== 'admin' && participant.role !== 'coach' && participant.isHost !== true)) return;
    rooms.updateParticipant(roomId, targetId, { canSpeak: true });
    io.to(targetId).emit('speak-allowed');
    io.to(roomId).emit('participant-updated', { id: targetId, canSpeak: true });
  });

  socket.on('revoke-student', ({ targetId, roomId }) => {
    const room = rooms.getRoom(roomId);
    const participant = rooms.getParticipant(roomId, socket.id);
    if (!room || (participant.role !== 'admin' && participant.role !== 'coach' && participant.isHost !== true)) return;
    rooms.updateParticipant(roomId, targetId, { canSpeak: false, muted: true });
    io.to(targetId).emit('speak-revoked');
    io.to(roomId).emit('participant-updated', { id: targetId, canSpeak: false, muted: true });
  });

  socket.on('switch-mode', ({ roomId, mode }) => {
    const room = rooms.getRoom(roomId);
    const participant = rooms.getParticipant(roomId, socket.id);
    if (!room || (participant.role !== 'admin' && participant.role !== 'coach' && participant.isHost !== true)) return;
    room.controlMode = mode;
    io.to(roomId).emit('mode-changed', { mode });

    // If lecture, mute all students
    if (mode === 'lecture') {
      rooms.getParticipants(roomId).forEach(p => {
        if (p.role === 'student' && p.id !== socket.id) {
          rooms.updateParticipant(roomId, p.id, { canSpeak: false, muted: true, videoOff: true });
          io.to(p.id).emit('force-mute');
        }
      });
      io.to(roomId).emit('all-muted');
    }
  });

  socket.on('mute-all', ({ roomId }) => {
    if (rooms.getHostId(roomId) !== socket.id) return;
    rooms.getParticipants(roomId).forEach(p => {
      if (p.id !== socket.id) {
        io.to(p.id).emit('force-mute');
        rooms.updateParticipant(roomId, p.id, { muted: true });
      }
    });
    io.to(roomId).emit('all-muted');
  });

  socket.on('kick-user', ({ targetId, roomId }) => {
    if (rooms.getHostId(roomId) !== socket.id) return;
    io.to(targetId).emit('kicked', { message: 'You were removed by the host.' });
    rooms.removeParticipant(roomId, targetId);
    io.to(roomId).emit('user-left', { id: targetId });
  });

  socket.on('lock-room', ({ roomId, locked }) => {
    const room = rooms.getRoom(roomId);
    if (!room || rooms.getHostId(roomId) !== socket.id) return;
    room.locked = locked;
    io.to(roomId).emit('room-locked', { locked });
  });

  socket.on('set-password', async ({ roomId, password }) => {
    const room = rooms.getRoom(roomId);
    if (!room || rooms.getHostId(roomId) !== socket.id) return;
    room.passwordHash = password ? await bcrypt.hash(password, 10) : null;
    socket.emit('password-set');
  });

  // ── RAISE HAND ────────────────────────────────────────────
  socket.on('raise-hand', ({ roomId, raised }) => {
    rooms.updateParticipant(roomId, socket.id, { handRaised: raised });
    io.to(roomId).emit('hand-raised', { id: socket.id, name: socket.data.name, raised });
  });

  // ── REACTIONS ─────────────────────────────────────────────
  socket.on('reaction', ({ roomId, emoji }) => {
    io.to(roomId).emit('reaction', {
      id: socket.id,
      name: socket.data.name,
      emoji,
    });
  });

  // ── PARTICIPANT STATUS UPDATE ─────────────────────────────
  socket.on('update-status', ({ roomId, muted, videoOff }) => {
    rooms.updateParticipant(roomId, socket.id, { muted, videoOff });
    io.to(roomId).emit('participant-updated', { id: socket.id, muted, videoOff });
  });

  // ── WHITEBOARD ────────────────────────────────────────────
  socket.on('whiteboard-draw', ({ roomId, data }) => {
    socket.to(roomId).emit('whiteboard-draw', { data, from: socket.id });
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    socket.to(roomId).emit('whiteboard-clear');
  });

  // ── DISCONNECT ────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    console.log(`[DISCONNECT] ${socket.id} from room ${roomId}`);
    const room = rooms.getRoom(roomId);
    if (!room) return;

    rooms.removeParticipant(roomId, socket.id);
    io.to(roomId).emit('user-left', { id: socket.id });

    // If host left, transfer or close room
    if (room.hostId === socket.id) {
      const remaining = rooms.getParticipants(roomId);
      if (remaining.length > 0) {
        const newHost = remaining[0];
        room.hostId = newHost.id;
        newHost.isHost = true;
        io.to(newHost.id).emit('host-transferred');
        io.to(roomId).emit('participant-updated', { id: newHost.id, isHost: true });
      } else {
        rooms.deleteRoom(roomId);
      }
    }

    // Clean up empty rooms
    if (rooms.getParticipants(roomId).length === 0) {
      rooms.deleteRoom(roomId);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 SanStudio Meet Signaling Server running on port ${PORT}\n`);
});
