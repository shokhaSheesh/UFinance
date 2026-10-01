'use client'

import { MOBILE_OPERATION_TYPES } from '@/constants/operationTypes'
import BottomSheet from '@/components/mobile/BottomSheet'
import ProjectFormSheet from '@/components/mobile/forms/ProjectFormSheet'
import ProjectFigures from '@/components/mobile/ProjectFigures'
import { MCard, MEmpty, MScreenHeader } from '@/components/mobile/ui'
import Money from '@/components/shared/Money'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useRouter } from '@/hooks/useAppRouter'
import useMounted from '@/hooks/useMounted'
import { STATUS_COLORS } from '@/lib/api/ucode/projects'
import { cn } from '@/lib/utils'
import { useProjectOperations } from '@/modules/projects/hooks/useProjectOperations'
import { useProjectPnl } from '@/modules/projects/hooks/useProjectPnl'
import { useDeleteProject, useProject, useUpdateProjectStatus } from '@/modules/projects/hooks/useProjectsData'
import { appStore } from '@/store/app.store'
import {
  Check,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Receipt,
  Trash2,
  Wallet,
} from '@/components/mobile/icons'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Проект на телефоне.
 *
 * Как дашборд проекта на компьютере: статус (меняется касанием), группа и
 * срок, затем прибыль, рентабельность, доходы и расходы за выбранный
 * период по выбранному методу — листаются карточками, — и операции по
 * проекту лентой. P&L и операции берутся теми же хуками, что на
 * компьютере.
 */

const STATUSES = ['planned', 'in_progress', 'completed']

// Вид типов на телефоне: цвет только у поступления и выплаты (constants/operationTypes.js)
const TYPE_LOOK = MOBILE_OPERATION_TYPES

/** Готовые периоды — у дашборда проекта по умолчанию «этот год». */
const PERIODS = {
  thisMonth: () => ({ start: moment().startOf('month').toDate(), end: moment().endOf('month').toDate() }),
  lastMonth: () => ({
    start: moment().subtract(1, 'month').startOf('month').toDate(),
    end: moment().subtract(1, 'month').endOf('month').toDate(),
  }),
  thisYear: () => ({ start: moment().startOf('year').toDate(), end: moment().toDate() }),
}

