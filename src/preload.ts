import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getDefaultModPath: () => {
    return ipcRenderer.invoke("get-default-mod-path");
  },
  copyAssetsToPath: (modPath) => {
    return ipcRenderer.invoke("copy-assets-to-path", modPath);
  },
  getModList: () => {
    return ipcRenderer.invoke("get-mod-list");
  }
});
