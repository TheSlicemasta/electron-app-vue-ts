import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Метод для вызова БД
  saveToDb: (userData) => ipcRenderer.invoke('db:save', userData),

  // Метод для безопасного HTTPS запроса через Node.js
  fetchExternalApi: (url) => ipcRenderer.invoke('api:request', url),

  // Db create user
  createUser: (userData: { name: string; email: string }) =>
    ipcRenderer.invoke('db:create-user', userData),

  // Db get user
  getUsers: () => ipcRenderer.invoke('db:get-users')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type WinApi = typeof api
