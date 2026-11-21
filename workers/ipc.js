const FramedStream = require("framed-stream");

function createIpc(stream) {
  const pipe = new FramedStream(stream);
  const handlers = new Map();

  pipe.on("data", (data) => {
    let command;
    try {
      command = JSON.parse(data.toString());
    } catch {
      return;
    }
    const handler = handlers.get(command.type);
    if (handler) handler(command);
  });

  return {
    send(event) {
      pipe.write(JSON.stringify(event));
    },
    on(type, handler) {
      handlers.set(type, handler);
    },
  };
}

module.exports = { createIpc };
