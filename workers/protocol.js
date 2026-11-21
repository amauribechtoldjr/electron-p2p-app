const crypto = require("hypercore-crypto");
const b4a = require("b4a");

function topicFor(room) {
  return crypto.hash(b4a.from("electron-p2p-messages:" + room));
}

function shortId(key) {
  return b4a.toString(key, "hex").slice(0, 6);
}

function createMessage(nickname, text) {
  return {
    id: b4a.toString(crypto.randomBytes(8), "hex"),
    nickname,
    text,
    timestamp: Date.now(),
  };
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

module.exports = { topicFor, shortId, createMessage, isValidMessage };
