const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation
  navigateTo: (path) => ipcRenderer.send('navigate-to', path),
  
  // Chat management
  newChat: () => ipcRenderer.send('new-chat'),
  
  // Settings
  openSettings: () => ipcRenderer.send('open-settings'),
  
  // Platform info
  platform: process.platform,
  
  // App info
  appVersion: process.env.npm_package_version || '1.0.0'
});