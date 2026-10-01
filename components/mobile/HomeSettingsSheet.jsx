'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { cn } from '@/lib/utils'
import { mobileHomeStore } from '@/store/mobileHome.store'
import { ChevronDown, ChevronUp } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Настройка главной: какие блоки показывать и в каком порядке.
 *
 * Стрелки двигают блок на одну позицию — перетаскиванием на телефоне легко
 * промахнуться, а блоков немного. Переключатель убирает блок с главной,
 * данные при этом остаются в своих разделах.
 */
const HomeSettingsSheet = observer(({ open, onClose }) => {
  const t = useTranslations('Mobile')

  const sections = mobileHomeStore.sections

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('home.customize')}
      subtitle={t('home.customizeHint')}
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => mobileHomeStore.reset()}
            className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700 active:bg-slate-200"
          >
            {t('home.resetLayout')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4]"
          >
            {t('filters.apply')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        {sections.map((key, index) => {
          const visible = mobileHomeStore.isVisible(key)
          return (
            <div
              key={key}
              className="flex items-center gap-2 border-b border-slate-100 py-3 last:border-b-0"
            >
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => mobileHomeStore.move(key, -1)}
                  disabled={index === 0}
                  aria-label={t('home.moveUp')}
                  className="flex h-6 w-7 items-center justify-center rounded-md text-slate-400 disabled:opacity-30 active:bg-slate-100"
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => mobileHomeStore.move(key, 1)}
                  disabled={index === sections.length - 1}
                  aria-label={t('home.moveDown')}
                  className="flex h-6 w-7 items-center justify-center rounded-md text-slate-400 disabled:opacity-30 active:bg-slate-100"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>

              <span className={cn('min-w-0 flex-1 text-[15px] font-semibold', visible ? 'text-slate-900' : 'text-slate-400')}>
                {t(`home.${key}`)}
              </span>

              <button
                type="button"
                onClick={() => mobileHomeStore.toggle(key)}
                role="switch"
                aria-checked={visible}
                className={cn(
                  'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  visible ? 'bg-[#0e73f6]' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    visible && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          )
        })}
      </div>
    </BottomSheet>
  )
})

export default HomeSettingsSheet
