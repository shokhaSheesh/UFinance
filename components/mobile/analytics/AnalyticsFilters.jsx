'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { MMultiSelectField } from '@/components/mobile/fields'
import ReportPeriodSheet from '@/components/mobile/ReportPeriodSheet'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { listProjects } from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { appStore } from '@/store/app.store'
import { indicators } from '@/store/indicatos.store'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, SlidersHorizontal } from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

/**
 * Фильтры аналитики на телефоне — «Моя компания» и «Показатели».
 *
 * Те же, что в шапке этих страниц на компьютере, и то же хранилище
 * (indicators): период, шаг, счета, проекты и сделки. Поменяли период на
 * телефоне — на компьютере он тот же, и наоборот.
 */
const AnalyticsFilters = observer(() => {
  const t = useTranslations('Indicators')
  const tf = useTranslations('filters')
  const [periodOpen, setPeriodOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { rangeMonth, periodType, accounts, projects, deals } = indicators
  const activeCount = (accounts?.length ? 1 : 0) + (projects?.length ? 1 : 0) + (deals?.length ? 1 : 0)

  const groupingOptions = ['weekly', 'monthly', 'quarterly', 'yearly'].map((value) => ({
    value,
    label: t(`header.displayOptions.${value}`),
  }))

  // Списки грузим, только когда открыта панель фильтров
  const { data: accountList = [], isLoading: loadingAccounts } = useUcodeRequestQuery({
    method: 'get_my_accounts',
    data: { page: 1, limit: 100, active: true },
    skip: !filtersOpen,
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: dealList = [], isLoading: loadingDeals } = useUcodeRequestQuery({
    method: 'get_sales_list_simple',
    data: { page: 1, limit: 100 },
    skip: !filtersOpen,
    querySetting: { select: (response) => response?.data?.data || [], staleTime: 1000 * 60 * 10 },
  })
  const { data: projectList = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['select_projects', ''],
    queryFn: () => listProjects({ page: 1, limit: 100 }),
    select: (response) => response?.data || [],
    enabled: filtersOpen && Boolean(appStore.projectActive),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPeriodOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 text-left active:bg-slate-50"
        >
          <CalendarDays size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900">
            {[rangeMonth?.start, rangeMonth?.end].map((date) => moment(date).format('MMM YYYY')).join(' — ')}
          </span>
          <span className="shrink-0 text-[13px] font-semibold text-[#0e73f6]">
            {groupingOptions.find((option) => option.value === periodType)?.label}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label={tf('openFilters')}
          className={cn(
            'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            activeCount ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
          )}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#f4f5f7] bg-red-500 px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <ReportPeriodSheet
        open={periodOpen}
        onClose={() => setPeriodOpen(false)}
        start={rangeMonth?.start}
        end={rangeMonth?.end}
        grouping={periodType}
        groupingOptions={groupingOptions}
        onApply={({ start, end, grouping }) => {
          indicators.setState('rangeMonth', { start: moment(start).toDate(), end: moment(end).toDate() })
          indicators.setState('periodType', grouping)
        }}
      />

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={tf('openFilters')}
        footer={
          <button
            type="button"
            onClick={() => {
              indicators.setState('accounts', [])
              indicators.setState('projects', [])
              indicators.setState('deals', [])
            }}
            className="h-12 w-full rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
          >
            {tf('reset')}
          </button>
        }
      >
        <div className="flex flex-col gap-2 [&>button]:bg-slate-50">
          <MMultiSelectField
            label={t('header.labels.accounts')}
            value={accounts || []}
            options={accountList.map((item) => ({ value: item.guid, label: item.nazvanie, sub: item.legal_entity_name }))}
            loading={loadingAccounts}
            onChange={(value) => indicators.setState('accounts', value)}
          />
          {appStore.projectActive && (
            <MMultiSelectField
              label={t('header.labels.projects')}
              value={projects || []}
              options={projectList.map((item) => ({ value: item.guid, label: item.name }))}
              loading={loadingProjects}
              onChange={(value) => indicators.setState('projects', value)}
            />
          )}
          <MMultiSelectField
            label={t('header.labels.deals')}
            value={deals || []}
            options={dealList.map((item) => ({ value: item.guid, label: item.name || item.nazvanie }))}
            loading={loadingDeals}
            onChange={(value) => indicators.setState('deals', value)}
          />
        </div>
      </BottomSheet>
    </>
  )
})

export default AnalyticsFilters
