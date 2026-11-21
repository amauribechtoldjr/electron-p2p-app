const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("chat", {
  ping: (text) => ipcRenderer.invoke("chat:ping", text),
});
