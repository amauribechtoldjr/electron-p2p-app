const { createIpc } = require("./ipc.js");
const { createChat } = require("./chat.js");
const { createNetwork } = require("./network.js");
const { createMessage } = require("./protocol.js");

const ipc = createIpc(Bare.IPC);
const chat = createChat(ipc.send);
const network = createNetwork({
  onPeers: (count) => chat.setPeers(count),
  onMessage: (msg, from) => chat.addMessage(msg, from, false),
});

async function start(room) {
  chat.setConnecting(room);
  await network.join(room);
  chat.setReady();
}

ipc.on("sync", () => chat.replay());

ipc.on("send", ({ text }) => {
  const clean = typeof text === "string" ? text.trim() : "";
  if (!clean) return;
  const msg = createMessage(chat.state.nickname, clean);
  network.broadcast(msg);
  chat.addMessage(msg, network.id, true);
});

ipc.on("shutdown", async () => {
  await network.destroy();
  Bare.exit(0);
});

start("lobby").catch((err) => chat.error(err));
