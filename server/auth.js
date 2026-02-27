// In-memory user store — Education Platform Roles
// student | coach | admin | pm
//
// Demo accounts:
//   admin   / admin123   → admin
//   coach   / coach123   → coach
//   student / student123 → student
//   pm      / pm123      → pm  (PM Sir — instant room access)

const users = new Map();

const seed = [
    { id: 'usr_admin', username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' },
    { id: 'usr_coach', username: 'coach', password: 'coach123', role: 'coach', displayName: 'Default Coach' },
    { id: 'usr_student', username: 'student', password: 'student123', role: 'student', displayName: 'Demo Student' },
    { id: 'usr_pm', username: 'pm', password: 'pm123', role: 'pm', displayName: 'PM Sir' },
];
seed.forEach(u => users.set(u.username, u));

function generateId() {
    return 'usr_' + Math.random().toString(36).slice(2, 10);
}

const AuthManager = {

    login(username, password) {
        const user = users.get(username);
        if (!user) return { error: 'User not found' };
        if (user.password !== password) return { error: 'Incorrect password' };
        return { user: sanitize(user) };
    },

    // Promote/demote a user role (admin action)
    setRole(username, newRole) {
        const user = users.get(username);
        if (!user) return { error: 'User not found' };
        user.role = newRole;
        return { user: sanitize(user) };
    },

    // Create a new coach account (admin action)
    createCoach(username, password, displayName) {
        if (users.has(username)) return { error: 'Username already taken' };
        if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' };
        if (!password || password.length < 4) return { error: 'Password must be at least 4 characters' };
        const user = { id: generateId(), username, password, role: 'coach', displayName: displayName || username };
        users.set(username, user);
        return { user: sanitize(user) };
    },

    // Create a new student account (admin action)
    createStudent(username, password, displayName) {
        if (users.has(username)) return { error: 'Username already taken' };
        if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' };
        if (!password || password.length < 4) return { error: 'Password must be at least 4 characters' };
        const user = { id: generateId(), username, password, role: 'student', displayName: displayName || username };
        users.set(username, user);
        return { user: sanitize(user) };
    },

    // Create a new PM account (admin action)
    createPM(username, password, displayName) {
        if (users.has(username)) return { error: 'Username already taken' };
        if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' };
        if (!password || password.length < 4) return { error: 'Password must be at least 4 characters' };
        const user = { id: generateId(), username, password, role: 'pm', displayName: displayName || username };
        users.set(username, user);
        return { user: sanitize(user) };
    },

    // Update user details (admin action)
    updateUser(username, updates) {
        const user = users.get(username);
        if (!user) return { error: 'User not found' };

        // Update allowed fields
        if (updates.displayName) user.displayName = updates.displayName;
        if (updates.password) user.password = updates.password;
        if (updates.role) user.role = updates.role;

        return { user: sanitize(user) };
    },

    // Delete user (admin action) — cannot delete admin or the default pm seed
    deleteUser(username) {
        if (!users.has(username)) return { error: 'User not found' };
        const user = users.get(username);
        if (user.role === 'admin') return { error: 'Cannot delete admin account' };
        users.delete(username);
        return { success: true };
    },

    getAll() { return [...users.values()].map(sanitize); },
    get(username) { const u = users.get(username); return u ? sanitize(u) : null; },
    getById(id) {
        for (const u of users.values()) {
            if (u.id === id) return sanitize(u);
        }
        return null;
    },
    count() { return users.size; },
};

function sanitize(u) {
    const { password, ...safe } = u;
    return safe;
}

module.exports = { AuthManager };
