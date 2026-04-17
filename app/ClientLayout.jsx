"use client"

import { Header } from "@/components/Header/Header"
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { queryClient } from '@/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from "next/navigation"
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from "sonner"
import AppProvider from "../providers/AppProvider"

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/pages/auth'

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Toaster position="top-right" />
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
