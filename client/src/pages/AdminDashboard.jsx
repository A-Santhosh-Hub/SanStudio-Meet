import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_COLORS } from '../context/AuthContext';
import { generateRoomId } from '../lib/roomId';

const REFRESH_INTERVAL = 5000;

function StatCard({ icon, label, value, sub, color = 'indigo' }) {
    const colors = {
        indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20',
        green: 'from-green-500/20 to-green-600/10 border-green-500/20',
        yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    };
    return (
        <div className={`glass-card p-5 bg-gradient-to-br border ${colors[color]}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {sub && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400">{sub}</span>}
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
        </div>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [error, setError] = useState('');

    const [coachForm, setCoachForm] = useState({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
    const [coachStatus, setCoachStatus] = useState({ error: '', success: '' });
    const [isCreatingCoach, setIsCreatingCoach] = useState(false);

    const [studentForm, setStudentForm] = useState({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
    const [studentStatus, setStudentStatus] = useState({ error: '', success: '' });
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);

    const [pmForm, setPmForm] = useState({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
    const [pmStatus, setPmStatus] = useState({ error: '', success: '' });
    const [isCreatingPM, setIsCreatingPM] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ displayName: '', password: '', role: '', adminUsername: '', adminPassword: '' });
    const [editStatus, setEditStatus] = useState({ error: '', success: '' });
    const [isEditing, setIsEditing] = useState(false);

    const [deletingUser, setDeletingUser] = useState(null);
    const [deleteForm, setDeleteForm] = useState({ adminUsername: '', adminPassword: '' });
    const [deleteStatus, setDeleteStatus] = useState({ error: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const [generatedRoomId, setGeneratedRoomId] = useState('');
    const [localLink, setLocalLink] = useState('');
    const [networkLink, setNetworkLink] = useState('');
    const [showCreateCard, setShowCreateCard] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedLocal, setCopiedLocal] = useState(false);

    const handleCreateCoach = async (e) => {
        e.preventDefault();
        setCoachStatus({ error: '', success: '' });
        setIsCreatingCoach(true);
        try {
            const res = await fetch('/api/auth/create-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(coachForm)
            });
            const data = await res.json();
            if (data.error) {
                setCoachStatus({ error: data.error, success: '' });
            } else {
                setCoachStatus({ error: '', success: 'Coach account created successfully!' });
                setCoachForm({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
                fetchStats(); // refresh user list
            }
        } catch (err) {
            setCoachStatus({ error: 'Failed to create coach. Server error.', success: '' });
        }
        setIsCreatingCoach(false);
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        setStudentStatus({ error: '', success: '' });
        setIsCreatingStudent(true);
        try {
            const res = await fetch('/api/auth/create-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentForm)
            });
            const data = await res.json();
            if (data.error) {
                setStudentStatus({ error: data.error, success: '' });
            } else {
                setStudentStatus({ error: '', success: 'Student account created successfully!' });
                setStudentForm({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
                fetchStats(); // refresh user list
            }
        } catch (err) {
            setStudentStatus({ error: 'Failed to create student. Server error.', success: '' });
        }
        setIsCreatingStudent(false);
    };

    const handleCreatePM = async (e) => {
        e.preventDefault();
        setPmStatus({ error: '', success: '' });
        setIsCreatingPM(true);
        try {
            const res = await fetch('/api/auth/create-pm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pmForm)
            });
            const data = await res.json();
            if (data.error) {
                setPmStatus({ error: data.error, success: '' });
            } else {
                setPmStatus({ error: '', success: 'PM Sir account created successfully!' });
                setPmForm({ username: '', password: '', displayName: '', adminUsername: '', adminPassword: '' });
                fetchStats();
            }
        } catch (err) {
            setPmStatus({ error: 'Failed to create PM account. Server error.', success: '' });
        }
        setIsCreatingPM(false);
    };

    const openEditModal = (u) => {
        setEditingUser(u);
        setEditForm({ displayName: u.displayName, password: '', role: u.role, adminUsername: '', adminPassword: '' });
        setEditStatus({ error: '', success: '' });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setEditStatus({ error: '', success: '' });
        setIsEditing(true);
        try {
            const res = await fetch('/api/auth/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUsername: editForm.adminUsername,
                    adminPassword: editForm.adminPassword,
                    targetUsername: editingUser.username,
                    updates: {
                        displayName: editForm.displayName,
                        password: editForm.password || undefined,
                        role: editForm.role
                    }
                })
            });
            if (!res.ok) {
                if (res.status === 404) throw new Error("Endpoint not found. Please restart your server (start.bat) to apply the latest backend changes.");
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json();
            if (data.error) {
                setEditStatus({ error: data.error, success: '' });
            } else {
                setEditStatus({ error: '', success: 'User updated successfully!' });
                fetchStats();
                setTimeout(() => setEditingUser(null), 1500);
            }
        } catch (err) {
            setEditStatus({ error: err.message || 'Failed to update user', success: '' });
        }
        setIsEditing(false);
    };

    const openDeleteModal = (u) => {
        setDeletingUser(u);
        setDeleteForm({ adminUsername: '', adminPassword: '' });
        setDeleteStatus({ error: '' });
    };

    const handleDeleteUser = async (e) => {
        e.preventDefault();
        setDeleteStatus({ error: '' });
        setIsDeleting(true);
        try {
            const res = await fetch('/api/auth/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminUsername: deleteForm.adminUsername,
                    adminPassword: deleteForm.adminPassword,
                    targetUsername: deletingUser.username
                })
            });
            if (!res.ok) {
                if (res.status === 404) throw new Error("Endpoint not found. Please restart your server (start.bat) to apply the latest backend changes.");
                throw new Error(`Server returned ${res.status}`);
            }
            const data = await res.json();
            if (data.error) {
                setDeleteStatus({ error: data.error });
            } else {
                setDeletingUser(null);
                fetchStats();
            }
        } catch (err) {
            setDeleteStatus({ error: err.message || 'Failed to delete user' });
        }
        setIsDeleting(false);
    };

    const handleGenerateMeeting = async () => {
        const roomId = generateRoomId();
        setGeneratedRoomId(roomId);

        const local = `${window.location.protocol}//${window.location.hostname}:5173/join/${roomId}`;
        setLocalLink(local);

        try {
            const res = await fetch('/api/server-info');
            const data = await res.json();
            const ip = data.lanIP && data.lanIP !== 'localhost' ? data.lanIP : window.location.hostname;
            const network = `https://${ip}:5173/join/${roomId}`;
            setNetworkLink(network);
        } catch {
            setNetworkLink(local); // fallback
        }

        setShowCreateCard(true);
    };

    const copyLink = (link, setFlag) => {
        navigator.clipboard.writeText(link);
        setFlag(true);
        setTimeout(() => setFlag(false), 2000);
    };

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            setStats(data);
            setLastRefresh(new Date());
            setError('');
        } catch {
            setError('Failed to fetch stats. Is the server running?');
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Top Bar */}
            <header className="sticky top-0 z-40 px-6 py-3 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                        <span className="text-white text-lg">⚙️</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SanStudio Meet</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
                            Updated {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
                        {roleColor.label}
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {user?.displayName || user?.username}
                    </span>
                    <button onClick={handleLogout}
                        className="px-3 py-1.5 text-xs rounded-lg font-semibold transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon="🟢" label="Active Meetings" value={stats?.activeRooms ?? '—'} sub="Live" color="green" />
                    <StatCard icon="👥" label="Participants" value={stats?.totalParticipants ?? '—'} sub="Online" color="indigo" />
                    <StatCard icon="👤" label="Registered Users" value={stats?.totalUsers ?? '—'} color="purple" />
                    <StatCard icon="🔄" label="Auto-Refresh" value="5s" sub="Interval" color="yellow" />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Create Coach Account */}
                    <div className="glass-card p-6" style={{ border: '1px solid var(--border-color)' }}>
                        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">👨‍🏫</span> Create Coach Account
                        </h2>
                        <form onSubmit={handleCreateCoach} className="flex flex-col gap-3">
                            <input type="text" placeholder="Coach Full Name" value={coachForm.displayName} onChange={e => setCoachForm({ ...coachForm, displayName: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="text" placeholder="Coach ID (Username)" value={coachForm.username} onChange={e => setCoachForm({ ...coachForm, username: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="password" placeholder="Coach Password" value={coachForm.password} onChange={e => setCoachForm({ ...coachForm, password: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />

                            <div className="border-t border-white/10 my-1 pt-3">
                                <p className="text-xs text-slate-400 mb-2 font-semibold">Verify Admin Credentials</p>
                                <input type="text" placeholder="Admin Username" value={coachForm.adminUsername} onChange={e => setCoachForm({ ...coachForm, adminUsername: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm mb-3" />
                                <input type="password" placeholder="Admin Password" value={coachForm.adminPassword} onChange={e => setCoachForm({ ...coachForm, adminPassword: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            </div>

                            {coachStatus.error && <p className="text-xs text-red-400 mt-1">⚠️ {coachStatus.error}</p>}
                            {coachStatus.success && <p className="text-xs text-green-400 mt-1">✅ {coachStatus.success}</p>}

                            <button type="submit" disabled={isCreatingCoach} className="btn-ripple bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold mt-1 transition-all disabled:opacity-50">
                                {isCreatingCoach ? 'Creating...' : 'Create Coach'}
                            </button>
                        </form>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-center" style={{ border: '1px solid var(--border-color)' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                                <span className="text-3xl">🎙️</span>
                            </div>
                            <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Start a New Class</h2>
                            <p className="text-sm text-slate-400 mb-6 max-w-[200px]">Create an instant meeting room for your ALP Astrology Course.</p>
                        </div>

                        {!showCreateCard ? (
                            <button onClick={handleGenerateMeeting} className="btn-ripple bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-500/25 hover:shadow-lg text-white font-bold py-3 px-8 rounded-xl w-full transition-all">
                                🚀 Generate Meeting Link
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3 animate-fade-in w-full">
                                {/* Network link */}
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">📡 Share with students/coaches:</p>
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                        <span className="text-slate-300 text-xs flex-1 truncate">{networkLink || localLink}</span>
                                        <button onClick={() => copyLink(networkLink || localLink, setCopied)}
                                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs font-semibold whitespace-nowrap">
                                            {copied ? '✓ Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/join/${generatedRoomId}?host=true`)} className="btn-primary btn-ripple w-full py-2.5 font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all">
                                    🚀 Start Meeting Now
                                </button>
                                <button onClick={() => { setShowCreateCard(false); setGeneratedRoomId(''); setLocalLink(''); setNetworkLink(''); }}
                                    className="text-slate-400 text-sm text-center hover:text-slate-300 transition-colors w-full mt-1">
                                    Generate new link
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* Additional Actions Row 3 — Create PM Sir */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Create PM Sir Account */}
                    <div className="glass-card p-6" style={{ border: '1px solid rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.03)' }}>
                        <h2 className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">⭐</span> Create PM Sir Account
                        </h2>
                        <p className="text-xs text-amber-400/70 mb-4">PM Sir bypasses all room restrictions — waiting room, lock, and password.</p>
                        <form onSubmit={handleCreatePM} className="flex flex-col gap-3">
                            <input type="text" placeholder="PM Sir Full Name" value={pmForm.displayName} onChange={e => setPmForm({ ...pmForm, displayName: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="text" placeholder="PM ID (Username)" value={pmForm.username} onChange={e => setPmForm({ ...pmForm, username: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="password" placeholder="PM Password" value={pmForm.password} onChange={e => setPmForm({ ...pmForm, password: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />

                            <div className="border-t border-white/10 my-1 pt-3">
                                <p className="text-xs text-slate-400 mb-2 font-semibold">Verify Admin Credentials</p>
                                <input type="text" placeholder="Admin Username" value={pmForm.adminUsername} onChange={e => setPmForm({ ...pmForm, adminUsername: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm mb-3" />
                                <input type="password" placeholder="Admin Password" value={pmForm.adminPassword} onChange={e => setPmForm({ ...pmForm, adminPassword: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            </div>

                            {pmStatus.error && <p className="text-xs text-red-400 mt-1">⚠️ {pmStatus.error}</p>}
                            {pmStatus.success && <p className="text-xs text-green-400 mt-1">✅ {pmStatus.success}</p>}

                            <button type="submit" disabled={isCreatingPM} className="btn-ripple bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold py-2.5 rounded-xl text-sm mt-1 transition-all disabled:opacity-50 hover:shadow-amber-400/25 hover:shadow-lg">
                                {isCreatingPM ? 'Creating...' : '⭐ Create PM Sir Account'}
                            </button>
                        </form>
                    </div>

                    {/* Info Card */}
                    <div className="glass-card p-6 flex flex-col justify-center" style={{ border: '1px solid rgba(251,191,36,0.15)' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                                <span className="text-3xl">⭐</span>
                            </div>
                            <h2 className="font-bold text-lg mb-2 text-amber-300">PM Sir Privileges</h2>
                            <ul className="text-sm text-slate-400 text-left space-y-2 mt-2">
                                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">✓</span> Enters any meeting instantly</li>
                                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">✓</span> Bypasses waiting room</li>
                                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">✓</span> Bypasses locked room restriction</li>
                                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">✓</span> Bypasses meeting password</li>
                                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">✓</span> Can speak in all room modes</li>
                            </ul>
                        </div>
                    </div>
                </div>
                {/* Additional Actions Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Create Student Account */}
                    <div className="glass-card p-6" style={{ border: '1px solid var(--border-color)' }}>
                        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-xl">👩‍🎓</span> Create Student Account
                        </h2>
                        <form onSubmit={handleCreateStudent} className="flex flex-col gap-3">
                            <input type="text" placeholder="Student Full Name" value={studentForm.displayName} onChange={e => setStudentForm({ ...studentForm, displayName: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="text" placeholder="Student ID (Username)" value={studentForm.username} onChange={e => setStudentForm({ ...studentForm, username: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            <input type="password" placeholder="Student Password" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />

                            <div className="border-t border-white/10 my-1 pt-3">
                                <p className="text-xs text-slate-400 mb-2 font-semibold">Verify Admin Credentials</p>
                                <input type="text" placeholder="Admin Username" value={studentForm.adminUsername} onChange={e => setStudentForm({ ...studentForm, adminUsername: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm mb-3" />
                                <input type="password" placeholder="Admin Password" value={studentForm.adminPassword} onChange={e => setStudentForm({ ...studentForm, adminPassword: e.target.value })} required className="meet-input bg-white/5 border-white/10 text-sm" />
                            </div>

                            {studentStatus.error && <p className="text-xs text-red-400 mt-1">⚠️ {studentStatus.error}</p>}
                            {studentStatus.success && <p className="text-xs text-green-400 mt-1">✅ {studentStatus.success}</p>}

                            <button type="submit" disabled={isCreatingStudent} className="btn-ripple bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold mt-1 transition-all disabled:opacity-50">
                                {isCreatingStudent ? 'Creating...' : 'Create Student'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Active Rooms Table */}
                <div className="glass-card overflow-hidden mb-6" style={{ border: '1px solid var(--border-color)' }}>
                    <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>📋 Active Meetings</h2>
                        <button onClick={fetchStats} className="text-xs px-2.5 py-1 rounded-lg text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                            🔄 Refresh
                        </button>
                    </div>
                    {!stats?.rooms?.length ? (
                        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                            <p className="text-3xl mb-2">🎯</p>
                            <p className="text-sm">No active meetings right now</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        {['Room ID', 'Participants', 'Waiting', 'Status', 'Age'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.rooms.map(room => (
                                        <tr key={room.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                                            <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{room.id}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold">
                                                    {room.participantCount} 👥
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {room.waitingCount > 0 ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs">{room.waitingCount} waiting</span>
                                                ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    {room.locked && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-xs">🔒 Locked</span>}
                                                    {room.hasPassword && <span className="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-xs">🔑 Password</span>}
                                                    {!room.locked && !room.hasPassword && <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 text-xs">🔓 Open</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {Math.floor((Date.now() - room.createdAt) / 60000)}m ago
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="glass-card overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                    <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>👤 Registered Users</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    {['Display Name', 'Username', 'Role', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.users || []).map(u => {
                                    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.user;
                                    return (
                                        <tr key={u.id} className="border-b hover:bg-white/3 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                                            <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{u.displayName}</td>
                                            <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>@{u.username}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${rc.bg} ${rc.text} ${rc.border}`}>
                                                    {rc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {u.role !== 'admin' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditModal(u)} className="text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">Edit</button>
                                                        <button onClick={() => openDeleteModal(u)} className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card p-6 w-full max-w-md animate-scale-in" style={{ border: '1px solid var(--border-color)' }}>
                            <h2 className="text-lg font-bold text-white mb-4">Edit User: {editingUser.username}</h2>
                            <form onSubmit={handleUpdateUser} className="flex flex-col gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Display Name</label>
                                    <input type="text" value={editForm.displayName} onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} required className="meet-input bg-white/5 border-white/10 text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Role</label>
                                    <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="meet-input bg-[#1a1a2e] border-white/10 text-sm text-white focus:outline-none w-full px-3 py-2 rounded-xl">
                                        <option value="student">Student</option>
                                        <option value="coach">Coach</option>
                                        <option value="pm">PM Sir ⭐</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">New Password (leave blank to keep current)</label>
                                    <input type="password" placeholder="Enter new password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="meet-input bg-white/5 border-white/10 text-sm" />
                                </div>

                                <div className="border-t border-white/10 my-2 pt-3">
                                    <p className="text-xs text-slate-400 mb-2 font-semibold">Verify Admin Credentials</p>
                                    <input type="text" placeholder="Admin Username" value={editForm.adminUsername} onChange={e => setEditForm(f => ({ ...f, adminUsername: e.target.value }))} required className="meet-input bg-white/5 border-white/10 text-sm mb-3" />
                                    <input type="password" placeholder="Admin Password" value={editForm.adminPassword} onChange={e => setEditForm(f => ({ ...f, adminPassword: e.target.value }))} required className="meet-input bg-white/5 border-white/10 text-sm" />
                                </div>

                                {editStatus.error && <p className="text-xs text-red-400 mt-1">⚠️ {editStatus.error}</p>}
                                {editStatus.success && <p className="text-xs text-green-400 mt-1">✅ {editStatus.success}</p>}

                                <div className="flex gap-2 mt-2">
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                                    <button type="submit" disabled={isEditing} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all disabled:opacity-50">
                                        {isEditing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deletingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card p-6 w-full max-w-sm animate-scale-in" style={{ border: '1px solid var(--border-color)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <div className="flex flex-col items-center mb-4 text-center">
                                <span className="text-4xl mb-2">⚠️</span>
                                <h2 className="text-lg font-bold text-white">Delete User</h2>
                                <p className="text-sm text-slate-400 mt-1">Are you sure you want to delete <strong className="text-red-400">{deletingUser.username}</strong>?</p>
                            </div>

                            <form onSubmit={handleDeleteUser} className="flex flex-col gap-3">
                                <div className="border-t border-white/10 pt-3">
                                    <p className="text-xs text-slate-400 mb-2 font-semibold">Verify Admin Credentials to confirm</p>
                                    <input type="text" placeholder="Admin Username" value={deleteForm.adminUsername} onChange={e => setDeleteForm(f => ({ ...f, adminUsername: e.target.value }))} required className="meet-input bg-white/5 border-white/10 text-sm mb-3" />
                                    <input type="password" placeholder="Admin Password" value={deleteForm.adminPassword} onChange={e => setDeleteForm(f => ({ ...f, adminPassword: e.target.value }))} required className="meet-input bg-white/5 border-white/10 text-sm" />
                                </div>

                                {deleteStatus.error && <p className="text-xs text-red-400 mt-1 text-center">⚠️ {deleteStatus.error}</p>}

                                <div className="flex gap-2 mt-2">
                                    <button type="button" onClick={() => setDeletingUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all">Cancel</button>
                                    <button type="submit" disabled={isDeleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50">
                                        {isDeleting ? 'Deleting...' : 'Delete User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>

            <footer className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                <a href="https://sanstudio.neocities.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">SanStudio</a> · Admin Dashboard
            </footer>
        </div>
    );
}
