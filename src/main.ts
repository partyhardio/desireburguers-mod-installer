import { app, BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'fs-extra';

const isDev = !app.isPackaged;
//imprimir paths
const clearAppPath = app.getAppPath().replace('resouces\\app.asar', '');
console.log('app.isPackaged:', app.isPackaged);
console.log('App Path:', clearAppPath);
console.log('App Path:', app.getAppPath());
console.log('Resources Path:', process.resourcesPath);
console.log('App Data Path:', app.getPath('appData'));
console.log('User Data Path:', app.getPath('userData'));

const LOCAL_MOD_PATH = isDev ? app.getAppPath() : process.resourcesPath
const GAME_FOLDER = 'DesiresBurgers';
const MOD_FOLDER = 'mods';
const MODS_PATH = path.join(LOCAL_MOD_PATH, MOD_FOLDER);

const INSTALL_PATH = path.join(app.getPath('appData'), GAME_FOLDER, MOD_FOLDER);

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

//  mainWindow.webContents.openDevTools();
};
ipcMain.handle("get-default-mod-path", () => {
  return INSTALL_PATH;
});

const copyAssets = async (source: string, destination: string) => {
  try {
    console.log(`Copying assets from ${source} to ${destination}`);
    await fs.ensureDir(destination);
    await fs.copy(source, destination, { overwrite: true });
    console.log('Assets copied successfully');

    return { success: true };
  } catch (error) {
    console.error('Error copying assets:', error);
    return { success: false, error: error.message };
  }
};

ipcMain.handle("copy-assets-to-path", async (event: IpcMainInvokeEvent, modPath: string) => {
  const result = await copyAssets(path.join(MODS_PATH, modPath), path.join(INSTALL_PATH, modPath));
  return result;
});

ipcMain.handle("get-mod-list", async (event: IpcMainInvokeEvent) => {
  const fs = require('fs');
  const modList: string[] = [];
  try {
    const files = await fs.promises.readdir(MODS_PATH);
    for (const file of files) {
      const modPath = path.join(MODS_PATH, file);
      const stat = await fs.promises.stat(modPath);
      if (stat.isDirectory()) {
        const modInfoPath = path.join(modPath, 'mod.json');
        if (fs.existsSync(modInfoPath)) {
          const modInfo = JSON.parse(await fs.promises.readFile(modInfoPath, 'utf-8'));
          modList.push({installPath: file, ...modInfo});
        }
      }
    }
  } catch (error) {
    console.error('Error reading mod directory:', error);
  }
  return modList;
});


app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

