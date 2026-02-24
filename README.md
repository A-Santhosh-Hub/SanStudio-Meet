# SanStudio Meet

**A modern, browser-based WebRTC video meeting platform** — no downloads, no sign-up required.

---

## 🚀 Quick Start

Double-click **`start.bat`** — it will launch both servers and open the browser automatically.

Or manually:

```bash
# Terminal 1 — Signaling Server
cd server
node server.js
# Runs on http://localhost:3001

# Terminal 2 — React Frontend
cd client
npm run dev
# Opens at http://localhost:5173
```

---

## ✨ Features

| Feature | Status |
|---|---|
| Create shareable meeting link | ✅ |
| Join via link / code | ✅ |
| Camera preview before joining | ✅ |
| HD Video & Audio calls | ✅ |
| Mute / Unmute mic | ✅ |
| Camera on / off | ✅ |
| Screen sharing | ✅ |
| Real-time Chat with emoji | ✅ |
| File sharing (≤ 5MB) | ✅ |
| Participant list | ✅ |
| Host controls (mute/kick/mute all) | ✅ |
| Waiting room approval | ✅ |
| Raise hand | ✅ |
| Emoji reactions (👏 👍 ❤️) | ✅ |
| Meeting timer | ✅ |
| Lock meeting room | ✅ |
| Meeting recording (saves locally) | ✅ |
| Collaborative whiteboard | ✅ |
| Private notes panel | ✅ |
| Dark / Light mode | ✅ |
| Mobile responsive | ✅ |
| Device settings (cam/mic/speaker) | ✅ |

---

## 🏗️ Project Structure

```
ZOOM/
├── start.bat            ← One-click launcher
├── server/
│   ├── server.js        ← Express + Socket.io signaling server
│   ├── rooms.js         ← In-memory room state
│   └── package.json
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx       ← Landing page
    │   │   ├── PreJoinPage.jsx    ← Camera preview + name
    │   │   └── MeetingRoom.jsx    ← Full meeting UI
    │   ├── components/
    │   │   ├── VideoGrid.jsx
    │   │   ├── ControlsBar.jsx
    │   │   ├── ChatPanel.jsx
    │   │   ├── ParticipantsPanel.jsx
    │   │   ├── WaitingRoom.jsx
    │   │   ├── SettingsPanel.jsx
    │   │   ├── WhiteboardPanel.jsx
    │   │   ├── NotesPanel.jsx
    │   │   └── Toast.jsx
    │   └── hooks/
    │       ├── useWebRTC.js
    │       ├── useSocket.js
    │       └── useMediaDevices.js
    └── package.json
```

---

## 🔒 Security

- WebRTC DTLS/SRTP encryption (browser native)
- Optional meeting password
- Waiting room with host approval
- Meeting lock (no new joiners)
- No data stored on server

## 📡 STUN Servers

Google STUN: `stun.l.google.com:19302`

TURN: Add Twilio/Coturn credentials to `server/server.js` for NAT traversal beyond local network.

---

## 🏷️ Branding

**Developed by [SanStudio](https://sanstudio.neocities.org/)**
