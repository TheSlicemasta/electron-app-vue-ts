import { ElectronAPI } from '@electron-toolkit/preload'
import { databaseApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: databaseApi
  }
}
