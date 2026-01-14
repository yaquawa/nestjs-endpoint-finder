import React, { memo, useMemo } from 'react'

interface HighlightedTextProps {
  text: string
  matches?: Array<{
    indices: Array<[number, number]>
    value: string
    key: string
  }>
  fieldKey: string
}

const HighlightedTextComponent: React.FC<HighlightedTextProps> = ({ text, matches, fieldKey }) => {
  const highlightedContent = useMemo(() => {
    if (!matches || !Array.isArray(matches)) {
      return text
    }

    // Find matches for the specific field (e.g., 'fullPath')
    const fieldMatches = matches.filter(match => match.key === fieldKey)

    if (fieldMatches.length === 0) {
      return text
    }

    console.log('🎯 HighlightedText debug:', {
      text,
      fieldKey,
      fieldMatches: fieldMatches.map(m => ({
        key: m.key,
        value: m.value,
        indices: m.indices,
      })),
    })

    // Collect highlight indices from FZF - these are individual character positions
    const highlightRanges: Array<{ start: number; end: number }> = []
    for (const match of fieldMatches) {
      if (match.indices && Array.isArray(match.indices)) {
        for (const [start, end] of match.indices) {
          // FZF provides individual character positions, so we create ranges
          highlightRanges.push({ start, end: end + 1 })
        }
      }
    }

    // Sort ranges by start position
    highlightRanges.sort((a, b) => a.start - b.start)

    // Merge overlapping and adjacent ranges more aggressively
    const mergedRanges: Array<{ start: number; end: number }> = []
    for (const range of highlightRanges) {
      if (mergedRanges.length === 0) {
        mergedRanges.push(range)
      } else {
        const lastRange = mergedRanges[mergedRanges.length - 1]
        // Merge if overlapping or adjacent (within 1 character)
        if (lastRange.end >= range.start - 1) {
          lastRange.end = Math.max(lastRange.end, range.end)
        } else {
          mergedRanges.push(range)
        }
      }
    }

    console.log('🎯 Final merged ranges:', mergedRanges)

    // Build highlighted text JSX
    const elements: React.ReactNode[] = []
    let lastIndex = 0

    for (const [i, range] of mergedRanges.entries()) {
      // Add text before highlight
      if (lastIndex < range.start) {
        elements.push(text.substring(lastIndex, range.start))
      }

      // Add highlighted text
      elements.push(
        <span key={i} className='highlight'>
          {text.substring(range.start, range.end)}
        </span>
      )

      lastIndex = range.end
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex))
    }

    return elements
  }, [text, matches, fieldKey])

  return <>{highlightedContent}</>
}

HighlightedTextComponent.displayName = 'HighlightedText'

export const HighlightedText = memo(HighlightedTextComponent)
