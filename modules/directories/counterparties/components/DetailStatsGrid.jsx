import { GlobalCurrency } from '@/constants/globalCurrency'
import { cn } from '@/lib/utils'
import { formatAmount, formatNumber, formatTotalSumma } from '@/utils/helpers'
import { PenLine } from 'lucide-react'
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

const DetailStatsGrid = ({ t, tc, counterpartyInfo, stats, filters, onEdit }) => {
  const hasInfo = counterpartyInfo?.inn === null && counterpartyInfo?.kpp?.length === 0 && counterpartyInfo?.accountNumber?.length === 0 && counterpartyInfo?.bank === null && counterpartyInfo?.mfo === null && counterpartyInfo?.address === null && counterpartyInfo?.receiptArticle === null && counterpartyInfo?.paymentArticle === null && counterpartyInfo?.comment === null

  return (
    <div className="flex gap-4 px-6 pb-5">
      {/* Financial stats */}
      <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 min-w-[200px]">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.receipts') : t('stats.income')}</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatAmount(counterpartyInfo?.income)}
              <span className="text-base ml-2 text-slate-500">{GlobalCurrency?.name}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
              <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.payments') : t('stats.expenses')}</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatAmount(counterpartyInfo?.expense)}
              <span className="text-base ml-2 text-slate-500">{GlobalCurrency?.name}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", stats.difference >= 0 ? 'bg-emerald-500' : 'bg-red-500')}></div>
              <span className="text-xs text-slate-700 font-medium">{filters.calculationMethod === 'Cashflow' ? t('stats.difference') : t('stats.profit')}</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {formatAmount(counterpartyInfo?.difference)}
              <span className="text-base ml-2 text-slate-500">{GlobalCurrency?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Debt cards */}
      <div className="flex flex-col gap-4 min-w-[180px]">
        <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 flex-1">
          <div className="text-sm text-slate-700 font-medium mb-1.5">{t('stats.receivables')}</div>
          <div className="text-xs text-slate-500">
            {counterpartyInfo?.debitorka ? formatNumber(formatTotalSumma(counterpartyInfo.debitorka)) : t('stats.noDebt')}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-4 flex-1">
          <div className="text-sm text-slate-700 font-medium mb-1.5">{t('stats.payables')}</div>
          <div className="text-xs text-slate-500">
            {counterpartyInfo?.kreditorka ? formatNumber(formatTotalSumma(counterpartyInfo.kreditorka)) : t('stats.noDebt')}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg border border-gray-200 drop-shadow-xl transition-shadow p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-base font-semibold text-slate-900">{counterpartyInfo?.name || tc('noName')}</h1>
          <PenLine size={12} className="text-slate-700 cursor-pointer hover:text-slate-900 transition-colors" onClick={onEdit} />
        </div>
        <div className="h-px bg-gray-200 mb-4"></div>
        {hasInfo ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <span className="text-xs text-slate-400 text-center">{t('info.noRequisites')}</span>
            <button className="flex items-center gap-2 px-5 py-2 text-xs text-slate-600 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm" onClick={onEdit}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="8" stroke="#6b7280" strokeWidth="1.2" />
                <path d="M9 5.5V12.5M5.5 9H12.5" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {t('info.addRequisites')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[
              { label: t('info.inn'), value: counterpartyInfo?.inn || '–' },
              { label: t('info.address'), value: counterpartyInfo?.address || '–' },
              { label: t('info.kpp'), value: <RenderMultiValue values={counterpartyInfo?.kpp} type="kpp" t={t} /> },
              { label: t('info.accountNumber'), value: <RenderMultiValue values={counterpartyInfo?.accountNumber} type="accountNumber" t={t} /> },
              { label: t('info.bank'), value: counterpartyInfo?.bank || '–' },
              { label: t('info.mfo'), value: counterpartyInfo?.mfo || '–' },
              { label: t('info.receiptArticle'), value: counterpartyInfo?.receiptArticle || '–' },
              { label: t('info.paymentArticle'), value: counterpartyInfo?.paymentArticle || '–' },
              { label: t('info.comment'), value: counterpartyInfo?.comment || '–' },
            ].map(({ label, value }, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-normal shrink-0">{label}</span>
                <span className="text-sm text-slate-900 font-normal flex items-center">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailStatsGrid
