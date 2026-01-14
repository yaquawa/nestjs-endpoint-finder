import * as vscode from 'vscode'
import { EndpointScanner } from './core/endpoint-scanner'
import { EndpointProvider } from './providers/endpoint-provider'
import { EndpointSearchProvider } from './providers/endpoint-search-provider'
import { EndpointSearchWebview } from './views/endpoint-search-webview'
import { FileWatcher } from './watchers/file-watcher'
import { registerCommands } from './commands'

let scanner: EndpointScanner
let endpointProvider: EndpointProvider
let searchProvider: EndpointSearchProvider
let endpointSearchWebview: EndpointSearchWebview
let fileWatcher: FileWatcher

export async function activate(context: vscode.ExtensionContext) {
  console.log('🚀 NestJS Endpoint Finder is now active!')

  // Initialize providers
  try {
    // Initialize core scanner
    scanner = new EndpointScanner()
    console.log('✅ EndpointScanner created')

    // Initialize endpoint provider
    endpointProvider = await EndpointProvider.getInstance(scanner)
    console.log('✅ EndpointProvider created')

    // Initialize search provider (automatically listens to endpointsChange events)
    searchProvider = EndpointSearchProvider.getInstance(endpointProvider)
    console.log('✅ EndpointSearchProvider created')

    // Create webview provider
    endpointSearchWebview = new EndpointSearchWebview(
      context.extensionUri,
      endpointProvider,
      searchProvider
    )
    console.log('✅ EndpointSearchWebview created')

    // Initialize file watcher with reduced dependencies
    fileWatcher = new FileWatcher(endpointProvider, scanner)
    console.log('✅ FileWatcher created')

    // Register WebView provider
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        EndpointSearchWebview.viewId,
        endpointSearchWebview,
        { webviewOptions: { retainContextWhenHidden: true } }
      )
    )
    console.log('✅ Unified WebView registered')

    // Register all commands (simplified)
    registerCommands(context, endpointSearchWebview)

    console.log('✅ NestJS Endpoint Finder fully initialized')
  } catch (error) {
    console.error('❌ Error during activation:', error)
    vscode.window.showErrorMessage(`Failed to activate NestJS Endpoint Finder: ${error}`)
  }
}

export function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose()
  }
  if (endpointProvider) {
    endpointProvider.dispose() // EventEmitter automatically cleans up listeners
  }
  console.log('👋 NestJS Endpoint Finder deactivated')
}
