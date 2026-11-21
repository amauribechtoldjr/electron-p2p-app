const { createIpc } = require("./ipc.js");
const { createChat } = require("./chat.js");
const { createStorage } = require("./storage.js");
const { createNetwork } = require("./network.js");
const { createMessage } = require("./protocol.js");

function readStorageArg() {
  const args = Bare.argv.slice(2);
  const index = args.indexOf("--storage");
  if (index === -1) throw new Error("missing --storage argument");
  return args[index + 1];
}

const storageDir = readStorageArg();
console.log("storage:", storageDir);

const ipc = createIpc(Bare.IPC);
const chat = createChat(ipc.send);
const storage = createStorage(storageDir, {
  onMessage: (msg, from, mine) => chat.addMessage(msg, from, mine),
});

const network = createNetwork({
  storage,
  onPeers: (count) => chat.setPeers(count),
});

async function start(room) {
  chat.setConnecting(room);
  await storage.open(room);
  await network.join(room);
  chat.setReady();
}

ipc.on("sync", () => chat.replay());

ipc.on("send", ({ text }) => {
  const clean = typeof text === "string" ? text.trim() : "";
  if (!clean) return;
  // no chat.addMessage here: storage sees the append and reports it,
  // and replication delivers it to every peer that follows my core
  storage
    .append(createMessage(chat.state.nickname, clean))
    .catch((err) => chat.error(err));
});

ipc.on("shutdown", async () => {
  await network.destroy();
  await storage.close();
  Bare.exit(0);
});

start("lobby").catch((err) => chat.error(err));
