import React, { memo, useCallback } from 'react'
import { HighlightedText } from './HighlightedText'
import type { EndpointInfo, MatchedEndpoint } from '../types'

interface EndpointItemProps {
  matchedEndpoint: MatchedEndpoint
  index: number
  searchQuery?: string
  onJumpToEndpoint: (endpoint: EndpointInfo) => void
  onCopyEndpointPath: (endpoint: EndpointInfo) => void
  onKeyNavigation: (e: React.KeyboardEvent, index: number) => void
  controllerName?: string // For grouped mode
}

const EndpointItemComponent: React.FC<EndpointItemProps> = ({
  matchedEndpoint,
  index,
  onJumpToEndpoint,
  onCopyEndpointPath,
  onKeyNavigation,
  controllerName,
}) => {
  const { endpoint, matches } = matchedEndpoint
  const handleClick = useCallback(() => {
    onJumpToEndpoint(endpoint)
  }, [onJumpToEndpoint, endpoint])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onJumpToEndpoint(endpoint)
      } else {
        onKeyNavigation(e, index)
      }
    },
    [onJumpToEndpoint, onKeyNavigation, endpoint, index]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onCopyEndpointPath(endpoint)
    },
    [onCopyEndpointPath, endpoint]
  )

  return (
    <div
      className='endpoint-item'
      tabIndex={0}
      data-index={index}
      data-endpoint-index={index}
      data-controller={controllerName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      <span className={`endpoint-method method-${endpoint.method}`}>{endpoint.method}</span>
      <span className='endpoint-path'>
        <HighlightedText text={endpoint.fullPath} matches={matches} fieldKey='fullPath' />
      </span>
      <span className='endpoint-details'>
        {endpoint.controllerName}.{endpoint.methodName}
      </span>
    </div>
  )
}

EndpointItemComponent.displayName = 'EndpointItem'

export const EndpointItem = memo(EndpointItemComponent)
