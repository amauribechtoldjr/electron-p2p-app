import { create } from "zustand";

function mergeMessage(messages, msg) {
  if (messages.some((m) => m.id === msg.id)) return messages;
  return [...messages, msg].sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
}

export const useChat = create((set) => ({
  status: "idle",
  room: null,
  nickname: null,
  peers: 0,
  messages: [],
  error: null,

  join(room, nickname) {
    set({ status: "connecting", room, nickname, error: null });
    // preload → Electron main → worker: the worker joins the room's topic
    window.chat.send({ type: "join", room, nickname });
  },

  send(text) {
    // the worker appends it to my Hypercore; it comes back as a "message" event
    window.chat.send({ type: "send", text });
  },

  // events pushed by the worker (worker → Electron main → preload → here)
  handleEvent(event) {
    switch (event.type) {
      case "ready":
        set({ status: "ready", room: event.room, nickname: event.nickname });
        break;
      case "peers":
        set({ peers: event.count });
        break;
      case "message":
        set((state) => ({ messages: mergeMessage(state.messages, event) }));
        break;
      case "error":
        set({ error: event.message });
        break;
    }
  },
}));
