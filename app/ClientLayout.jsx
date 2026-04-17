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
          {!isLoginPage && <Sidebar />}
          {!isLoginPage && <Header />}
          {/* <div className="flex max-h-full overflow-hidden max-w-full">
            <div className="flex flex-col flex-1 max-h-screen overflow-hidden"> */}
          <main className={isLoginPage ? "" : " bg-white"}>
            {children}
          </main>
          {/* </div>
          </div> */}
        </AppProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
