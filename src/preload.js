import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('kaelara', {
  requestPermission: async (action) => {
    return await ipcRenderer.invoke('request-permission', action);
  },
  // Add more IPC calls as needed
});
