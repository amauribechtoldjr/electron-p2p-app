const Corestore = require("corestore");
const b4a = require("b4a");
const { shortId, isValidMessage } = require("./protocol.js");

function createStorage(dir, { onMessage }) {
  const store = new Corestore(dir);
  let mine = null;
  let known = null;
  const remotes = new Map();

  async function follow(core, isMine) {
    const from = shortId(core.key);
    let next = 0;

    async function readNew() {
      while (next < core.length) {
        const index = next++;
        const msg = await core.get(index);
        if (isValidMessage(msg)) onMessage(msg, from, isMine);
      }
    }

    core.on("append", () =>
      readNew().catch((err) => console.error(err.message)),
    );

    await readNew();
  }

  function isKnown(hexKey) {
    return remotes.has(hexKey) || hexKey === b4a.toString(mine.key, "hex");
  }

  async function openRemote(hexKey) {
    if (isKnown(hexKey)) return;
    const core = store.get({
      key: b4a.from(hexKey, "hex"),
      valueEncoding: "json",
    });
    remotes.set(hexKey, core);
    await core.ready();
    core.download({ start: 0, end: -1 });
    follow(core, false).catch((err) => console.error(err.message));
  }

  return {
    get key() {
      return mine.key;
    },

    async open(room) {
      mine = store.get({ name: "messages:" + room, valueEncoding: "json" });
      known = store.get({ name: "known:" + room, valueEncoding: "json" });
      await Promise.all([mine.ready(), known.ready()]);

      await follow(mine, true);
      for (let i = 0; i < known.length; i++) {
        openRemote(await known.get(i)).catch((err) =>
          console.error(err.message),
        );
      }
    },

    append(msg) {
      return mine.append(msg);
    },

    async learnKey(key) {
      const hexKey = b4a.toString(key, "hex");
      if (isKnown(hexKey)) return;
      const opening = openRemote(hexKey);
      await known.append(hexKey);
      await opening;
    },

    replicate(socket) {
      store.replicate(socket);
    },

    close() {
      return store.close();
    },
  };
}

module.exports = { createStorage };
