import { ElectronAPI } from '@electron-toolkit/preload'
import { databaseAPI } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: databaseAPI
  }
}
