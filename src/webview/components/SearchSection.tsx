import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

interface SearchSectionProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onKeyNavigation?: (e: React.KeyboardEvent) => void
}

export interface SearchSectionRef {
  focusAndSelectAll: () => void
}

export const SearchSection = forwardRef<SearchSectionRef, SearchSectionProps>(
  function SearchSection({ searchQuery, onSearchChange, onKeyNavigation }, ref) {
    const inputRef = useRef<HTMLInputElement>(null)

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        focusAndSelectAll: () => {
          if (inputRef.current) {
            console.log('🎯 focusAndSelectAll called, inputRef.current:', !!inputRef.current)
            window.setTimeout(() => {
              inputRef.current!.focus()
              inputRef.current!.select()
            }, 100)
          }
        },
      }),
      []
    )

    useEffect(() => {
      // Auto-focus search input on load
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, [])

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value)
      },
      [onSearchChange]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          onSearchChange('')
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
          // Use provided navigation handler or fallback to default
          if (onKeyNavigation) {
            onKeyNavigation(e)
          } else {
            // Default behavior - focus first endpoint item
            if (e.key === 'Enter') {
              const firstItem = document.querySelector('.endpoint-item') as HTMLElement
              if (firstItem) {
                firstItem.focus()
              }
            }
          }
        }
      },
      [onSearchChange, onKeyNavigation]
    )

    return (
      <div className='search-section'>
        <div className='search-input-container'>
          <input
            ref={inputRef}
            type='text'
            className='search-input'
            placeholder='search endpoints...'
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete='off'
            spellCheck={false}
          />
        </div>
      </div>
    )
  }
)