const MobileProjectPage = observer(() => {
  const t = useTranslations('Projects')
  const td = useTranslations('Projects.detail')
  const ts = useTranslations('Projects.status')
  const tc = useTranslations('Common')
  const tm = useTranslations('Mobile')
  const router = useRouter()
  const params = useParams()
  const mounted = useMounted()
  const guid = params?.id

  const [method, setMethod] = useState('accrual')
  const [periodKey, setPeriodKey] = useState('thisYear')
  const [dateRange, setDateRange] = useState(PERIODS.thisYear)
  const [sheet, setSheet] = useState(null) // actions | status | delete
  const [formOpen, setFormOpen] = useState(false)

  const permissions = appStore.permission?.projects || {}
  const { project, isLoading } = useProject(guid)
  const pnl = useProjectPnl(guid, { isCalculation: method, dateRange })
  const ops = useProjectOperations(guid)
  const statusMutation = useUpdateProjectStatus()
  const deleteMutation = useDeleteProject()

  const sentinelRef = useRef(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = ops
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const currency = mounted ? GlobalCurrency?.name || pnl.currency : ''

  if (isLoading && !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" aria-hidden="true" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-full px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <MScreenHeader title={t('pageTitle')} onBack={() => router.push('/m/projects')} />
        <MEmpty icon={Wallet} title={t('empty')} />
      </div>
    )
  }

  const color = STATUS_COLORS[project.status]
  const elapsed = (() => {
    if (!project.startDate || !project.endDate) return null
    const total = moment(project.endDate).diff(moment(project.startDate), 'days')
    if (total <= 0) return null
    return Math.max(0, Math.min(100, Math.round((moment().diff(moment(project.startDate), 'days') / total) * 100)))
  })()


  const sections = [
    { key: 'future', items: ops.operationsList.future },
    { key: 'today', items: ops.operationsList.today },
    { key: 'before', items: ops.operationsList.before },
  ].filter((section) => section.items.length)

  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 pt-[max(env(safe-area-inset-top),12px)] pb-28">
      <MScreenHeader
        title={project.name}
        onBack={() => router.push('/m/projects')}
        action={
          (permissions.edit || permissions.delete) && (
            <button
              type="button"
              onClick={() => setSheet('actions')}
              aria-label={tc('actions')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 active:bg-slate-100"
            >
              <MoreHorizontal size={19} aria-hidden="true" />
            </button>
          )
        }
      />

      {/* Статус, группа и срок */}
      <MCard>
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[13px] text-slate-500">{project.groupName || td('allProjects')}</span>
          <button
            type="button"
            disabled={!permissions.edit || statusMutation.isPending}
            onClick={() => setSheet('status')}
            className="flex shrink-0 items-center gap-1.5 rounded-full py-1.5 pr-2.5 pl-3 text-[13px] font-semibold disabled:opacity-80"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {statusMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            )}
            {ts(project.status)}
            {permissions.edit && <ChevronDown size={14} aria-hidden="true" />}
          </button>
        </div>
        {(project.startDate || project.endDate) && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between gap-2 text-[12px] text-slate-500">
              <span className="truncate font-medium text-slate-700">
                {[project.startDate, project.endDate].map((date) => (date ? moment(date).format('D MMM YYYY') : '…')).join(' → ')}
              </span>
              {elapsed != null && <span className="shrink-0 font-semibold">{t('termElapsed', { percent: elapsed })}</span>}
            </div>
            {elapsed != null && (
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${elapsed}%`, backgroundColor: color }} />
              </div>
            )}
          </div>
        )}
        {project.comment && <p className="mt-3 border-t border-slate-100 pt-3 text-[13px] text-slate-600">{project.comment}</p>}
      </MCard>

      {/* Метод и период */}
      <div className="mt-2.5 flex rounded-2xl bg-white p-1">
        {['cash', 'accrual'].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMethod(value)}
            className={cn(
              'min-w-0 flex-1 truncate rounded-xl px-2 py-2.5 text-[12px] font-semibold',
              method === value ? 'bg-[#0e73f6] text-white' : 'text-slate-500'
            )}
          >
            {t(`methods.${value}`)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {Object.keys(PERIODS).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setPeriodKey(key)
              setDateRange(PERIODS[key]())
            }}
            className={cn(
              'rounded-full px-3.5 py-2 text-[13px] font-semibold',
              periodKey === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
            )}
          >
            {tm(`counterparties.${key}`)}
          </button>
        ))}
      </div>

      {/* Итоги проекта за период — одной карточкой */}
      <div className="mt-2.5">
        <ProjectFigures
          income={pnl.income}
          expenses={pnl.expenses}
          profit={pnl.profit}
          profitability={pnl.profitability}
          currency={currency}
          loading={pnl.isLoading}
        />
      </div>

      {/* Операции по проекту */}
      <div className="flex items-baseline justify-between gap-3 px-1 pt-6 pb-2.5">
        <span className="text-[15px] font-bold text-slate-900">{td('operationsTitle')}</span>
        {ops.operations.length > 0 && <span className="text-[12px] text-slate-400">{td('opCount', { count: ops.operations.length })}</span>}
      </div>

      {ops.isLoading && !ops.operations.length && (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
        </div>
      )}
      {!ops.isLoading && !ops.operations.length && <MEmpty icon={Receipt} title={td('emptyOps.title')} />}

      {sections.map((section) => (
        <div key={section.key} className="mb-2.5">
          <div className="px-1 pb-1.5 text-[12px] font-semibold text-slate-400 uppercase">{td(`sections.${section.key}`)}</div>
          <MCard list>
            {section.items.map((operation) => {
              const look = TYPE_LOOK[operation.tip] || TYPE_LOOK['Начисление']
              const isIncome = operation.operationType === 'income'
              const isPayment = operation.operationType === 'payment'
              return (
                <button
                  key={operation.guid}
                  type="button"
                  onClick={() => router.push(`/m/transactions/${operation.guid}`)}
                  className="flex w-full items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', look.tone)}>
                    <look.icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">
                      {operation.counterparty || operation.chartOfAccounts || operation.tip}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                      {[operation.chartOfAccounts, operation.operationDate].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[15px] font-semibold',
                      isIncome ? 'text-emerald-600' : isPayment ? 'text-red-600' : 'text-slate-900'
                    )}
                  >
                    <Money value={operation.summa} currency={operation.currency || currency} sign={isIncome ? '+' : isPayment ? '−' : ''} />
                  </span>
                </button>
              )
            })}
          </MCard>
        </div>
      ))}

      <div ref={sentinelRef} className="h-6">
        {ops.isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 size={18} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Итог по операциям — как полоса внизу на компьютере */}
      {ops.operations.length > 0 && (
        <MCard className="mt-1 grid grid-cols-3 divide-x divide-slate-100 px-4 py-3">
          <div className="min-w-0 pr-2">
            <div className="truncate text-[11px] text-slate-400">{td('opIncome')}</div>
            <div className="mt-0.5 truncate text-[13px] font-semibold text-emerald-600">
              <Money value={ops.summary.incoming} currency="" />
            </div>
          </div>
          <div className="min-w-0 px-2">
            <div className="truncate text-[11px] text-slate-400">{td('opExpense')}</div>
            <div className="mt-0.5 truncate text-[13px] font-semibold text-red-600">
              <Money value={ops.summary.outgoing} currency="" />
            </div>
          </div>
          <div className="min-w-0 pl-2">
            <div className="truncate text-[11px] text-slate-400">{td('opTotal')}</div>
            <div className={cn('mt-0.5 truncate text-[13px] font-bold', ops.summary.profit >= 0 ? 'text-slate-900' : 'text-red-600')}>
              <Money value={ops.summary.profit} currency="" />
            </div>
          </div>
        </MCard>
      )}

      {/* Статус */}
      <BottomSheet open={sheet === 'status'} onClose={() => setSheet(null)} title={td('toggleStatus')}>
        <div className="flex flex-col">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setSheet(null)
                if (status !== project.status) statusMutation.mutate({ guid: project.id, status })
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
              <span className={cn('flex-1 text-[15px]', project.status === status ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                {ts(status)}
              </span>
              {project.status === status && <Check size={17} className="text-[#0e73f6]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* «…» проекта */}
      <BottomSheet open={sheet === 'actions'} onClose={() => setSheet(null)} title={project.name}>
        <div className="flex flex-col">
          {permissions.edit && (
            <button
              type="button"
              onClick={() => {
                setSheet(null)
                setFormOpen(true)
              }}
              className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Pencil size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-slate-900">{tc('edit')}</span>
            </button>
          )}
          {permissions.delete && (
            <button type="button" onClick={() => setSheet('delete')} className="flex items-center gap-3 py-3.5 text-left active:bg-red-50">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={18} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold text-red-600">{tc('delete')}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
        title={tc('delete')}
        footer={
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setSheet(null)} className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700">
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(project.id, { onSuccess: () => router.push('/m/projects') })}
              disabled={deleteMutation.isPending}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-600 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {deleteMutation.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {tc('delete')}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">{project.name}</p>
      </BottomSheet>

      <ProjectFormSheet open={formOpen} project={project} onClose={() => setFormOpen(false)} />
    </div>
  )
})

export default MobileProjectPage
