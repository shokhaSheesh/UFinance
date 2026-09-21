import KpiCard from '@/components/shared/KpiCard/KpiCard'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { ArrowDownLeft, ArrowUpRight, PenLine, Plus, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

const RenderMultiValue = ({ values, type, t }) => {
  const [activePopover, setActivePopover] = useState(null)

  if (!values || values.length === 0) return '–'
  if (values.length === 1) return values[0]

  return (
    <div className="relative inline-flex items-center gap-1">
      <span>{values[0]}</span>
      <button
        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === type ? null : type) }}
      >
        +{values.length - 1}
      </button>
      {activePopover === type && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              {type === 'kpp' ? t('info.additionalKpp') : t('info.additionalAccounts')}
            </span>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {values.slice(1).map((val, idx) => (
              <div key={idx} className="text-sm text-gray-600 py-1">{val}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const DetailStatsGrid = ({ t, tc, counterpartyInfo, filters, onEdit }) => {
  const tl = useTranslations('Directories.counterparty.list')
  const hasInfo = counterpartyInfo?.inn === null && counterpartyInfo?.kpp?.length === 0 && counterpartyInfo?.accountNumber?.length === 0 && counterpartyInfo?.bank === null && counterpartyInfo?.mfo === null && counterpartyInfo?.address === null && counterpartyInfo?.receiptArticle === null && counterpartyInfo?.paymentArticle === null && counterpartyInfo?.comment === null
  const isCashflow = filters.calculationMethod === 'Cashflow'
  const currency = GlobalCurrency?.name

  // Те же пять показателей, что были в трёх карточках разного размера
  const kpis = [
    {
      key: 'income',
      label: isCashflow ? t('stats.receipts') : t('stats.income'),
      value: counterpartyInfo?.income,
      hint: isCashflow ? tl('kpi.receiptsHint') : tl('kpi.incomeHint'),
      icon: TrendingUp,
    },
    {
      key: 'expense',
      label: isCashflow ? t('stats.payments') : t('stats.expenses'),
      value: counterpartyInfo?.expense,
      hint: isCashflow ? tl('kpi.paymentsHint') : tl('kpi.expenseHint'),
      icon: TrendingDown,
    },
    {
      key: 'difference',
      label: isCashflow ? t('stats.difference') : t('stats.profit'),
      value: counterpartyInfo?.difference,
      hint: isCashflow ? tl('kpi.differenceHint') : tl('kpi.profitHint'),
      icon: Scale,
      tone: 'signed',
    },
    {
      key: 'receivables',
      label: t('stats.receivables'),
      value: counterpartyInfo?.debitorka,
      hint: counterpartyInfo?.debitorka ? tl('kpi.receivablesHint') : t('stats.noDebt'),
      icon: ArrowDownLeft,
    },
    {
      key: 'payables',
      label: t('stats.payables'),
      value: counterpartyInfo?.kreditorka,
      hint: counterpartyInfo?.kreditorka ? tl('kpi.payablesHint') : t('stats.noDebt'),
      icon: ArrowUpRight,
    },
  ]

  const requisites = [
    { label: t('info.inn'), value: counterpartyInfo?.inn || '–' },
    { label: t('info.kpp'), value: <RenderMultiValue values={counterpartyInfo?.kpp} type="kpp" t={t} /> },
    { label: t('info.accountNumber'), value: <RenderMultiValue values={counterpartyInfo?.accountNumber} type="accountNumber" t={t} /> },
    { label: t('info.bank'), value: counterpartyInfo?.bank || '–' },
    { label: t('info.mfo'), value: counterpartyInfo?.mfo || '–' },
    { label: t('info.address'), value: counterpartyInfo?.address || '–' },
    { label: t('info.receiptArticle'), value: counterpartyInfo?.receiptArticle || '–' },
    { label: t('info.paymentArticle'), value: counterpartyInfo?.paymentArticle || '–' },
    { label: t('info.comment'), value: counterpartyInfo?.comment || '–' },
  ]

  return (
    <div className="flex flex-col gap-3 px-6 pb-5">
      <div className="grid grid-cols-5 gap-3">
        {kpis.map(({ key, ...kpi }) => (
          <KpiCard key={key} currency={currency} {...kpi} />
        ))}
      </div>

      {/* Реквизиты */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{t('info.title')}</h2>
          {onEdit && !hasInfo && (
            <button type="button" onClick={onEdit} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900">
              <PenLine size={14} aria-hidden="true" />
              {tc('edit')}
            </button>
          )}
        </div>
        {hasInfo ? (
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-sm text-slate-500">{t('info.noRequisites')}</span>
            <button type="button" className="secondary-btn h-9 gap-2" onClick={onEdit}>
              <Plus size={16} aria-hidden="true" />
              {t('info.addRequisites')}
            </button>
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-x-8 gap-y-3 px-5 py-4">
            {requisites.map(({ label, value }, i) => (
              <div key={i} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="flex min-w-0 items-center truncate text-sm text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}

export default DetailStatsGrid
