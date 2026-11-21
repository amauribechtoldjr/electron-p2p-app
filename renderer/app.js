const button = document.getElementById("sendBtn");
const msgInput = document.getElementById("message");
const log = document.getElementById("log");

button.addEventListener("click", async () => {
  const r = await window.chat.ping(msgInput.value);

  log.textContent += r.reply + " (" + r.receivedAt + ")\n";
});
