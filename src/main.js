const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;
let pendingUpdate = null; // Store update info if page not ready yet

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
    // Inject version
    mainWindow.webContents.executeJavaScript(
      `document.getElementById('app-version').textContent = 'v${app.getVersion()}';`
    );
    // If update was found before page loaded, send it now
    if (pendingUpdate) {
      log.info('Sending pending update to page:', pendingUpdate.version);
      mainWindow.webContents.send('update-available', pendingUpdate);
      pendingUpdate = null;
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function setupUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    const payload = {
      version: info.version,
      releaseNotes: info.releaseNotes || 'Ameliorations et corrections.'
    };
    // Check if page is ready
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
      mainWindow.webContents.send('update-available', payload);
    } else {
      // Store for later when page finishes loading
      pendingUpdate = payload;
      log.info('Page not ready, storing update for later');
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available. Current:', app.getVersion(), 'Latest:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info('Download progress:', progress.percent);
    if (mainWindow) mainWindow.webContents.send('update-progress', Math.round(progress.percent));
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    log.error('Updater error:', err);
  });

  // Check after 5 seconds to make sure page is loaded
  setTimeout(() => {
    log.info('Starting update check...');
    autoUpdater.checkForUpdates();
  }, 5000);
}

ipcMain.on('download-update', () => {
  log.info('User requested download');
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  log.info('User requested install');
  autoUpdater.quitAndInstall();
});

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
