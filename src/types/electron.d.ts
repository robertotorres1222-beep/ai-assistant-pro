// Electron API type declarations
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>
      showSaveDialog: (options: any) => Promise<any>
      showOpenDialog: (options: any) => Promise<any>
      showMessageBox: (options: any) => Promise<any>
      onMenuNewFile: (callback: () => void) => void
      onMenuOpenFile: (callback: (event: any, filePath: string) => void) => void
      onMenuSaveFile: (callback: () => void) => void
      onMenuSettings: (callback: () => void) => void
      onMenuAIChat: (callback: () => void) => void
      onMenuAIComposer: (callback: () => void) => void
      onMenuCodeCompletion: (callback: () => void) => void
      onMenuExplainCode: (callback: () => void) => void
      onMenuGenerateCode: (callback: () => void) => void
      onMenuShortcuts: (callback: () => void) => void
      onMenuAbout: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
    nodeAPI: {
      path: {
        join: (...args: string[]) => string
        basename: (path: string) => string
        dirname: (path: string) => string
        extname: (path: string) => string
      }
      fs: {
        readFile: (path: string, encoding?: string) => string
        writeFile: (path: string, data: string, encoding?: string) => boolean
        exists: (path: string) => boolean
        mkdir: (path: string) => boolean
      }
    }
  }
}

export {}

