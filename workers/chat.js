function createChat(emit) {
  const state = { status: "idle", room: null, nickname: "anon", peers: 0 };
  const seen = new Set();
  const history = [];

  function readyEvent() {
    return { type: "ready", room: state.room, nickname: state.nickname };
  }

  return {
    state,

    setConnecting(room, nickname) {
      state.status = "connecting";
      state.room = room;
      if (nickname) state.nickname = nickname;
    },

    setReady() {
      state.status = "ready";
      emit(readyEvent());
    },

    setPeers(count) {
      state.peers = count;
      emit({ type: "peers", count });
    },

    addMessage(msg, from, mine) {
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
      emit(event);
    },

    error(err) {
      emit({ type: "error", message: err.message });
    },

    replay() {
      if (state.status === "ready") emit(readyEvent());
      emit({ type: "peers", count: state.peers });
      for (const event of history) emit(event);
    },
  };
}

module.exports = { createChat };
