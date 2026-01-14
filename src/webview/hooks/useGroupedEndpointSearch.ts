import { useState, useEffect, useCallback, useRef } from 'react'
import type { EndpointInfo, MatchedEndpoint, SearchResult, ViewState } from '../types'
import { useVSCodeAPI } from './useVSCodeAPI'

export const useGroupedEndpointSearch = () => {
  const [searchResult, setSearchResult] = useState<SearchResult>({
    grouped: [],
    flat: [],
    displayMode: 'flat',
    totalMatches: 0,
    totalEndpoints: 0,
  })

  const [viewState, setViewState] = useState<ViewState>({
    displayMode: 'flat',
    expandedControllers: [],
    focusedController: undefined,
    searchQuery: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentQueryRef = useRef<string>('')
  const { postMessage, onMessage } = useVSCodeAPI()

  // Handle incoming messages from extension
  useEffect(() => {
    const unsubscribeGrouped = onMessage('updateGroupedResults', payload => {
      setSearchResult(payload.searchResult)
      // Always preserve the current searchQuery and only update other viewState properties
      setViewState(prev => ({
        ...payload.viewState,
        searchQuery: prev.searchQuery,
      }))
      setIsLoading(false)
    })

    // Fallback for legacy updateResults messages
    const unsubscribeLegacy = onMessage('updateResults', payload => {
      // Convert legacy format to grouped format
      setSearchResult({
        grouped: [],
        flat: payload.endpoints,
        displayMode: 'flat',
        totalMatches: payload.endpoints.length,
        totalEndpoints: payload.totalCount,
      })
      // Always preserve current searchQuery
      setIsLoading(false)
    })

    return () => {
      unsubscribeGrouped()
      unsubscribeLegacy()
    }
  }, [onMessage])

  // Initialize with empty search on mount
  useEffect(() => {
    // Send initial empty search to load all endpoints
    postMessage('searchQueryChanged', { query: '' })
    lastSentQueryRef.current = ''
  }, [postMessage])

  // Handle search query changes with debouncing
  const handleSearchChange = useCallback(
    (query: string) => {
      // Immediately update local state
      setViewState(prev => ({ ...prev, searchQuery: query }))
      setIsLoading(true)

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Set new timeout
      debounceRef.current = setTimeout(() => {
        const trimmedQuery = query.trim()
        // Only send message if query actually changed
        if (trimmedQuery !== lastSentQueryRef.current) {
          lastSentQueryRef.current = trimmedQuery
          postMessage('searchQueryChanged', { query: trimmedQuery })
        } else {
          setIsLoading(false)
        }
      }, 150)
    },
    [postMessage]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Handle display mode toggle
  const handleToggleDisplayMode = useCallback(() => {
    postMessage('toggleDisplayMode', {
      mode: viewState.displayMode === 'flat' ? 'grouped' : 'flat',
    })
  }, [postMessage, viewState.displayMode])

  // Handle controller expansion toggle
  const handleToggleControllerExpansion = useCallback(
    (controllerName: string) => {
      postMessage('toggleControllerExpansion', { controllerName })
    },
    [postMessage]
  )

  // Handle endpoint navigation
  const jumpToEndpoint = useCallback(
    (endpoint: MatchedEndpoint | EndpointInfo) => {
      // Extract EndpointInfo from MatchedEndpoint if needed
      const endpointInfo = 'endpoint' in endpoint ? endpoint.endpoint : endpoint
      postMessage('jumpToEndpoint', { endpoint: endpointInfo })
    },
    [postMessage]
  )

  // Handle controller navigation
  const jumpToController = useCallback(
    (filePath: string) => {
      postMessage('jumpToController', { filePath })
    },
    [postMessage]
  )

  // Handle endpoint path copying
  const copyEndpointPath = useCallback(
    (endpoint: MatchedEndpoint | EndpointInfo) => {
      // Extract EndpointInfo from MatchedEndpoint if needed
      const endpointInfo = 'endpoint' in endpoint ? endpoint.endpoint : endpoint
      postMessage('copyEndpointPath', { endpoint: endpointInfo })
    },
    [postMessage]
  )

  return {
    searchResult,
    viewState,
    isLoading,
    handleSearchChange,
    handleToggleDisplayMode,
    handleToggleControllerExpansion,
    jumpToEndpoint,
    jumpToController,
    copyEndpointPath,
  }
}
