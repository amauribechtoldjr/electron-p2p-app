const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { registerChatIpc } = require("./ipc/chat");

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // runs before the page loads; the only bridge between the renderer and main
      preload: path.join(__dirname, "preload.js"),
      // preload and page run in different contexts, so changes to "window" or "Array.prototype"
      // in the renderer don't affect the preload
      contextIsolation: true,
      // runs the renderer in Chromium's sandbox with reduced OS permissions;
      // the preload can only require a few modules (e.g. "electron"), not Node's
      sandbox: true,
      // doesn't expose "require", "fs", "process" to avoid malicious script on the renderer
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
});

app.on("window-all-closed", () => app.quit());

registerChatIpc(ipcMain);
