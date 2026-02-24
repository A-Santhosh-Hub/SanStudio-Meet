// Generates a human-readable meeting ID like: abc-def-ghi
export function generateRoomId() {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    const segment = (len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export function formatRoomId(raw) {
    const clean = raw.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (clean.length >= 10) {
        return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 10)}`;
    }
    return raw;
}
