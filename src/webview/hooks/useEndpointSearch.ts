import { useState, useEffect, useCallback, useRef } from 'react'
import type { EndpointInfo, MatchedEndpoint } from '../types'
import { useVSCodeAPI } from './useVSCodeAPI'

export const useEndpointSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [endpoints, setEndpoints] = useState<MatchedEndpoint[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const { postMessage, onMessage } = useVSCodeAPI()

  // Handle incoming messages from extension
  useEffect(() => {
    const unsubscribe = onMessage('updateResults', payload => {
      setEndpoints(payload.endpoints)
      setTotalCount(payload.totalCount)
      setIsLoading(false)
    })

    return unsubscribe
  }, [onMessage])

  // Properly debounced search
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setIsLoading(true)

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Set new timeout
      debounceRef.current = setTimeout(() => {
        postMessage('searchQueryChanged', { query: query.trim() })
      }, 150) // Reduced from 300ms to 150ms for better responsiveness
    },
    [postMessage]
  )

  const jumpToEndpoint = useCallback(
    (endpoint: EndpointInfo) => {
      postMessage('jumpToEndpoint', { endpoint })
    },
    [postMessage]
  )

  const copyEndpointPath = useCallback(
    (endpoint: EndpointInfo) => {
      postMessage('copyEndpointPath', { endpoint })
    },
    [postMessage]
  )

  return {
    searchQuery,
    endpoints,
    totalCount,
    isLoading,
    handleSearchChange,
    jumpToEndpoint,
    copyEndpointPath,
  }
}
