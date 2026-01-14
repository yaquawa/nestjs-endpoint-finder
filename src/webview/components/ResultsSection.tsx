import React, { memo, useCallback, useMemo } from 'react'
import { EndpointItem } from './EndpointItem'
import type { EndpointInfo, MatchedEndpoint } from '../types'

interface ResultsSectionProps {
  endpoints: MatchedEndpoint[]
  searchQuery: string
  totalCount: number
  onJumpToEndpoint: (endpoint: EndpointInfo) => void
  onCopyEndpointPath: (endpoint: EndpointInfo) => void
  onKeyNavigation?: (e: React.KeyboardEvent, index: number) => void
}

const ResultsSectionComponent: React.FC<ResultsSectionProps> = ({
  endpoints,
  searchQuery,
  totalCount,
  onJumpToEndpoint,
  onCopyEndpointPath,
  onKeyNavigation,
}) => {
  const headerText = useMemo(() => {
    if (searchQuery) {
      return `${endpoints.length} of ${totalCount} endpoints`
    }
    return `${totalCount} endpoints`
  }, [searchQuery, endpoints.length, totalCount])

  const handleKeyNavigation = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextItem = document.querySelector(`[data-index="${index + 1}"]`) as HTMLElement
      if (nextItem) nextItem.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index === 0) {
        // Focus search input
        const searchInput = document.querySelector('.search-input') as HTMLElement
        if (searchInput) searchInput.focus()
      } else {
        const prevItem = document.querySelector(`[data-index="${index - 1}"]`) as HTMLElement
        if (prevItem) prevItem.focus()
      }
    }
  }, [])

  if (endpoints.length === 0) {
    const noResultsText = searchQuery
      ? `No endpoints found for "${searchQuery}"`
      : 'No endpoints found'

    return (
      <div className='results-section'>
        <div className='results-header'>{headerText.toUpperCase()}</div>
        <div className='no-results'>{noResultsText}</div>
      </div>
    )
  }

  return (
    <div className='results-section'>
      <div className='results-header'>{headerText.toUpperCase()}</div>
      <div className='results-container'>
        {endpoints.map((matchedEndpoint, index) => (
          <EndpointItem
            key={`${matchedEndpoint.endpoint.method}:${matchedEndpoint.endpoint.fullPath}:${matchedEndpoint.endpoint.filePath}:${matchedEndpoint.endpoint.line}`}
            matchedEndpoint={matchedEndpoint}
            index={index}
            searchQuery={searchQuery}
            onJumpToEndpoint={onJumpToEndpoint}
            onCopyEndpointPath={onCopyEndpointPath}
            onKeyNavigation={onKeyNavigation || handleKeyNavigation}
          />
        ))}
      </div>
    </div>
  )
}

ResultsSectionComponent.displayName = 'ResultsSection'

export const ResultsSection = memo(ResultsSectionComponent)
