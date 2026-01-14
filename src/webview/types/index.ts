// Re-export types from parent directory
import type {
  EndpointInfo,
  MatchedEndpoint,
  GroupedEndpointResult,
  SearchResult,
  ViewState,
} from '../../types'
export type { EndpointInfo, MatchedEndpoint, GroupedEndpointResult, SearchResult, ViewState }

// VSCode WebView API types
declare global {
  function acquireVsCodeApi(): VSCodeAPI
}

export interface VSCodeAPI {
  postMessage(message: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

// === WebView → Extension Messages ===
interface WebViewMessagePayloads {
  searchQueryChanged: { query: string }
  jumpToEndpoint: { endpoint: EndpointInfo }
  copyEndpointPath: { endpoint: EndpointInfo }
  toggleDisplayMode: { mode: 'flat' | 'grouped' }
  toggleControllerExpansion: { controllerName: string }
  jumpToController: { filePath: string }
}

export type WebViewMessageType = keyof WebViewMessagePayloads

export interface WebViewMessage<T extends WebViewMessageType = WebViewMessageType> {
  type: T
  payload: WebViewMessagePayloads[T]
}

// === Extension → WebView Messages ===
interface ExtensionMessagePayloads {
  updateResults: {
    endpoints: MatchedEndpoint[]
    searchQuery: string
    totalCount: number
  }
  updateGroupedResults: {
    searchResult: SearchResult
    viewState: ViewState
  }
  focusSearchInput: void
}

export type ExtensionMessageType = keyof ExtensionMessagePayloads

export interface ExtensionMessage<T extends ExtensionMessageType = ExtensionMessageType> {
  type: T
  payload: ExtensionMessagePayloads[T]
}
