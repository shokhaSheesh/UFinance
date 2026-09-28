'use client'

import Segmented from '@/components/shared/Segmented/Segmented'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { cn } from '@/lib/utils'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useRef, useState } from 'react'

/**
 * Мобильная версия на большом экране.
 *
 * Страница открывает приложение в рамке телефона: внутри рамки ширина окна
 * 390 точек, поэтому там включается та же мобильная вёрстка, что и на
 * настоящем телефоне — это не макет, а само приложение. Так мобильные экраны
 * можно показывать и проверять, не доставая телефон.
 */

/** Размеры экранов, на которых проверяем вёрстку. */
const DEVICES = [
  { value: 'small', width: 360, height: 780 },
  { value: 'base', width: 390, height: 844 },
  { value: 'large', width: 430, height: 932 },
]

/** Экраны мобильного приложения (ветка /m). */
const ROUTES = [
  { value: '/m', key: 'home', ready: true },
  { value: '/m/transactions', key: 'transactions', ready: true },
  { value: '/m/reports', key: 'reports' },
  { value: '/m/profile', key: 'profile', ready: true },
]

export default function MobilePreviewPage() {
  const t = useTranslations('MobilePreview')
  const frameRef = useRef(null)
  const [device, setDevice] = useState('base')
  const [route, setRoute] = useState('/operations')
  // Перезагрузка кадра: меняем ключ, чтобы iframe создался заново
  const [reloadKey, setReloadKey] = useState(0)

  const size = useMemo(() => DEVICES.find((item) => item.value === device) || DEVICES[1], [device])
  const current = useMemo(() => ROUTES.find((item) => item.value === route), [route])

  return (
    <div className="fixed top-[60px] left-[var(--sidebar-w)] flex h-[calc(100%-60px)] w-[calc(100%_-_var(--sidebar-w)_-_var(--ai-w,0px))] flex-col bg-canvas">
      <div className="flex h-16 shrink-0 flex-wrap items-center justify-between gap-3 px-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold whitespace-nowrap text-slate-900">{t('title')}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SingleSelect
            data={ROUTES.map((item) => ({ value: item.value, label: t(`routes.${item.key}`) }))}
            value={route}
            onChange={setRoute}
            isClearable={false}
            withSearch={false}
            className="w-56 bg-white"
            wrapperClassName="w-56 shrink-0"
            dropdownClassName="w-56"
          />

          <Segmented
            ariaLabel={t('device')}
            value={device}
            onChange={setDevice}
            options={DEVICES.map((item) => ({ value: item.value, label: `${item.width}` }))}
          />

          <button
            type="button"
            className="secondary-btn"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t('reload')}
          </button>

          <a href={route} target="_blank" rel="noreferrer" className="secondary-btn">
            <ExternalLink size={15} aria-hidden="true" />
            {t('openInTab')}
          </a>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-auto px-6 pb-6">
        <p className="max-w-xl text-center text-sm text-slate-500">
          {current?.ready ? t('hintReady') : t('hintDesktopLayout')}
        </p>

        {/* Рамка телефона: ширина кадра и задаёт мобильную вёрстку внутри */}
        <div
          className={cn(
            'relative shrink-0 rounded-[2.2rem] border-[10px] border-slate-900 bg-white',
            'shadow-[0_24px_60px_rgba(15,23,42,0.28)]'
          )}
          style={{ width: size.width + 20, height: size.height + 20 }}
        >
          <span className="absolute top-2.5 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-slate-900" />
          <iframe
            key={`${reloadKey}-${route}-${device}`}
            ref={frameRef}
            src={route}
            title={t('title')}
            className="h-full w-full rounded-[1.5rem] border-0"
          />
        </div>
      </div>
    </div>
  )
}
