import React, { useRef, useEffect } from 'react'
import { SearchSection, type SearchSectionRef } from './SearchSection'
import { GroupedResultsSection } from './GroupedResultsSection'
import { useGroupedEndpointSearch } from '../hooks/useGroupedEndpointSearch'
import { useVSCodeAPI } from '../hooks/useVSCodeAPI'

export const AppWithGrouping: React.FC = () => {
  const searchSectionRef = useRef<SearchSectionRef>(null)
  const { onMessage, postMessage } = useVSCodeAPI()

  const {
    searchResult,
    viewState,
    isLoading,
    handleSearchChange,
    handleToggleDisplayMode,
    handleToggleControllerExpansion,
    jumpToEndpoint,
    jumpToController,
    copyEndpointPath,
  } = useGroupedEndpointSearch()

  // Handle focus messages separately for UI control
  useEffect(() => {
    const unsubscribe = onMessage('focusSearchInput', () => {
      if (searchSectionRef?.current) {
        searchSectionRef.current.focusAndSelectAll()
      }
    })

    // Initialize search query to empty string
    postMessage('searchQueryChanged', { query: '' })

    return unsubscribe
  }, [onMessage, postMessage])

  return (
    <div className='app'>
      <SearchSection
        ref={searchSectionRef}
        searchQuery={viewState.searchQuery}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
      />

      <GroupedResultsSection
        searchResult={searchResult}
        viewState={viewState}
        onToggleDisplayMode={handleToggleDisplayMode}
        onToggleControllerExpansion={handleToggleControllerExpansion}
        onJumpToEndpoint={jumpToEndpoint}
        onCopyEndpointPath={copyEndpointPath}
        onJumpToController={jumpToController}
      />
    </div>
  )
}
