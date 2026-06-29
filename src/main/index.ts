import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import database from 'better-sqlite3'
import { initDatabase } from './db'

// Инициализируем БД в папке userData пользователя
const db = new database(`${app.getPath('userData')}/database.db`)
db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)')

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Слушатель для работы с БД
ipcMain.handle('db:save', async (_event, userData) => {
  const stmt = db.prepare('INSERT INTO users (name) VALUES (?)')
  const info = stmt.run(userData.name)
  return { success: true, id: info.lastInsertRowid }
})

// Confirm
ipcMain.handle('app:show-confirm', async (_event, message: string) => {
  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Отмена', 'Да'], // Кнопка 0 и Кнопка 1
    defaultId: 0,
    title: 'Подтверждение',
    message: message,
    cancelId: 0
  })

  // Возвращает true, если нажали "Да, удалить" (индекс 1)
  return result.response === 1
})

// Alert
ipcMain.handle('app:show-alert', async (_event, { type, title, message }) => {
  const focusedWindow = BrowserWindow.getFocusedWindow()
  dialog.showMessageBox(focusedWindow!, {
    type: type || 'info', // 'error', 'info', 'warning'
    title: title || 'Система',
    message: message,
    buttons: ['ОК']
  })
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  initDatabase()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
