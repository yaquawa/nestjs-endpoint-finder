import React, { useCallback } from 'react'
import { EndpointItem } from './EndpointItem'
import type { GroupedEndpointResult, MatchedEndpoint } from '../types'

interface ControllerGroupProps {
  group: GroupedEndpointResult
  searchQuery: string
  onToggleExpansion: (controllerName: string) => void
  onJumpToEndpoint: (endpoint: MatchedEndpoint) => void
  onCopyEndpointPath: (endpoint: MatchedEndpoint) => void
  onJumpToController: (filePath: string) => void
  onKeyNavigation?: (e: React.KeyboardEvent, type: 'controller' | 'endpoint', index: number) => void
  controllerIndex: number
}

export const ControllerGroup: React.FC<ControllerGroupProps> = ({
  group,
  searchQuery,
  onToggleExpansion,
  onJumpToEndpoint,
  onCopyEndpointPath,
  onJumpToController,
  onKeyNavigation,
  controllerIndex,
}) => {
  const hasMatches = group.endpoints.length > 0
  const matchCount = group.endpoints.length
  const totalCount = group.totalEndpoints


  const handleHeaderClick = useCallback(() => {
    onToggleExpansion(group.controllerName)
  }, [group.controllerName, onToggleExpansion])

  const handleControllerNameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onJumpToController(group.filePath)
  }, [group.filePath, onJumpToController])

  const handleControllerKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Enter key for toggle
    if (e.key === 'Enter') {
      e.preventDefault()
      onToggleExpansion(group.controllerName)
      return
    }

    // Handle other navigation keys
    if (onKeyNavigation) {
      onKeyNavigation(e, 'controller', controllerIndex)
    }
  }, [group.controllerName, onToggleExpansion, onKeyNavigation, controllerIndex])

  const handleEndpointKeyNavigation = useCallback((e: React.KeyboardEvent, endpointIndex: number) => {
    if (onKeyNavigation) {
      onKeyNavigation(e, 'endpoint', endpointIndex)
    }
  }, [onKeyNavigation])

  return (
    <div className={`controller-group ${!hasMatches && searchQuery ? 'no-matches' : ''}`}>
      <div
        className={`controller-header ${group.isExpanded ? 'expanded' : 'collapsed'}`}
        onClick={handleHeaderClick}
        onKeyDown={handleControllerKeyDown}
        tabIndex={0}
        data-controller={group.controllerName}
        data-controller-header="true"
      >
        <div className='controller-header-content'>
          <div className='controller-icon'>
            <span className='icon-symbol'>🕹️</span>
          </div>

          <div className='controller-info'>
            <div className='controller-name-section'>
              <span
                className='controller-name clickable'
                onClick={handleControllerNameClick}
                title='Click to open controller file'
              >
                {group.controllerName}
              </span>
              {group.basePath && <span className='base-path'>{group.basePath}</span>}
            </div>

            <div className='controller-stats'>
              <span className='endpoint-count'>
                {searchQuery ? (
                  <>
                    {matchCount} of {totalCount} endpoints
                  </>
                ) : (
                  <>
                    {totalCount} endpoint{totalCount !== 1 ? 's' : ''}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className='controller-actions'>
            <div className={`expand-icon ${group.isExpanded ? 'expanded' : 'collapsed'}`}>
            </div>
          </div>
        </div>
      </div>

      <div className={`controller-endpoints ${group.isExpanded ? 'expanded' : 'collapsed'}`}>
        {group.isExpanded && (
          <div className='endpoints-list'>
            {group.endpoints.length > 0 ? (
              group.endpoints.map((matchedEndpoint, index) => (
                <div
                  key={`${group.controllerName}-${matchedEndpoint.endpoint.method}-${matchedEndpoint.endpoint.path}-${matchedEndpoint.endpoint.filePath}-${matchedEndpoint.endpoint.line}`}
                  className='endpoint-item-wrapper'
                >
                  <EndpointItem
                    matchedEndpoint={matchedEndpoint}
                    index={index}
                    searchQuery={searchQuery}
                    onJumpToEndpoint={onJumpToEndpoint}
                    onCopyEndpointPath={onCopyEndpointPath}
                    onKeyNavigation={handleEndpointKeyNavigation}
                    controllerName={group.controllerName}
                  />
                </div>
              ))
            ) : (
              <div className='no-endpoints-message'>
                {searchQuery ? 'No matching endpoints found' : 'No endpoints in this controller'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
