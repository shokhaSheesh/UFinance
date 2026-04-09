"use client"

import { usePathname } from "next/navigation"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Sidebar } from "@/components/Sidebar/Sidebar"
import { Header } from "@/components/Header/Header"
import AppProvider from "../providers/AppProvider"
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function ClientLayout({ children }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/pages/auth'

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
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
