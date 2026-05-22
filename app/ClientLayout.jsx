"use client"

import { queryClient } from '@/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useSyncExternalStore } from "react"
import { Toaster } from "sonner"
import AppProvider from "../providers/AppProvider"

const subscribe = () => () => { }
const useIsHydrated = () =>
  useSyncExternalStore(subscribe, () => true, () => false)

export default function ClientLayout({ children }) {


  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Toaster position="top-right" />
          <main>
            {children}
          </main>
        </AppProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
