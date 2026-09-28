'use client'

import { MCard, MRow } from '@/components/mobile/ui'
import { BarChart3, Scale, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'

/**
 * Отчёты на телефоне.
 *
 * Пока заглушка: настольные отчёты — широкие таблицы с колонками по
 * периодам, на телефон их переносить нельзя как есть. Здесь будут сводка
 * цифрами и диаграммы, а таблица — по одному периоду за раз.
 */
const MobileReportsPage = () => {
  const t = useTranslations('Mobile')
  const tr = useTranslations('Reports')

  const reports = [
    { key: 'cashflow', icon: TrendingUp, title: tr('cashflow.title') },
    { key: 'pnl', icon: BarChart3, title: tr('pnl.title') },
    { key: 'balance', icon: Scale, title: tr('balance.title') },
  ]

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <h1 className="py-4 text-[21px] font-bold text-slate-900">{t('tabs.reports')}</h1>

      <MCard list>
        {reports.map((report) => (
          <MRow key={report.key} icon={report.icon} title={report.title} subtitle={t('profile.soon')} />
        ))}
      </MCard>

      <p className="px-2 pt-4 text-xs leading-relaxed text-slate-500">{t('reports.hint')}</p>
    </div>
  )
}

export default MobileReportsPage
