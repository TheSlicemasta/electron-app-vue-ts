import { WebSocketServer, WebSocket } from 'ws'
import { BrowserWindow } from 'electron'

let wss: WebSocketServer | null = null

export function initSocket(mainWindow: BrowserWindow): void {
  // Запускаем WebSocket-сервер на порту 8080
  wss = new WebSocketServer({ port: 8080 })

  console.log('LOG: WebSocket server started on ws://localhost:8080')

  wss.on('connection', (ws: WebSocket) => {
    console.log('LOG: New WebSocket client connected')

    // 1. Обработка входящих сообщений от WebSocket-клиента
    ws.on('message', (message: string) => {
      console.log(`LOG: Received WebSocket message: ${message}`)

      try {
        const parsedData = JSON.parse(message.toString())

        // Отправляем данные прямиком в интерфейс Vue (Renderer Process)
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ws-data-received', parsedData)
        }
      } catch (e) {
        // Если пришел обычный текст, а не JSON
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ws-data-received', { text: message.toString() })
        }
      }
    })

    // Обработка отключения клиента
    ws.on('close', () => {
      console.log('LOG: WebSocket client disconnected')
    })

    // Обработка ошибок соединения
    ws.on('error', (error) => {
      console.error('WS Error:', error)
    })

    // Пример отправки приветственного сообщения клиенту при подключении
    ws.send(JSON.stringify({ status: 'connected', message: 'Welcome to Electron WS Server' }))
  })
}

export function broadcastMessage(data: any): void {
  if (!wss) return
  const payload = JSON.stringify(data)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}
