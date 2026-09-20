/* Fenster für den Böllerladen Simulator.
   Die Seite wird über ein eigenes Protokoll app:// ausgeliefert und nicht
   über file://. Nur so bekommt sie einen stabilen Origin, an dem der
   Spielstand im localStorage zuverlässig hängen bleibt. */
const { app, BrowserWindow, protocol, net, shell } = require('electron');
const path = require('node:path');
const url = require('node:url');

const ROOT = path.join(__dirname, 'app');

/* Muss vor app.whenReady() stehen. */
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
}]);

/* Falls das Steam-Overlay spinnt: die nächste Zeile einkommentieren.
   Steam klinkt sich in die Grafikausgabe ein und findet sie sonst im
   eigenen GPU-Prozess von Electron nicht. */
// app.commandLine.appendSwitch('in-process-gpu');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0b1020',
    show: false,
    autoHideMenuBar: true,
    title: 'Böllerladen Simulator',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });

  win.removeMenu();
  win.once('ready-to-show', () => win.show());

  /* Zeigerfang für die Maussteuerung ohne Rückfrage erlauben. */
  win.webContents.on('select-bluetooth-device', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    shell.openExternal(u);
    return { action: 'deny' };
  });

  /* F11 schaltet Vollbild, Strg+Shift+I öffnet die Entwicklerkonsole. */
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.toggleDevTools(); e.preventDefault();
    }
  });

  win.loadURL('app://local/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    /* Kein Ausbrechen aus dem app-Ordner. */
    const target = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
    if (!target.startsWith(ROOT)) return new Response('forbidden', { status: 403 });
    return net.fetch(url.pathToFileURL(target).toString());
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
