import React, { useRef, useEffect } from 'react'
import { SearchSection, type SearchSectionRef } from './SearchSection'
import { GroupedResultsSection } from './GroupedResultsSection'
import { useGroupedEndpointSearch } from '../hooks/useGroupedEndpointSearch'
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation'
import { useVSCodeAPI } from '../hooks/useVSCodeAPI'

export const App: React.FC = () => {
  const searchSectionRef = useRef<SearchSectionRef>(null)
  const { onMessage } = useVSCodeAPI()

  const {
    searchResult,
    viewState,
    handleSearchChange,
    handleToggleDisplayMode,
    handleToggleControllerExpansion,
    jumpToEndpoint,
    jumpToController,
    copyEndpointPath,
  } = useGroupedEndpointSearch()

  const { handleKeyNavigation, handleSearchInputNavigation } = useKeyboardNavigation({
    searchResult,
    viewState,
    onToggleControllerExpansion: handleToggleControllerExpansion,
    onJumpToEndpoint: jumpToEndpoint,
  })

  // Handle focus messages separately for UI control
  useEffect(() => {
    const unsubscribe = onMessage('focusSearchInput', () => {
      if (searchSectionRef?.current) {
        searchSectionRef.current.focusAndSelectAll()
      }
    })

    return unsubscribe
  }, [onMessage])

  return (
    <div className='app'>
      <SearchSection
        ref={searchSectionRef}
        searchQuery={viewState.searchQuery}
        onSearchChange={handleSearchChange}
        onKeyNavigation={handleSearchInputNavigation}
      />

      <GroupedResultsSection
        searchResult={searchResult}
        viewState={viewState}
        onToggleDisplayMode={handleToggleDisplayMode}
        onToggleControllerExpansion={handleToggleControllerExpansion}
        onJumpToEndpoint={jumpToEndpoint}
        onCopyEndpointPath={copyEndpointPath}
        onJumpToController={jumpToController}
        onKeyNavigation={handleKeyNavigation}
      />
    </div>
  )
}
