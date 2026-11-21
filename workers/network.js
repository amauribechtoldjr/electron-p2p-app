const Hyperswarm = require("hyperswarm");
const Protomux = require("protomux");
const compactEncoding = require("compact-encoding");
const { topicFor } = require("./protocol.js");

function createNetwork({ storage, onPeers }) {
  const swarm = new Hyperswarm();
  const sockets = new Set();

  function exchangeKeys(socket) {
    const mux = Protomux.from(socket);
    const channel = mux.createChannel({
      protocol: "electron-p2p-messages/keys",
      onopen() {
        keyMessage.send(storage.key);
      },
    });
    if (!channel) return;

    const keyMessage = channel.addMessage({
      encoding: compactEncoding.fixed32,
      onmessage: (key) =>
        storage.learnKey(key).catch((err) => console.error(err.message)),
    });
    channel.open();
  }

  swarm.on("connection", (socket) => {
    sockets.add(socket);
    onPeers(sockets.size);

    socket.on("error", (err) => console.error("socket error:", err.message));
    socket.on("close", () => {
      sockets.delete(socket);
      onPeers(sockets.size);
    });

    storage.replicate(socket);
    exchangeKeys(socket);
  });

  return {
    async join(room) {
      const discovery = swarm.join(topicFor(room), {
        client: true,
        server: true,
      });

      await discovery.flushed();
    },

    destroy() {
      return swarm.destroy();
    },
  };
}

module.exports = { createNetwork };
