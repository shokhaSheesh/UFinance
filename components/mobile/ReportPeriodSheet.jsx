'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import CalendarSheet from '@/components/mobile/CalendarSheet'
import { cn } from '@/lib/utils'
import { CalendarDays } from '@/components/mobile/icons'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Период отчёта: быстрые варианты, разбивка и точные даты.
 *
 * На телефоне период меняют чаще всего — «покажи этот месяц», «покажи
 * год». Поэтому сверху готовые отрезки одним нажатием, ниже — разбивка на
 * колонки (день / месяц / квартал / год), и только потом точные даты для
 * тех случаев, когда нужен нестандартный отрезок.
 */

/** Готовые отрезки: считаются от сегодняшнего дня. */
const PRESETS = [
  { key: 'month', label: 'presetMonth', range: () => [moment().startOf('month'), moment().endOf('month')] },
  { key: 'quarter', label: 'presetQuarter', range: () => [moment().startOf('quarter'), moment().endOf('quarter')] },
  { key: 'year', label: 'presetYear', range: () => [moment().startOf('year'), moment().endOf('year')] },
  {
    key: 'lastMonth',
    label: 'presetLastMonth',
    range: () => [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
  },
]

/**
 * Панель монтируется заново при каждом открытии, поэтому начальные значения
 * берутся из отчёта без синхронизации эффектом.
 */
export default function ReportPeriodSheet({ open, ...props }) {
  if (!open) return null
  return <PeriodSheet {...props} />
}

function PeriodSheet({ onClose, start, end, grouping, groupingOptions = [], onApply }) {
  const t = useTranslations('Mobile')
  const tc = useTranslations('Common')

  const [from, setFrom] = useState(start)
  const [to, setTo] = useState(end)
  const [group, setGroup] = useState(grouping)
  const [picking, setPicking] = useState(null)

  const applyPreset = (preset) => {
    const [a, b] = preset.range()
    setFrom(a.format('YYYY-MM-DD'))
    setTo(b.format('YYYY-MM-DD'))
  }

  return (
    <>
      <BottomSheet
        open
        onClose={onClose}
        title={t('reports.period')}
        className="h-[80vh]"
        footer={
          <button
            type="button"
            onClick={() => {
              onApply({ start: from, end: to, grouping: group })
              onClose()
            }}
            className="h-12 w-full rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white active:bg-[#0b5fd4]"
          >
            {tc('save')}
          </button>
        }
      >
        {/* Готовые отрезки */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-full bg-slate-100 px-3.5 py-2 text-[13px] font-semibold text-slate-700 active:bg-slate-200"
            >
              {t(`reports.${preset.label}`)}
            </button>
          ))}
        </div>

        {/* Разбивка на колонки */}
        {groupingOptions.length > 0 && (
          <>
            <div className="pt-6 pb-2.5 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
              {t('reports.grouping')}
            </div>
            <div className="flex flex-wrap gap-2">
              {groupingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGroup(option.value)}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-[13px] font-semibold',
                    group === option.value ? 'bg-[#0e73f6] text-white' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Точные даты */}
        <div className="pt-6 pb-2.5 text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">
          {t('reports.exactDates')}
        </div>
        <div className="flex gap-2.5">
          {[
            { key: 'from', label: t('filters.from'), value: from, set: setFrom },
            { key: 'to', label: t('filters.to'), value: to, set: setTo },
          ].map((field) => (
            <button
              key={field.key}
              type="button"
              onClick={() => setPicking(field.key)}
              className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl bg-slate-100 px-3.5 py-2.5 text-left"
            >
              <span className="text-[11px] text-slate-500">{field.label}</span>
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[15px] font-semibold text-slate-900">
                  {field.value ? moment(field.value).format('DD.MM.YYYY') : '—'}
                </span>
                <CalendarDays size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <CalendarSheet
        open={picking === 'from'}
        onClose={() => setPicking(null)}
        value={from}
        onChange={setFrom}
        title={t('filters.from')}
      />
      <CalendarSheet
        open={picking === 'to'}
        onClose={() => setPicking(null)}
        value={to}
        onChange={setTo}
        title={t('filters.to')}
      />
    </>
  )
}
