'use client'

import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import { useRouter } from '@/hooks/useAppRouter'
import { useTranslations } from 'next-intl'

/**
 * Уведомления.
 *
 * Своей ленты уведомлений у бэкенда пока нет, поэтому экран показывает
 * пустое состояние с общей иллюстрацией и объясняет, что здесь появится.
 * Колокольчик на главной ведёт сюда, а не в ленту операций.
 */
export default function MobileNotificationsPage() {
  const t = useTranslations('Mobile')
  const router = useRouter()

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader title={t('notifications.title')} onBack={() => router.push('/m')} />
      <MCard>
        <MEmpty title={t('notifications.emptyTitle')} subtitle={t('notifications.emptyHint')} />
      </MCard>
    </div>
  )
}
