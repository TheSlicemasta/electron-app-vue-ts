import { ipcMain, net } from 'electron'

export function initApi(): void {
  // Запрос выполняется на стороне Node.js (нет проблем с CORS, безопасно)
  ipcMain.handle('api:fetch-remote-users', async () => {
    try {
      // Для теста используем бесплатный JSONPlaceholder API
      const response = await net.fetch('https://jsonplaceholder.typicode.com/users')
      if (!response.ok) throw new Error('Ошибка сети сервера')

      const remoteUsers = (await response.json()) as any[]

      // Преобразуем формат сервера под нашу БД и возвращаем
      const formatted = remoteUsers
        .slice(0, 3)
        .map((u) => ({ name: u.name, email: u.email.toLowerCase() }))

      return { success: true, data: formatted }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
