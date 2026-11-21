function registerChatIpc(ipcMain) {
  ipcMain.handle("chat:ping", (_event, text) => ({
    reply: "pong" + text,
    receivedAt: new Date().toISOString(),
  }));
}

module.exports = { registerChatIpc };
