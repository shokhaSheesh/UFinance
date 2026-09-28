'use client'

import AiChatButton from '@/components/AiChat/AiChatButton'
import AiChatPanel from '@/components/AiChat/AiChatPanel'
import { Header } from '@/components/Header/Header'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import useIsMobile from '@/hooks/useIsMobile'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Обрамление настольных страниц.
 *
 * Мобильное приложение живёт отдельной веткой `/m` со своей вёрсткой, а не
 * этими же страницами, ужатыми до ширины телефона. Поэтому с телефона
 * настольный маршрут перебрасывает в приложение: показывать таблицу на
 * тринадцать колонок на 390 точках бессмысленно.
 */
export default function PagesChrome({ children }) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isMobile && !pathname.startsWith('/m')) router.replace('/m')
  }, [isMobile, pathname, router])

  // Ширина окна известна только в браузере: до первой отрисовки на клиенте
  // держим пустой холст, иначе телефон мигнёт настольной вёрсткой
  if (isMobile === null || isMobile) return <div className="h-screen bg-canvas" />

  return (
    <div className="flex h-screen max-w-full pr-[var(--ai-w,0px)]">
      <Sidebar />
      <div className="flex max-h-screen flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden bg-canvas">{children}</main>
      </div>
      <AiChatButton />
      <AiChatPanel />
    </div>
  )
}
