const PearRuntime = require("pear-runtime");
const FramedStream = require("framed-stream");

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { registerChatIpc } = require("./ipc/chat");

let quitting = false;
let workerExited = false;

const worker = PearRuntime.run(require.resolve("../workers/main.js"), []);

worker.on("exit", () => {
  workerExited = true;
});

const pipe = new FramedStream(worker);

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

  registerChatIpc(ipcMain, { pipe, win });
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", (event) => {
  if (quitting || workerExited) return; // second pass, or nothing to wait for
  quitting = true;
  event.preventDefault(); // hold the quit until the worker is gone

  pipe.write(JSON.stringify({ type: "shutdown" }));
  const fallback = setTimeout(() => worker.destroy(), 3000); // kills bare.exe

  worker.once("exit", () => {
    clearTimeout(fallback);
    app.quit(); // runs before-quit again, which now lets it through
  });
});

worker.stdout.on("data", (d) => console.log("worker:", d.toString().trim()));
worker.stderr.on("data", (d) =>
  console.error("worker err:", d.toString().trim()),
);
