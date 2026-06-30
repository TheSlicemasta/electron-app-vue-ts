import { BrowserWindow, ipcMain } from 'electron'
import WebSocket from 'ws' // Убедитесь, что выполнили `npm install ws`

let ws: WebSocket | null = null

export function initWebSocket(mainWindow: BrowserWindow): void {
  // 1. Обработка команды "Подключиться" из Vue
  ipcMain.handle('socket:connect', async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return { success: true, message: 'Уже подключен' }
    }

    try {
      // Подключаемся к надежному публичному эхо-серверу piehost
      //   ws = new WebSocket('wss://://piesocket.com')
      ws = new WebSocket('wss://echo.websocket.org')

      ws.on('open', () => {
        // Оповещаем Vue о том, что сокет успешно открыт
        mainWindow.webContents.send('socket:on-status', 'connected')
      })

      ws.on('message', (data) => {
        // Пересылаем массив байт от сервера, превратив его в строку
        mainWindow.webContents.send('socket:on-message', data.toString())
      })

      ws.on('close', () => {
        mainWindow.webContents.send('socket:on-status', 'disconnected')
        ws = null
      })

      ws.on('error', (err) => {
        mainWindow.webContents.send('socket:on-status', `error: ${err.message}`)
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 2. Обработка команды "Отправить сообщение" из Vue
  ipcMain.handle('socket:send', async (_event, message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message)
      return { success: true }
    }
    return { success: false, error: 'Нет соединения с сервером' }
  })

  // 3. Обработка команды "Отключиться"
  ipcMain.handle('socket:disconnect', () => {
    if (ws) {
      ws.close()
      ws = null
    }
    return { success: true }
  })
}
