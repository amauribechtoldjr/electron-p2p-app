const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("chat", {
  send: (msg) => ipcRenderer.invoke("chat:send", msg),
  onEvent: (listener) => {
    const handler = (_event, data) => listener(data);
    ipcRenderer.on("chat:event", handler);
    return () => ipcRenderer.removeListener("chat:event", handler);
  },
});
