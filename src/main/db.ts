import database from 'better-sqlite3'
import { app, ipcMain, net } from 'electron' // Используем net для безопасных HTTPS запросов
import path from 'path'

let db: database.Database

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'app_database.db')
  db = new database(dbPath)
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  registerHandlers()
}

function registerHandlers(): void {
  // === БЛОК СUAD (SQLite) ===

  // Create (Создание)
  ipcMain.handle('db:create-user', async (_event, userData: { name: string; email: string }) => {
    try {
      const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      const result = stmt.run(userData.name, userData.email)
      return { success: true, id: result.lastInsertRowId }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Read (Чтение)
  ipcMain.handle('db:get-users', async () => {
    try {
      const stmt = db.prepare('SELECT * FROM users ORDER BY id DESC')
      return { success: true, data: stmt.all() }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Update (Обновление)
  ipcMain.handle(
    'db:update-user',
    async (_event, id: number, userData: { name: string; email: string }) => {
      try {
        const stmt = db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
        const result = stmt.run(userData.name, userData.email, id)
        return { success: true, changes: result.changes }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }
  )

  // Delete (Удаление)
  ipcMain.handle('db:delete-user', async (_event, id: number) => {
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?')
      const result = stmt.run(id)
      return { success: true, changes: result.changes }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // === БЛОК HTTPS API (Синхронизация) ===
  // Запрос выполняется на стороне Node.js (нет проблем с CORS, безопасно)
  ipcMain.handle('api:fetch-remote-users', async () => {
    try {
      // Для теста используем бесплатный JSONPlaceholder API
      const response = await net.fetch('https://typicode.com')
      if (!response.ok) throw new Error('Ошибка сети сервера')

      const remoteUsers = (await response.json()) as any[]

      // Преобразуем формат сервера под нашу БД и возвращаем
      const formatted = remoteUsers.map((u) => ({ name: u.name, email: u.email.toLowerCase() }))
      return { success: true, data: formatted }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
