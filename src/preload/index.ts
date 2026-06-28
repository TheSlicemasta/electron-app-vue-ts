import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const databaseAPI = {
  // SQLite CRUD
  createUser: (userData: { name: string; email: string }) =>
    ipcRenderer.invoke('db:create-user', userData),
  getUsers: () => ipcRenderer.invoke('db:get-users'),
  updateUser: (id: number, userData: { name: string; email: string }) =>
    ipcRenderer.invoke('db:update-user', id, userData),
  deleteUser: (id: number) => ipcRenderer.invoke('db:delete-user', id),

  // HTTPS API
  fetchRemoteUsers: () => ipcRenderer.invoke('api:fetch-remote-users')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', databaseAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

export type DatabaseAPI = typeof databaseAPI
