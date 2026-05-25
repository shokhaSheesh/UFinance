'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Detects when user is actively scrolling.
 * Returns `isScrolling: true` immediately on scroll,
 * then `false` after `debounceMs` of no scroll events.
 *
 * Usage:
 *   const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000)
 *
 *   <div ref={scrollRef} onScroll={handleScroll}>
 *     ...content
 *   </div>
 *
 *   // Hide loaders while user is scrolling:
 *   {isFetching && !isScrolling && <Loader />}
 */
export function useScrollDetector(debounceMs = 2000) {
  const [isScrolling, setIsScrolling] = useState(false)
  const timeoutRef = useRef(null)
  const scrollRef = useRef(null)

  const handleScroll = useCallback(() => {
    setIsScrolling(true)

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, debounceMs)
  }, [debounceMs])

  return { isScrolling, handleScroll, scrollRef }
}
