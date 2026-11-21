const FramedStream = require("framed-stream");
const Hyperswarm = require("hyperswarm");
const crypto = require("hypercore-crypto");
const b4a = require("b4a");

const pipe = new FramedStream(Bare.IPC);
const swarm = new Hyperswarm();

const state = { status: "connecting", room: null, nickname: "anon" };
const peers = new Set();
const seen = new Set();
const history = [];

function toUI(event) {
  pipe.write(JSON.stringify(event));
}

function sendPeers() {
  toUI({ type: "peers", count: peers.size });
}

function shortId(key) {
  return b4a.toString(key, "hex").slice(0, 6);
}

function topicFor(room) {
  return crypto.hash(b4a.from("electron-p2p-messages:" + room));
}

function isValidMessage(msg) {
  return (
    msg !== null &&
    typeof msg === "object" &&
    typeof msg.id === "string" &&
    typeof msg.text === "string" &&
    typeof msg.timestamp === "number"
  );
}

function showMessage(msg, from, mine) {
  if (seen.has(msg.id)) return;
  seen.add(msg.id);

  const event = {
    type: "message",
    id: msg.id,
    nickname: String(msg.nickname || "anon"),
    text: msg.text,
    timestamp: msg.timestamp,
    from,
    mine,
  };

  history.push(event);
  toUI(event);
}

swarm.on("connection", (socket, info) => {
  const from = shortId(info.publicKey);
  peers.add(socket);
  sendPeers();

  socket.on("data", (data) => {
    let msg;
    try {
      msg = JSON.parse(b4a.toString(data));
    } catch {
      return; // not JSON: ignore
    }
    if (isValidMessage(msg)) showMessage(msg, from, false);
  });

  socket.on("error", (err) => console.error("socket error:", err.message));
  socket.on("close", () => {
    peers.delete(socket);
    sendPeers();
  });
});

async function start(room) {
  state.room = room;
  const discovery = swarm.join(topicFor(room), { client: true, server: true });
  await discovery.flushed();
  state.status = "ready";
  toUI({ type: "ready", room, nickname: state.nickname });
}

function sendMessage(text) {
  const msg = {
    id: b4a.toString(crypto.randomBytes(8), "hex"),
    nickname: state.nickname,
    text,
    timestamp: Date.now(),
  };

  const data = JSON.stringify(msg);
  for (const socket of peers) socket.write(data);

  showMessage(msg, shortId(swarm.keyPair.publicKey), true);
}

async function shutdown() {
  await swarm.destroy();
  Bare.exit(0);
}

pipe.on("data", (data) => {
  let msg;
  try {
    msg = JSON.parse(data.toString());
  } catch {
    return;
  }

  if (msg.type === "sync") {
    if (state.status === "ready") {
      toUI({ type: "ready", room: state.room, nickname: state.nickname });
    }
    sendPeers();
    for (const event of history) toUI(event);
  } else if (msg.type === "send") {
    const text = typeof msg.text === "string" ? msg.text.trim() : "";
    if (text) sendMessage(text);
  } else if (msg.type === "shutdown") {
    shutdown();
  }
});

start("lobby").catch((err) => toUI({ type: "error", message: err.message }));
