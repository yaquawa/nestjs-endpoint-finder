import { useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { SearchResult, ViewState, MatchedEndpoint, EndpointInfo } from '../types'

interface UseKeyboardNavigationProps {
  searchResult: SearchResult
  viewState: ViewState
  onToggleControllerExpansion: (controllerName: string) => void
  onJumpToEndpoint: (endpoint: MatchedEndpoint | EndpointInfo) => void
}

export const useKeyboardNavigation = ({
  searchResult,
  onToggleControllerExpansion,
  onJumpToEndpoint,
}: Omit<UseKeyboardNavigationProps, 'viewState'>) => {
  const currentFocusRef = useRef<{ type: 'controller' | 'endpoint'; index: number } | null>(null)

  // Get all navigable items in order
  const getNavigableItems = useCallback(() => {
    const items: Array<{
      type: 'controller' | 'endpoint'
      controllerName: string
      endpointIndex?: number
      element?: HTMLElement
    }> = []

    if (searchResult.displayMode === 'flat') {
      // Flat mode: just endpoints
      for (const [index, _] of searchResult.flat.entries()) {
        const element = document.querySelector(`[data-endpoint-index="${index}"]`) as HTMLElement
        if (element) {
          items.push({
            type: 'endpoint',
            controllerName: '',
            endpointIndex: index,
            element,
          })
        }
      }
    } else {
      // Grouped mode: controllers and their endpoints
      for (const group of searchResult.grouped) {
        // Add controller header
        const controllerSelector = `[data-controller="${group.controllerName}"][data-controller-header="true"]`
        const controllerElement = document.querySelector(controllerSelector) as HTMLElement
        if (controllerElement) {
          items.push({
            type: 'controller',
            controllerName: group.controllerName,
            element: controllerElement,
          })
        }

        // Add expanded endpoints
        if (group.isExpanded) {
          for (const [endpointIndex, _] of group.endpoints.entries()) {
            const endpointSelector = `[data-controller="${group.controllerName}"][data-endpoint-index="${endpointIndex}"]`
            const endpointElement = document.querySelector(endpointSelector) as HTMLElement
            if (endpointElement) {
              items.push({
                type: 'endpoint',
                controllerName: group.controllerName,
                endpointIndex,
                element: endpointElement,
              })
            }
          }
        }
      }
    }

    return items
  }, [searchResult])

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback(
    (e: KeyboardEvent, currentType: 'controller' | 'endpoint', _currentIndex: number) => {
      const items = getNavigableItems()
      
      if (items.length === 0) return

      // Find the currently focused element in the DOM
      const activeElement = document.activeElement as HTMLElement
      if (!activeElement) {
        return
      }
      
      // Find current item index by looking for the active element
      let currentGlobalIndex = -1
      for (let i = 0; i < items.length; i++) {
        if (items[i].element === activeElement) {
          currentGlobalIndex = i
          break
        }
      }

      if (currentGlobalIndex === -1) {
        // Could not find active element, fall back to first item
        currentGlobalIndex = 0
      }

      let nextIndex = currentGlobalIndex

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nextIndex = Math.min(currentGlobalIndex + 1, items.length - 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentGlobalIndex === 0) {
          // Focus search input
          const searchInput = document.querySelector('.search-input') as HTMLElement
          if (searchInput) {
            try {
              searchInput.focus()
              return
            } catch {
              // Handle focus error silently
            }
          }
        } else {
          nextIndex = Math.max(currentGlobalIndex - 1, 0)
        }
      } else if (e.key === 'ArrowRight' && currentType === 'controller') {
        e.preventDefault()
        // Expand controller
        if (currentGlobalIndex < 0 || currentGlobalIndex >= items.length) return
        const item = items[currentGlobalIndex]
        if (item && item.type === 'controller' && typeof item.controllerName === 'string') {
          const group = searchResult.grouped.find(g => g.controllerName === item.controllerName)
          if (group && !group.isExpanded) {
            onToggleControllerExpansion(item.controllerName)
          }
        }
        return
      } else if (e.key === 'ArrowLeft' && currentType === 'controller') {
        e.preventDefault()
        // Collapse controller
        if (currentGlobalIndex < 0 || currentGlobalIndex >= items.length) return
        const item = items[currentGlobalIndex]
        if (item && item.type === 'controller' && typeof item.controllerName === 'string') {
          const group = searchResult.grouped.find(g => g.controllerName === item.controllerName)
          if (group && group.isExpanded) {
            onToggleControllerExpansion(item.controllerName)
          }
        }
        return
      } else if (e.key === 'Enter' && currentType === 'endpoint') {
        // Only handle Enter for endpoints, controllers handle it themselves
        e.preventDefault()
        if (currentGlobalIndex < 0 || currentGlobalIndex >= items.length) return
        const item = items[currentGlobalIndex]
        if (item && item.type === 'endpoint' && typeof item.endpointIndex === 'number') {
          // Find the actual endpoint and jump to it
          if (searchResult.displayMode === 'flat') {
            const endpoint = searchResult.flat[item.endpointIndex!]
            if (endpoint) {
              onJumpToEndpoint(endpoint)
            }
          } else {
            const group = searchResult.grouped.find(g => g.controllerName === item.controllerName)
            const endpoint = group?.endpoints[item.endpointIndex!]
            if (endpoint) {
              onJumpToEndpoint(endpoint)
            }
          }
        }
        return
      }

      // Focus next item
      if (nextIndex < 0 || nextIndex >= items.length) return
      const nextItem = items[nextIndex]
      if (nextIndex !== currentGlobalIndex && nextItem?.element) {
        try {
          nextItem.element.focus()
          currentFocusRef.current = {
            type: nextItem.type,
            index: nextIndex,
          }
        } catch {
          // Handle focus error silently - element might have been removed
        }
      }
    },
    [getNavigableItems, searchResult, onToggleControllerExpansion, onJumpToEndpoint]
  )

  // Handle search input navigation to first item
  const handleSearchInputNavigation = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const items = getNavigableItems()
        if (items.length > 0) {
          const firstItem = items[0]
          if (firstItem?.element) {
            try {
              firstItem.element.focus()
              currentFocusRef.current = {
                type: firstItem.type,
                index: 0,
              }
            } catch {
              // Handle focus error silently - element might have been removed
            }
          }
        }
      }
    },
    [getNavigableItems]
  )

  return {
    handleKeyNavigation,
    handleSearchInputNavigation,
  }
}
