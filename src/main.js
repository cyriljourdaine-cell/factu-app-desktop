const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;
let pendingUpdate = null;
let pageReady = false;

function sendUpdateToPage(payload) {
  if (mainWindow && pageReady) {
    log.info('Sending update to page:', payload.version);
    mainWindow.webContents.send('update-available', payload);
  } else {
    log.info('Page not ready yet, storing update:', payload.version);
    pendingUpdate = payload;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'factu.app',
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `document.getElementById('app-version').textContent = 'v${app.getVersion()}';`
    );
    // Wait 2 seconds for JS listeners to register, then mark page as ready
    setTimeout(() => {
      pageReady = true;
      log.info('Page ready');
      if (pendingUpdate) {
        log.info('Sending pending update:', pendingUpdate.version);
        mainWindow.webContents.send('update-available', pendingUpdate);
        pendingUpdate = null;
      }
    }, 2000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function setupUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => log.info('Checking for update...'));

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    sendUpdateToPage({
      version: info.version,
      releaseNotes: info.releaseNotes || 'Ameliorations et corrections.'
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('No update. Current:', app.getVersion(), 'Latest:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info('Download:', progress.percent + '%');
    if (mainWindow) mainWindow.webContents.send('update-progress', Math.round(progress.percent));
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => log.error('Updater error:', err));

  // Check after 5 seconds
  setTimeout(() => {
    log.info('Starting update check...');
    autoUpdater.checkForUpdates();
  }, 5000);
}

ipcMain.on('download-update', () => { log.info('Download requested'); autoUpdater.downloadUpdate(); });
ipcMain.on('install-update', () => { log.info('Install requested'); autoUpdater.quitAndInstall(); });

app.whenReady().then(() => {
  createWindow();
  setupUpdater();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
