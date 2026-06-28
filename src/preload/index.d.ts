import { ElectronAPI } from '@electron-toolkit/preload'
import { WinApi } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: WinApi
  }
}
