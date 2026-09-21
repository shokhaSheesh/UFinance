'use client'

import Segmented from '@/components/shared/Segmented/Segmented'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { indicators } from '../../../store/indicatos.store'
import MultiSelectZdelka from '../../ReadyComponents/MultiZdelka'
import SelectMyAccounts from "../../ReadyComponents/SelectMyAccounts"
import SelectProjects from "../../ReadyComponents/SelectProjects"
import { appStore } from "../../../store/app.store"
import CustomRangeMonthPicker from '../../shared/CustomRangeMonthPicker'

const Field = ({ label, className, children }) => (
  <div className={cn('flex min-w-0 flex-col gap-1', className)}>
    <span className="text-xs font-medium text-slate-500">{label}</span>
    {children}
  </div>
)

const len = (value) => (Array.isArray(value) ? value.length : value ? 1 : 0)

/**
 * Шапка «Показателей»: заголовок с сегодняшней датой, общие фильтры всех
 * графиков с видимыми подписями (раньше только плейсхолдеры, пропадавшие
 * после выбора), шаг — переключателем. «Сбросить» раньше сбрасывал локальные
 * переменные, которые ничего не фильтровали, и не показывался; теперь он
 * сбрасывает сами фильтры и виден, когда что-то выбрано.
 */
const IndicatorsNavbar = () => {
  const t = useTranslations('Indicators')

  const monthsFull = t('common.monthNamesFull').split(',')
  const weekdayNames = t('common.weekdayNames').split(',')
  const today = new Date()
  const dateText = `${String(today.getDate()).padStart(2, '0')} ${monthsFull[today.getMonth()]} ${today.getFullYear()}, ${weekdayNames[today.getDay()]}`

  const displayOptions = [
    { value: 'weekly', label: t('header.displayOptions.weekly') },
    { value: 'monthly', label: t('header.displayOptions.monthly') },
    { value: 'quarterly', label: t('header.displayOptions.quarterly') },
    { value: 'yearly', label: t('header.displayOptions.yearly') },
  ]

  const activeCount =
    len(toJS(indicators.accounts)) +
    len(toJS(indicators.deals)) +
    (appStore.projectActive ? len(toJS(indicators.projects)) : 0) +
    (indicators.periodType !== 'monthly' ? 1 : 0)

  const handleReset = () => {
    indicators.setState('periodType', 'monthly')
    indicators.setState('accounts', [])
    indicators.setState('deals', [])
    indicators.setState('projects', [])
    indicators.resetMonth()
  }

  return (
    <div id="indicator_header" className="bg-white">
      <div className="flex items-end justify-between gap-6 px-6 pt-4 pb-3">
        <div className="shrink-0">
          <h1 className="text-xl font-semibold text-slate-900">{t('header.title')}</h1>
          <p className="text-sm capitalize text-slate-500">{dateText}</p>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 cursor-pointer hover:bg-slate-100 hover:text-slate-900"
          >
            <RotateCcw size={14} aria-hidden="true" />
            {t('header.reset')}
            <span className="rounded-full bg-[#0e73f6] px-1.5 text-xs font-semibold text-white tabular-nums">{activeCount}</span>
          </button>
        )}
      </div>

      {/* Общие фильтры всех графиков */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-6 pb-4">
        <Field label={t('header.labels.period')} className="w-[190px]">
          <CustomRangeMonthPicker
            value={indicators.rangeMonth}
            onChange={(months) => indicators.setState('rangeMonth', months)}
            format="MMM 'YY"
            range
          />
        </Field>
        <Field label={t('header.labels.display')}>
          <Segmented
            ariaLabel={t('header.labels.display')}
            options={displayOptions}
            value={indicators.periodType}
            onChange={(value) => indicators.setState('periodType', value)}
          />
        </Field>
        <Field label={t('header.labels.accounts')} className="w-[200px]">
          <SelectMyAccounts
            value={indicators.accounts}
            onChange={(value) => indicators.setState('accounts', value)}
            placeholder={t('header.placeholders.account')}
            className="bg-white"
          />
        </Field>
        {appStore.projectActive && (
          <Field label={t('header.labels.projects')} className="w-[200px]">
            <SelectProjects
              multi
              value={indicators.projects}
              onChange={(value) => indicators.setState('projects', value)}
              placeholder={t('header.placeholders.project')}
              className="bg-white"
            />
          </Field>
        )}
        <Field label={t('header.labels.deals')} className="w-[200px]">
          <MultiSelectZdelka
            value={indicators.deals}
            onChange={(value) => indicators.setState('deals', value)}
            placeholder={t('header.placeholders.deal')}
            className="bg-white"
          />
        </Field>
      </div>

    </div>
  )
}

/**
 * Строка разделов «Показателей» — прилипает к верху при прокрутке: клик
 * прокручивает к графику, раздел в верхней части экрана подсвечен.
 */
export function IndicatorsSectionNav({ sections = [], activeSection, onJump }) {
  const t = useTranslations('Indicators')
  if (!sections.length) return null
  return (
    <nav aria-label={t('header.sections')} className="flex items-center gap-1 overflow-x-auto border-y border-slate-200 bg-white px-4">
      {sections.map((section) => {
        const active = activeSection === section.id
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onJump?.(section.id)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              '-mb-px flex h-11 shrink-0 items-center border-b-2 px-3 text-sm font-medium cursor-pointer transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0e73f6]',
              active ? 'border-[#0e73f6] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
            )}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}

export default observer(IndicatorsNavbar)
