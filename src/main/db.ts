import database from 'better-sqlite3'
import { app, ipcMain } from 'electron'
import path from 'path'

let db: database.Database

export function initDatabase(): void {
  // Путь к файлу БД в папке AppData (Windows) или Application Support (macOS)
  const dbPath = path.join(app.getPath('userData'), 'app_database.db')

  // Открываем или создаем файл БД
  db = new database(dbPath)

  // Включаем поддержку внешних ключей (Foreign Keys) для SQLite
  db.pragma('foreign_keys = ON')

  // Создаем таблицы, если их еще нет
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  console.log(`База данных успешно инициализирована по пути: ${dbPath}`)

  // Регистрируем обработчики IPC для запросов из Vue
  registerDbHandlers()
}

function registerDbHandlers(): void {
  // Обработчик сохранения пользователя
  ipcMain.handle('db:create-user', async (_event, userData: { name: string; email: string }) => {
    try {
      const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      const result = stmt.run(userData.name, userData.email)
      return { success: true, id: result.lastInsertRowId }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Обработчик получения всех пользователей
  ipcMain.handle('db:get-users', async () => {
    try {
      const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC')
      const users = stmt.all()
      return { success: true, data: users }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
