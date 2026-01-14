import * as vscode from 'vscode'
import { FilePatternMatcher } from '../utils/file-pattern-matcher'
import { SettingsManager } from '../config/settings'
import type { EndpointProvider } from '../providers/endpoint-provider'
import type { EndpointScanner } from '../core/endpoint-scanner'

export class FileWatcher {
  private fileWatcher: vscode.FileSystemWatcher | null = null
  private configurationDisposable: vscode.Disposable | null = null
  private saveDocumentDisposable: vscode.Disposable | null = null

  constructor(
    private readonly endpointProvider: EndpointProvider,
    private readonly scanner: EndpointScanner
  ) {
    this.setupFileWatcher()
    this.setupConfigurationWatcher()
    this.setupDocumentSaveWatcher()
  }

  private setupDocumentSaveWatcher(): void {
    // Listen to document save events instead of file changes
    // This ensures we run after all auto-formatting, linting, etc. is complete
    this.saveDocumentDisposable = vscode.workspace.onDidSaveTextDocument(async document => {
      console.log(`💾 FileWatcher: Document saved: ${document.uri.fsPath}`)

      if (this.isControllerFile(document.uri.fsPath)) {
        console.log('🔄 FileWatcher: Controller file saved, refreshing immediately...')
        console.log('🗑️ FileWatcher: Force clearing cache for file:', document.uri.fsPath)

        // No timeout needed with onDidSaveTextDocument - execute immediately
        try {
          // Force clear cache first - direct call to scanner
          this.scanner.invalidateCache(document.uri.fsPath)

          // Force refresh endpoints via EndpointProvider
          await this.endpointProvider.refreshEndpoints()

          console.log('✅ FileWatcher: Auto-refresh completed immediately after save')
        } catch (error) {
          console.error('❌ FileWatcher: Error during auto-refresh:', error)
        }
      }
    })
  }

  private setupFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose()
    }

    // Keep file watcher for creation/deletion events only
    this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.ts')

    // Remove onDidChange handler entirely - we use onDidSaveTextDocument instead

    this.fileWatcher.onDidCreate(async uri => {
      console.log(`📄 FileWatcher: File created: ${uri.fsPath}`)
      if (this.isControllerFile(uri.fsPath)) {
        console.log('🆕 FileWatcher: New controller file detected, refreshing immediately...')

        try {
          // Force refresh endpoints via EndpointProvider
          await this.endpointProvider.refreshEndpoints()

          console.log('✅ FileWatcher: Auto-refresh for new file completed immediately')
        } catch (error) {
          console.error('❌ FileWatcher: Error during auto-refresh for new file:', error)
        }
      }
    })

    this.fileWatcher.onDidDelete(async uri => {
      console.log(`🗑️ FileWatcher: File deleted: ${uri.fsPath}`)
      if (this.isControllerFile(uri.fsPath)) {
        console.log('❌ FileWatcher: Controller file deleted, refreshing immediately...')

        try {
          // Clear cache for deleted file first - direct call to scanner
          this.scanner.invalidateCache(uri.fsPath)

          // For deletion, refresh immediately since there's no formatting to wait for
          await this.endpointProvider.refreshEndpoints()

          console.log('✅ FileWatcher: Auto-refresh for deleted file completed immediately')
        } catch (error) {
          console.error('❌ FileWatcher: Error during auto-refresh for deleted file:', error)
        }
      }
    })

    console.log('✅ FileWatcher: File watcher setup completed')
  }

  private setupConfigurationWatcher(): void {
    this.configurationDisposable = SettingsManager.onConfigurationChanged(async () => {
      console.log('⚙️ FileWatcher: Configuration changed, refreshing endpoints...')
      try {
        await this.endpointProvider.refreshEndpoints()
        console.log('✅ FileWatcher: Configuration change refresh completed')
      } catch (error) {
        console.error('❌ FileWatcher: Error during configuration change refresh:', error)
      }
    })
  }

  private isControllerFile(filePath: string): boolean {
    return FilePatternMatcher.isControllerFile(filePath)
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose()
      this.fileWatcher = null
    }

    if (this.configurationDisposable) {
      this.configurationDisposable.dispose()
      this.configurationDisposable = null
    }

    if (this.saveDocumentDisposable) {
      this.saveDocumentDisposable.dispose()
      this.saveDocumentDisposable = null
    }

    console.log('👋 FileWatcher: Disposed')
  }
}
