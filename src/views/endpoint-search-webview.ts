import * as vscode from 'vscode'
import type { EndpointSearchProvider } from '../providers/endpoint-search-provider'
import type { EndpointProvider } from '../providers/endpoint-provider'

export class EndpointSearchWebview implements vscode.WebviewViewProvider {
  public static readonly viewId = 'nestjsEndpoints'

  private view?: vscode.WebviewView
  private currentSearchQuery: string = ''

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly endpointProvider: EndpointProvider,
    private readonly searchProvider: EndpointSearchProvider
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    }

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview)

    // Listen for messages from webview
    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'searchQueryChanged':
          console.log(`🔍 Search query changed: "${message.payload.query}"`)
          this.currentSearchQuery = message.payload.query
          await this.updateGroupedSearchResults()
          break
        case 'jumpToEndpoint':
          console.log(
            `🚀 Jumping to endpoint: ${message.payload.endpoint.method} ${message.payload.endpoint.fullPath}`
          )
          await this.searchProvider.jumpToEndpoint(message.payload.endpoint)
          break
        case 'copyEndpointPath':
          console.log(`📋 Copying endpoint path: ${message.payload.endpoint.fullPath}`)
          await vscode.env.clipboard.writeText(message.payload.endpoint.fullPath)
          vscode.window.showInformationMessage(`Copied: ${message.payload.endpoint.fullPath}`)
          break
        case 'toggleDisplayMode':
          console.log(`🔄 Toggling display mode to: ${message.payload.mode}`)
          this.searchProvider.toggleDisplayMode()
          await this.updateGroupedSearchResults()
          break
        case 'toggleControllerExpansion':
          console.log(`📁 Toggling controller expansion: ${message.payload.controllerName}`)
          this.searchProvider.toggleControllerExpansion(message.payload.controllerName)
          await this.updateGroupedSearchResults()
          break
        case 'jumpToController':
          console.log(`🏗️ Jumping to controller file: ${message.payload.filePath}`)
          await this.searchProvider.jumpToController(message.payload.filePath)
          break
      }
    })

    this.endpointProvider.on('endpointsChange', () => {
      this.updateGroupedSearchResults()
    })
  }

  private async updateSearchResults(): Promise<void> {
    if (!this.view) return

    // Use search with match information for highlighting
    const endpoints = this.searchProvider.searchWithMatches(this.currentSearchQuery)

    console.log(
      `📊 Updating WebView with ${endpoints.length} endpoints for query: "${this.currentSearchQuery}"`
    )

    this.view.webview.postMessage({
      type: 'updateResults',
      payload: {
        endpoints,
        searchQuery: this.currentSearchQuery,
        totalCount: endpoints.length,
      },
    })

    console.log(`✅ Message sent to WebView: ${endpoints.length} endpoints`)
  }

  private async updateGroupedSearchResults(): Promise<void> {
    if (!this.view) return

    // Use new grouped search functionality
    const searchResult = this.searchProvider.searchWithGrouping(this.currentSearchQuery)
    const viewState = this.searchProvider.getViewState()

    console.log(
      `📊 Updating WebView with grouped results - ${searchResult.totalMatches} matches, ${searchResult.grouped.length} controllers`
    )

    this.view.webview.postMessage({
      type: 'updateGroupedResults',
      payload: {
        searchResult,
        viewState,
      },
    })

    console.log(`✅ Grouped message sent to WebView`)
  }

  public postMessageToWebview<T extends string>(type: T, payload: unknown = {}): void {
    if (this.view?.webview) {
      this.view.webview.postMessage({ type, payload })
      console.log('📤 Message sent to webview:', type)
    } else {
      console.warn('⚠️ Cannot send message: webview not available')
    }
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    // Get URIs for the React bundle files
    const bundleScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'bundle.js')
    )
    const bundleStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'bundle.css')
    )

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
        <title>NestJS Endpoints</title>
        <link rel="stylesheet" href="${bundleStyleUri}">
      </head>
      <body>
        <div id="root"></div>
        <script src="${bundleScriptUri}"></script>
      </body>
      </html>
    `
  }
}
