export interface ParameterInfo {
  name: string
  type: 'path' | 'query' | 'body'
  dataType?: string
  isOptional?: boolean
}

export interface EndpointInfo {
  method: string
  path: string
  fullPath: string
  filePath: string
  line: number
  column: number
  controllerName: string
  methodName: string
  parameters: ParameterInfo[]
  pathParameters: string[] // :id, :slug etc.
}

export interface ControllerInfo {
  name: string
  basePath: string
  filePath: string
  endpoints: EndpointInfo[]
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'ALL'

export interface ParseResult {
  controllers: ControllerInfo[]
  endpoints: EndpointInfo[]
}

export interface MatchedEndpoint {
  endpoint: EndpointInfo
  matches: Array<{
    indices: Array<[number, number]>
    value: string
    key: string
  }>
}

export interface GroupedEndpointResult {
  controllerName: string
  basePath: string
  filePath: string
  endpoints: MatchedEndpoint[]
  totalEndpoints: number
  isExpanded: boolean
  matchScore: number
}

export interface SearchResult {
  grouped: GroupedEndpointResult[]
  flat: MatchedEndpoint[]
  displayMode: 'grouped' | 'flat'
  totalMatches: number
  totalEndpoints: number
}

export interface ViewState {
  displayMode: 'flat' | 'grouped'
  expandedControllers: string[]
  focusedController?: string
  searchQuery: string
}
