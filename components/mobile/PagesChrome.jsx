'use client'

import AiChatButton from '@/components/AiChat/AiChatButton'
import AiChatPanel from '@/components/AiChat/AiChatPanel'
import { Header } from '@/components/Header/Header'
import MobileShell from '@/components/mobile/MobileShell'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import useIsMobile from '@/hooks/useIsMobile'

/**
 * Обрамление страниц: на большом экране — меню слева и шапка сверху,
 * на телефоне — нижняя панель разделов.
 *
 * Ширину окна видно только в браузере, поэтому до первой отрисовки на
 * клиенте показываем пустой холст: иначе телефон на мгновение получил бы
 * настольную вёрстку с меню на 80 точек и горизонтальной прокруткой.
 */
export default function PagesChrome({ children }) {
  const isMobile = useIsMobile()

  if (isMobile === null) return <div className="h-screen bg-canvas" />

  if (isMobile) return <MobileShell>{children}</MobileShell>

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
