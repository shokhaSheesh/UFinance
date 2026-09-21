'use client'

import { navigationProgress, isNavigationTarget } from '@/lib/navigationProgress'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

// Если страница так и не сменилась (ошибка, отмена) — полосу всё равно убираем
const SAFETY_TIMEOUT = 15000

/**
 * Полоса загрузки вверху экрана при переходе между страницами.
 * Ползёт к 90%, пока грузится страница, и добегает до конца, когда адрес
 * сменился. Пока идёт переход, курсор — «в процессе».
 */
function ProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const trickleRef = useRef(null)
  const safetyRef = useRef(null)
  const hideRef = useRef(null)

  // Клик по обычной ссылке (<a>, next/link) — тоже переход
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = e.target?.closest?.('a[href]')
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      if (isNavigationTarget(anchor.getAttribute('href'))) navigationProgress.start()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    const stopTimers = () => {
      clearInterval(trickleRef.current)
      clearTimeout(safetyRef.current)
    }
    const unsubscribe = navigationProgress.subscribe((active) => {
      stopTimers()
      clearTimeout(hideRef.current)
      if (active) {
        document.documentElement.style.cursor = 'progress'
        setVisible(true)
        setProgress(8)
        trickleRef.current = setInterval(() => {
          setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p))
        }, 200)
        safetyRef.current = setTimeout(() => navigationProgress.done(), SAFETY_TIMEOUT)
      } else {
        document.documentElement.style.cursor = ''
        setProgress(100)
        hideRef.current = setTimeout(() => {
          setVisible(false)
          setProgress(0)
        }, 250)
      }
    })
    return () => {
      unsubscribe()
      stopTimers()
      clearTimeout(hideRef.current)
    }
  }, [])

  // Адрес сменился — страница открылась
  useEffect(() => {
    navigationProgress.done()
  }, [pathname, searchParams])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[3000] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
    >
      <div
        className="h-full bg-[#0e73f6] shadow-[0_0_8px_rgba(14,115,246,0.6)]"
        style={{ width: `${progress}%`, transition: 'width 0.2s ease' }}
      />
    </div>
  )
}

export default function NavigationProgress() {
  // useSearchParams требует Suspense-границы
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  )
}
