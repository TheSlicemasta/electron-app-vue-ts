import { BrowserWindow, ipcMain, dialog } from 'electron'

export function initApp(): void {
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
}
