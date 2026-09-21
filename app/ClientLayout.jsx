"use client"

import { queryClient } from '@/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from "sonner"
import AppProvider from "../providers/AppProvider"
import NavigationProgress from '@/components/shared/NavigationProgress/NavigationProgress'


export default function ClientLayout({ children }) {
  // const pathname = usePathname()

  // useEffect(() => {
  //   const anchorIsInternal = (anchor) => {
  //     if (!anchor || !anchor.href) return null
  //     try {
  //       const url = new URL(anchor.href, window.location.href)
  //       if (url.origin !== window.location.origin) return null
  //       if (anchor.target && anchor.target !== '_self') return null
  //       if (url.pathname === window.location.pathname && url.search === window.location.search) return null
  //       return url.pathname + url.search
  //     } catch {
  //       return null
  //     }
  //   }

  //   const onClick = (e) => {
  //     if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  //     const anchor = e.target.closest && e.target.closest('a')
  //     const target = anchorIsInternal(anchor)
  //     if (!target) return
  //     setPendingNavPath(target)
  //   }

  //   document.addEventListener('click', onClick, true)
  //   return () => document.removeEventListener('click', onClick, true)
  // }, [])

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Toaster position="top-right" />
          <NavigationProgress />
          <main>
            {children}
          </main>
        </AppProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
