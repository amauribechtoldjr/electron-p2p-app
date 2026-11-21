const Hyperswarm = require("hyperswarm");
const b4a = require("b4a");
const { topicFor, shortId, isValidMessage } = require("./protocol.js");

function createNetwork({ onPeers, onMessage }) {
  const swarm = new Hyperswarm();
  const sockets = new Set();

  swarm.on("connection", (socket, info) => {
    const from = shortId(info.publicKey);
    sockets.add(socket);
    onPeers(sockets.size);

    socket.on("data", (data) => {
      let msg;
      try {
        msg = JSON.parse(b4a.toString(data));
      } catch {
        return;
      }
      if (isValidMessage(msg)) onMessage(msg, from);
    });

    socket.on("error", (err) => console.error("socket error:", err.message));

    socket.on("close", () => {
      sockets.delete(socket);
      onPeers(sockets.size);
    });
  });

  return {
    id: shortId(swarm.keyPair.publicKey),

    async join(room) {
      const discovery = swarm.join(topicFor(room), { client: true, server: true });
      await discovery.flushed();
    },

    broadcast(msg) {
      const data = JSON.stringify(msg);
      for (const socket of sockets) socket.write(data);
    },

    destroy() {
      return swarm.destroy();
    },
  };
}

module.exports = { createNetwork };
