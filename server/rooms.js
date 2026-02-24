class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId, hostId) {
        this.rooms.set(roomId, {
            id: roomId,
            hostId,
            participants: new Map(),
            waiting: [],
            locked: false,
            passwordHash: null,
            waitingRoomEnabled: true,
            controlMode: 'lecture', // lecture | interactive | open
            createdAt: Date.now(),
        });
        return this.rooms.get(roomId);
    }

    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }

    addParticipant(roomId, participant) {
        const room = this.getRoom(roomId);
        if (!room) return;
        room.participants.set(participant.id, participant);
    }

    removeParticipant(roomId, participantId) {
        const room = this.getRoom(roomId);
        if (!room) return;
        room.participants.delete(participantId);
    }

    getParticipant(roomId, participantId) {
        const room = this.getRoom(roomId);
        if (!room) return null;
        return room.participants.get(participantId) || null;
    }

    getParticipants(roomId) {
        const room = this.getRoom(roomId);
        if (!room) return [];
        return Array.from(room.participants.values());
    }

    updateParticipant(roomId, participantId, updates) {
        const participant = this.getParticipant(roomId, participantId);
        if (!participant) return;
        Object.assign(participant, updates);
    }

    getHostId(roomId) {
        const room = this.getRoom(roomId);
        return room ? room.hostId : null;
    }

    addToWaiting(roomId, user) {
        const room = this.getRoom(roomId);
        if (!room) return;
        if (!room.waiting.find(u => u.id === user.id)) {
            room.waiting.push(user);
        }
    }

    removeFromWaiting(roomId, userId) {
        const room = this.getRoom(roomId);
        if (!room) return;
        room.waiting = room.waiting.filter(u => u.id !== userId);
    }
    getRoomStats() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            hostId: room.hostId,
            participantCount: room.participants.size,
            waitingCount: room.waiting.length,
            locked: room.locked,
            hasPassword: !!room.passwordHash,
            createdAt: room.createdAt,
        }));
    }

    getTotalParticipants() {
        let total = 0;
        this.rooms.forEach(r => { total += r.participants.size; });
        return total;
    }

    getActiveRoomCount() {
        return this.rooms.size;
    }
}

module.exports = { RoomManager };
