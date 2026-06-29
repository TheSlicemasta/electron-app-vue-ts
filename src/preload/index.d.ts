import { ElectronAPI } from '@electron-toolkit/preload'
import { AppAPI } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
