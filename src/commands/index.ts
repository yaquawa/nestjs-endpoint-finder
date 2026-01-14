import * as vscode from 'vscode'
import type { EndpointSearchWebview } from '../views/endpoint-search-webview'

export function registerCommands(
  context: vscode.ExtensionContext,
  endpointSearchWebview: EndpointSearchWebview
): void {
  // Single command: Search endpoints - opens sidebar panel and focuses search input
  const searchCommand = vscode.commands.registerCommand('nestjsEndpoints.search', async () => {
    // Open the sidebar panel
    await vscode.commands.executeCommand('nestjsEndpoints.focus')
    console.log('🔍 Opened endpoints panel')

    // Wait for the panel to be fully rendered before focusing
    endpointSearchWebview.postMessageToWebview('focusSearchInput')
  })

  // Register the single command
  context.subscriptions.push(searchCommand)

  console.log('✅ Search command registered successfully')
}
