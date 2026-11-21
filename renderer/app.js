const statusEl = document.getElementById("status");
const peersEl = document.getElementById("peers");
const log = document.getElementById("log");
const form = document.getElementById("composer");
const input = document.getElementById("message");

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}

function addMessage(msg) {
  const line = document.createElement("div");
  line.textContent = `[${msg.from}] ${msg.nickname} ${formatTime(msg.timestamp)}: ${msg.text}`;
  console.log("msg: ", msg);
  if (msg.mine) line.style.fontWeight = "bold";
  log.append(line);
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
