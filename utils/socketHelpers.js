// utils/socketHelpers.js
// Small helpers to interact with onlineUsers map (kept inside socket.js).
export const safeString = (v) => (v ? String(v) : v);
