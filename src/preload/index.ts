import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const appAPI = {
  // #2 SQLite CRUD
  createUser: (userData: { name: string; email: string }) =>
    ipcRenderer.invoke('db:create-user', userData),
  getUsers: () => ipcRenderer.invoke('db:get-users'),
  updateUser: (id: number, userData: { name: string; email: string }) =>
    ipcRenderer.invoke('db:update-user', id, userData),
  deleteUser: (id: number) => ipcRenderer.invoke('db:delete-user', id),

  // #3 HTTPS API
  fetchRemoteUsers: () => ipcRenderer.invoke('api:fetch-remote-users'),

  // App helpers: Dialog Confirm, Alert
  showConfirm: (message: string) => ipcRenderer.invoke('app:show-confirm', message),
  showAlert: (params: { type: string; title: string; message: string }) =>
    ipcRenderer.invoke('app:show-alert', params),

  // #4 Sockets
  onWsData: (callback) => ipcRenderer.on('ws-data-received', (_event, value) => callback(value)),
  offWsData: () => ipcRenderer.removeAllListeners('ws-data-received'),

  // #5 web socket
  // Функции-действия (Vue -> Main)
  WS_connect: () => ipcRenderer.invoke('socket:connect'),
  WS_disconnect: () => ipcRenderer.invoke('socket:disconnect'),
  WS_send: (msg: string) => ipcRenderer.invoke('socket:send', msg),

  // Функции-слушатели событий (Main -> Vue)
  WS_onStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('socket:on-status', (_event, status) => callback(status))
  },
  WS_onMessage: (callback: (msg: string) => void) => {
    ipcRenderer.on('socket:on-message', (_event, msg) => callback(msg))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', appAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = appAPI
}

export type AppAPI = typeof appAPI
