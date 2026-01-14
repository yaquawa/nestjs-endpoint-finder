import React, { useCallback, useRef, useEffect } from 'react'

interface ModeToggleProps {
  displayMode: 'flat' | 'grouped'
  onToggleMode: () => void
  totalCount: number
  matchCount?: number
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  displayMode,
  onToggleMode,
  totalCount,
  matchCount,
}) => {
  const handleFlatModeClick = useCallback(() => {
    if (displayMode !== 'flat') {
      onToggleMode()
    }
  }, [displayMode, onToggleMode])

  const handleGroupedModeClick = useCallback(() => {
    if (displayMode !== 'grouped') {
      onToggleMode()
    }
  }, [displayMode, onToggleMode])
  const modeToggleRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const flatButtonRef = useRef<HTMLButtonElement>(null)
  const groupedButtonRef = useRef<HTMLButtonElement>(null)

  // Update background position when display mode changes
  useEffect(() => {
    const updateBackgroundPosition = () => {
      if (!backgroundRef.current || !flatButtonRef.current || !groupedButtonRef.current) {
        return
      }

      const targetButton = displayMode === 'flat' ? flatButtonRef.current : groupedButtonRef.current
      const targetRect = targetButton.getBoundingClientRect()
      const containerRect = modeToggleRef.current?.getBoundingClientRect()
      
      if (containerRect) {
        const offsetLeft = targetRect.left - containerRect.left
        backgroundRef.current.style.transform = `translateX(${offsetLeft}px)`
        backgroundRef.current.style.width = `${targetRect.width}px`
      }
    }

    // Small delay to ensure DOM is ready
    const timer = window.setTimeout(updateBackgroundPosition, 0)
    return () => window.clearTimeout(timer)
  }, [displayMode])

  return (
    <div className='mode-toggle-container'>
      <div className='mode-toggle' ref={modeToggleRef}>
        <div className='mode-toggle-background' ref={backgroundRef}></div>
        <button
          ref={flatButtonRef}
          className={`mode-button ${displayMode === 'flat' ? 'active' : ''}`}
          onClick={handleFlatModeClick}
        >
          <span className='mode-label'>Flat</span>
        </button>

        <button
          ref={groupedButtonRef}
          className={`mode-button ${displayMode === 'grouped' ? 'active' : ''}`}
          onClick={handleGroupedModeClick}
        >
          <span className='mode-label'>Grouped</span>
        </button>
      </div>

      <div className='results-summary'>
        {matchCount !== undefined ? (
          <span className='count-text'>
            {matchCount} of {totalCount} endpoints
          </span>
        ) : (
          <span className='count-text'>
            {totalCount} endpoint{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
