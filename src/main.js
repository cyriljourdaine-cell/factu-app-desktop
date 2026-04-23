const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Auto updater ──
function setupUpdater() {
  autoUpdater.autoDownload = false; // on télécharge seulement si l'user accepte
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => {
    // Envoie les infos de la MAJ à la fenêtre
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes || 'Améliorations et corrections.'
    });
  });

  autoUpdater.on('update-not-available', () => {
    // Silencieux — pas de MAJ dispo
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('update-progress', Math.round(progress.percent));
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    console.error('Updater error:', err);
  });

  // Vérifier les MAJ au démarrage (après 3 secondes)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
}

// IPC — l'utilisateur clique "Mettre à jour"
ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

// IPC — l'utilisateur clique "Installer maintenant"
ipcMain.on('install-update', () => {
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
