function registerChatIpc(ipcMain, { pipe, win }) {
  ipcMain.handle("chat:send", (_event, msg) => {
    pipe.write(JSON.stringify(msg));
  });

  pipe.on("data", (data) => {
    let event;

    try {
      event = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!win.isDestroyed()) {
      win.webContents.send("chat:event", event);
    }
  });
}

module.exports = { registerChatIpc };
