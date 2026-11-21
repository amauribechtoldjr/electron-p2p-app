const PearRuntime = require("pear-runtime");
const FramedStream = require("framed-stream");

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { registerChatIpc } = require("./ipc/chat");

let quitting = false;
let workerExited = false;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

const storage = path.resolve(
  argValue("--storage") ||
    path.join(app.getPath("appData"), "electron-p2p-messages"),
);

app.setPath("userData", path.join(storage, "electron"));

const worker = PearRuntime.run(require.resolve("../workers/main.js"), [
  "--storage",
  path.join(storage, "corestore"),
]);

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
  if (quitting || workerExited) return;
  quitting = true;
  event.preventDefault();

  pipe.write(JSON.stringify({ type: "shutdown" }));
  const fallback = setTimeout(() => worker.destroy(), 3000);

  worker.once("exit", () => {
    clearTimeout(fallback);
    app.quit();
  });
});

worker.stdout.on("data", (d) => console.log("worker:", d.toString().trim()));
worker.stderr.on("data", (d) =>
  console.error("worker err:", d.toString().trim()),
);
