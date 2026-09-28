'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { cn } from '@/lib/utils'
import { operationFilterStore, tips } from '@/store/operationFilter.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'

/**
 * Фильтры операций на телефоне — панель снизу, а не боковая колонка.
 *
 * Здесь то, чем фильтруют в дороге: тип операции, даты и сумма. Выбор по
 * контрагентам, статьям и сделкам остаётся на большом экране — это списки
 * на сотни строк, и на телефоне ими почти не пользуются.
 */
const OperationFilters = observer(({ open, onClose }) => {
  const t = useTranslations('Operations')
  const tf = useTranslations('filters')
  const tm = useTranslations('Mobile')

  const range = operationFilterStore.selectedDatePaymentRange || { start: '', end: '' }
  const amount = operationFilterStore.amountRange || { min: '', max: '' }

  const setRange = (key, value) =>
    operationFilterStore.setSelectedDatePaymentRange({ ...range, [key]: value })

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={tf('openFilters')}
      className="h-[80vh]"
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => operationFilterStore.resetFilters()}
            className="h-12 flex-1 rounded-2xl bg-slate-100 text-[15px] font-semibold text-slate-700 active:bg-slate-200"
          >
            {tf('reset')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4]"
          >
            {tm('filters.apply')}
          </button>
        </div>
      }
    >
      {/* Типы операций */}
      <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
        {t('filters.operationType')}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {tips.map((tip) => {
          const active = operationFilterStore.selectedFilters?.includes(tip)
          return (
            <button
              key={tip}
              type="button"
              onClick={() => operationFilterStore.toggleFilter(tip)}
              className={cn(
                'rounded-full px-3.5 py-2 text-[13px] font-semibold',
                active ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {tip}
            </button>
          )
        })}
      </div>

      {/* Даты оплаты */}
      <div className="pt-6 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
        {t('filters.paymentDate')}
      </div>
      <div className="mt-2.5 flex gap-2.5">
        <input
          type="date"
          value={range.start || ''}
          onChange={(event) => setRange('start', event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-2xl bg-slate-100 px-3.5 text-sm text-slate-900 outline-none"
        />
        <input
          type="date"
          value={range.end || ''}
          onChange={(event) => setRange('end', event.target.value)}
          className="h-12 min-w-0 flex-1 rounded-2xl bg-slate-100 px-3.5 text-sm text-slate-900 outline-none"
        />
      </div>

      {/* Сумма */}
      <div className="pt-6 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
        {t('columns.amount')}
      </div>
      <div className="mt-2.5 flex gap-2.5">
        <input
          inputMode="decimal"
          value={amount.min || ''}
          onChange={(event) =>
            operationFilterStore.setAmountRange({ ...amount, min: event.target.value })
          }
          placeholder={tm('filters.from')}
          className="h-12 min-w-0 flex-1 rounded-2xl bg-slate-100 px-3.5 text-sm tabular-nums text-slate-900 outline-none placeholder:text-slate-400"
        />
        <input
          inputMode="decimal"
          value={amount.max || ''}
          onChange={(event) =>
            operationFilterStore.setAmountRange({ ...amount, max: event.target.value })
          }
          placeholder={tm('filters.to')}
          className="h-12 min-w-0 flex-1 rounded-2xl bg-slate-100 px-3.5 text-sm tabular-nums text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      <p className="pt-5 text-[11px] leading-relaxed text-slate-400">{tm('filters.desktopOnly')}</p>
    </BottomSheet>
  )
})

export default OperationFilters
