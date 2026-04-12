import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args) {
    const [channel, ...rest] = args
    return ipcRenderer.off(channel, ...rest)
  },
  send(...args) {
    const [channel, ...rest] = args
    return ipcRenderer.send(channel, ...rest)
  },
  invoke(...args) {
    const [channel, ...rest] = args
    return ipcRenderer.invoke(channel, ...rest)
  },

  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard-read'),
    writeText: (text) => ipcRenderer.send('clipboard-write', text)
  },

  // File helpers used by TTS / ASR actions
  saveTempFile: (data, ext) => ipcRenderer.invoke('save-temp-file', { data, ext }),
  readFileBase64: (filePath) => ipcRenderer.invoke('read-file-base64', filePath),
  playAudio: (filePath) => ipcRenderer.send('play-audio', filePath),
  revealInFolder: (filePath) => ipcRenderer.send('reveal-in-folder', filePath),
  downloadUrl: (url, fileName) => ipcRenderer.invoke('download-url', { url, fileName }),

  // Shortcut Discovery
  discoverShortcuts: () => ipcRenderer.invoke('discover-shortcuts'),

  // Import / Export
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // FS Storage
  store: {
    saveShortcuts: (data) => ipcRenderer.invoke('store-save-shortcuts', data),
    loadShortcuts: () => ipcRenderer.invoke('store-load-shortcuts'),
    saveConfig: (data) => ipcRenderer.invoke('store-save-config', data),
    loadConfig: () => ipcRenderer.invoke('store-load-config'),
  }
})



