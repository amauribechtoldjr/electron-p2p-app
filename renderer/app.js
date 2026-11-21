const statusEl = document.getElementById("status");
const peersEl = document.getElementById("peers");
const log = document.getElementById("log");
const form = document.getElementById("composer");
const input = document.getElementById("message");

const messages = new Map();

function sortMessages(list) {
  return list.sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
}

function render() {
  const lines = sortMessages([...messages.values()]).map((msg) => {
    const line = document.createElement("div");
    line.textContent = `[${msg.from}] ${msg.nickname} ${formatTime(msg.timestamp)}: ${msg.text}`;
    if (msg.mine) line.style.fontWeight = "bold";
    return line;
  });
  log.replaceChildren(...lines);
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function addMessage(msg) {
  if (messages.has(msg.id)) return; // the same message can arrive twice (e.g. sync replay)
  messages.set(msg.id, msg);
  render();
}

window.chat.onEvent((event) => {
  if (event.type === "ready")
    statusEl.textContent = `connected to #${event.room}`;
  else if (event.type === "peers")
    peersEl.textContent = `peers: ${event.count}`;
  else if (event.type === "message") addMessage(event);
  else if (event.type === "error")
    statusEl.textContent = `error: ${event.message}`;
});

form.addEventListener("submit", (e) => {
  e.preventDefault(); // a form submit would reload the page
  const text = input.value.trim();
  if (!text) return;
  window.chat.send({ type: "send", text });
  input.value = "";
});

// listen first, then ask for the current state
window.chat.send({ type: "sync" });
