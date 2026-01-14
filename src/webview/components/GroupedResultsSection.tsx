import React from 'react'
import { ControllerGroup } from './ControllerGroup'
import { ResultsSection } from './ResultsSection'
import { ModeToggle } from './ModeToggle'
import type { SearchResult, ViewState, MatchedEndpoint } from '../types'

interface GroupedResultsSectionProps {
  searchResult: SearchResult
  viewState: ViewState
  onToggleDisplayMode: () => void
  onToggleControllerExpansion: (controllerName: string) => void
  onJumpToEndpoint: (endpoint: MatchedEndpoint) => void
  onCopyEndpointPath: (endpoint: MatchedEndpoint) => void
  onJumpToController: (filePath: string) => void
  onKeyNavigation?: (e: React.KeyboardEvent, type: 'controller' | 'endpoint', index: number) => void
}

export const GroupedResultsSection: React.FC<GroupedResultsSectionProps> = ({
  searchResult,
  viewState,
  onToggleDisplayMode,
  onToggleControllerExpansion,
  onJumpToEndpoint,
  onCopyEndpointPath,
  onJumpToController,
  onKeyNavigation,
}) => {
  if (searchResult.displayMode === 'flat') {
    return (
      <div className='grouped-results-section'>
        <ModeToggle
          displayMode={searchResult.displayMode}
          onToggleMode={onToggleDisplayMode}
          totalCount={searchResult.totalEndpoints}
          matchCount={
            searchResult.totalMatches !== searchResult.totalEndpoints
              ? searchResult.totalMatches
              : undefined
          }
        />

        <ResultsSection
          endpoints={searchResult.flat}
          searchQuery={viewState.searchQuery}
          totalCount={searchResult.totalMatches}
          onJumpToEndpoint={onJumpToEndpoint}
          onCopyEndpointPath={onCopyEndpointPath}
        />
      </div>
    )
  }

  return (
    <div className='grouped-results-section'>
      <ModeToggle
        displayMode={searchResult.displayMode}
        onToggleMode={onToggleDisplayMode}
        totalCount={searchResult.totalEndpoints}
        matchCount={
          searchResult.totalMatches !== searchResult.totalEndpoints
            ? searchResult.totalMatches
            : undefined
        }
      />

      <div className='controller-groups'>
        {searchResult.grouped.length === 0 ? (
          <div className='no-results'>
            {viewState.searchQuery.trim() ? (
              <div className='no-results-message'>
                <span className='no-results-icon'>🔍</span>
                <p>No endpoints match your search.</p>
                <p className='suggestion'>Try different keywords or check spelling.</p>
              </div>
            ) : (
              <div className='no-results-message'>
                <span className='no-results-icon'>📂</span>
                <p>No controllers found in the workspace.</p>
                <p className='suggestion'>Make sure you have NestJS controllers in your project.</p>
              </div>
            )}
          </div>
        ) : (
          searchResult.grouped.map((group, index) => (
            <ControllerGroup
              key={group.controllerName}
              group={group}
              searchQuery={viewState.searchQuery}
              onToggleExpansion={onToggleControllerExpansion}
              onJumpToEndpoint={onJumpToEndpoint}
              onCopyEndpointPath={onCopyEndpointPath}
              onJumpToController={onJumpToController}
              onKeyNavigation={onKeyNavigation}
              controllerIndex={index}
            />
          ))
        )}
      </div>
    </div>
  )
}
