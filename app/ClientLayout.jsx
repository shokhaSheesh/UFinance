"use client"

import { Header } from "@/components/Header/Header"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { queryClient } from '@/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from "next/navigation"
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useEffect, useState, useSyncExternalStore } from "react"
import { Toaster } from "sonner"
import AppProvider from "../providers/AppProvider"

const subscribe = () => () => {}
const useIsHydrated = () =>
  useSyncExternalStore(subscribe, () => true, () => false)

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/pages/auth'

  const [pendingNavPath, setPendingNavPath] = useState(null)

  useEffect(() => {
    const anchorIsInternal = (anchor) => {
      if (!anchor || !anchor.href) return null
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.origin !== window.location.origin) return null
        if (anchor.target && anchor.target !== '_self') return null
        if (url.pathname === window.location.pathname && url.search === window.location.search) return null
        return url.pathname + url.search
      } catch {
        return null
      }
    }

    const onClick = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      const anchor = e.target.closest && e.target.closest('a')
      const target = anchorIsInternal(anchor)
      if (!target) return
      setPendingNavPath(target)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    setTimeout(() => setPendingNavPath(null), 0)
  }, [pathname])

  const isNavigating = pendingNavPath !== null && !pendingNavPath.startsWith(pathname)
  const showLoader = isNavigating

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Toaster position="top-right" />
          {/* {showLoader && <LoadingScreen />} */}
          <div className="flex max-h-full overflow-hidden max-w-full">
            {!isLoginPage && <Sidebar />}
            <div className="flex flex-col flex-1 max-h-screen overflow-hidden">
              {!isLoginPage && <Header />}
              <main className={isLoginPage ? "" : "flex-1 overflow-hidden bg-white"}>
                {children}
              </main>
            </div>
          </div>
        </AppProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
