const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkInstalled: (programId) => ipcRenderer.invoke('check-installed', programId),
  installProgram: (program) => ipcRenderer.invoke('install-program', program),
  installMultiple: (programs) => ipcRenderer.invoke('install-multiple', programs),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  addCustomProgram: (programData) => ipcRenderer.invoke('add-custom-program', programData),
  onInstallProgress: (callback) => ipcRenderer.on('install-progress', (event, data) => callback(data))
});
