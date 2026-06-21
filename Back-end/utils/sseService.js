// sseService.js
// Manager for real-time Server-Sent Events (SSE) connections scoped by user.

// Map to track active HTTP response objects: userId -> [resObjects]
const activeClients = new Map();

const addClient = (userId, res) => {
  const idStr = userId.toString();
  if (!activeClients.has(idStr)) {
    activeClients.set(idStr, []);
  }
  activeClients.get(idStr).push(res);
  console.log(`[SSE] Connection established for user: ${idStr}. Active tabs: ${activeClients.get(idStr).length}`);
};

const removeClient = (userId, res) => {
  const idStr = userId.toString();
  if (!activeClients.has(idStr)) return;
  const list = activeClients.get(idStr);
  const index = list.indexOf(res);
  if (index !== -1) {
    list.splice(index, 1);
  }
  if (list.length === 0) {
    activeClients.delete(idStr);
  }
  console.log(`[SSE] Connection closed for user: ${idStr}. Remaining tabs: ${list.length}`);
};

const emitToUser = (userId, eventName, data) => {
  const idStr = userId.toString();
  if (!activeClients.has(idStr)) {
    console.log(`[SSE] Skipped emission to user ${idStr}: No active tabs.`);
    return;
  }
  const list = activeClients.get(idStr);
  const messageStr = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  list.forEach(res => {
    try {
      res.write(messageStr);
    } catch (err) {
      console.error(`[SSE] Write failure on socket for user ${idStr}:`, err.message);
    }
  });
};

module.exports = {
  addClient,
  removeClient,
  emitToUser
};
