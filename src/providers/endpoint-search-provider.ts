import * as vscode from 'vscode'
import type { EndpointInfo, MatchedEndpoint, SearchResult, ViewState } from '../types'
import type { EndpointProvider } from './endpoint-provider'
import { FzfSearch } from '../core/fzf-search'
import { GroupingEngine } from '../core/grouping-engine'

export class EndpointSearchProvider {
  private static instance: EndpointSearchProvider | null = null
  private fzfSearch: FzfSearch | null = null
  private groupingEngine: GroupingEngine

  private constructor(private readonly endpointProvider: EndpointProvider) {
    // Initialize FZF search with initial endpoints
    this.fzfSearch = new FzfSearch(this.allEndpoints)

    // Initialize grouping engine with controllers
    this.groupingEngine = new GroupingEngine(this.endpointProvider.controllers)

    // Listen for endpoint changes and update both FZF search and grouping engine
    this.endpointProvider.on('endpointsChange', (newEndpoints: EndpointInfo[]) => {
      console.log(
        '🔔 EndpointSearchProvider: Received endpointsChange event, updating FZF search and grouping engine'
      )
      if (this.fzfSearch) {
        this.fzfSearch.updateEndpoints(newEndpoints)
      } else {
        this.fzfSearch = new FzfSearch(newEndpoints)
      }

      // Update grouping engine with new controllers
      this.groupingEngine.updateControllers(this.endpointProvider.controllers)
    })
  }

  public static getInstance(endpointProvider: EndpointProvider): EndpointSearchProvider {
    EndpointSearchProvider.instance ??= new EndpointSearchProvider(endpointProvider)
    return EndpointSearchProvider.instance
  }

  private get allEndpoints(): EndpointInfo[] {
    return this.endpointProvider.endpoints
  }

  searchWithMatches(query: string): MatchedEndpoint[] {
    if (!this.fzfSearch) {
      return []
    }

    const results = this.fzfSearch.search(query)
    return results
  }

  searchWithGrouping(query: string): SearchResult {
    if (!this.fzfSearch) {
      return this.groupingEngine.createInitialResult()
    }

    if (!query.trim()) {
      return this.groupingEngine.createInitialResult()
    }

    const matchedEndpoints = this.fzfSearch.search(query)
    return this.groupingEngine.createSearchResult(matchedEndpoints, query)
  }

  getViewState(): ViewState {
    return this.groupingEngine.getViewState()
  }

  toggleDisplayMode(): ViewState {
    return this.groupingEngine.toggleDisplayMode()
  }

  toggleControllerExpansion(controllerName: string): ViewState {
    return this.groupingEngine.toggleControllerExpansion(controllerName)
  }

  updateViewState(updates: Partial<ViewState>): ViewState {
    return this.groupingEngine.updateViewState(updates)
  }

  async jumpToEndpoint(endpoint: EndpointInfo): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(endpoint.filePath)
      const editor = await vscode.window.showTextDocument(document)

      const position = new vscode.Position(
        Math.max(0, endpoint.line - 1), // VSCode uses 0-based line numbers
        Math.max(0, endpoint.column)
      )

      editor.selection = new vscode.Selection(position, position)
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter)
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${endpoint.filePath}`)
      console.error('Jump to endpoint error:', error)
    }
  }

  async jumpToController(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath)
      await vscode.window.showTextDocument(document)
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open controller file: ${filePath}`)
      console.error('Jump to controller error:', error)
    }
  }
}
