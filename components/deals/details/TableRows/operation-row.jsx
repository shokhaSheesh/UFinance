'use client'
import React, { useState } from 'react'
import { CurrencyDollar as BsCurrencyDollar } from '@/components/icons'
import { CurrencyRub as TbCurrencyRubel } from '@/components/icons'
import { CurrencyKztDuotone as PiCurrencyKztDuotone } from '@/components/icons'
import { formatAmount } from '@/utils/helpers'

/* ─── helpers ─────────────────────────────────────────────── */
const CurrencySymbol = ({ currency }) => {
  if (currency === 'USD') return <BsCurrencyDollar className="inline w-3.5 h-3.5" />
  if (currency === 'RUB') return <TbCurrencyRubel className="inline w-3.5 h-3.5" />
  if (currency === 'KZT') return <PiCurrencyKztDuotone className="inline w-3.5 h-3.5" />
  return <span className="text-xs">UZS</span>
}

const AmountCell = ({ summa, tip, currency, percent }) => {
  const isIncome = tip === 'Поступление'
  const isExpense = tip === 'Выплата'

  const color = isIncome
    ? 'text-emerald-600'
    : isExpense
      ? 'text-red-500'
      : 'text-gray-600'

  const sign = isIncome ? '+' : isExpense ? '-' : ''
  const formatted = formatAmount ? formatAmount(summa) : summa?.toLocaleString('ru-RU') ?? '0'

  return (
    <span className={`font-medium text-sm ${color} whitespace-nowrap`}>
      {sign}{formatted}&nbsp;<CurrencySymbol currency={currency} />
      {percent != null && (
        <span className="text-gray-400 font-normal ml-1">({Math.round(percent)}%)</span>
      )}
    </span>
  )
}

/* ─── main component ──────────────────────────────────────── */
const DealOperationTableRow = ({ op, openOperationModal, handleEditOperation, handleDeleteOperation }) => {
  const hasParts = op?.operationParts?.length > 0
  const [expanded, setExpanded] = useState(true)

  // Derive aggregate display values for parent when splits exist
  const uniqueCounterparties = hasParts
    ? [...new Set(op.operationParts.map(p => p.counterparty).filter(Boolean))]
    : []
  const uniqueArticles = hasParts
    ? [...new Set(op.operationParts.map(p => p.chartOfAccounts).filter(Boolean))]
    : []

  const counterpartyLabel = hasParts
    ? uniqueCounterparties.length > 1
      ? `${uniqueCounterparties.length} контрагента`
      : uniqueCounterparties[0] || op.counterparty || '—'
    : op.counterparty || '—'

  const articleLabel = hasParts
    ? uniqueArticles.length > 1
      ? `${uniqueArticles.length} статьи`
      : uniqueArticles[0] || op.chartOfAccounts || '—'
    : op.chartOfAccounts || '—'

  const rowClick = () => {
    if (openOperationModal) openOperationModal(op)
  }

  return (
    <>
      {/* ── Parent row ── */}
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={rowClick}
      >
        {/* Date */}
        <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap w-32">
          <div className="flex items-center gap-2">
            {hasParts && (
              <button
                onClick={e => { e.stopPropagation(); setExpanded(p => !p) }}
                className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-400 shrink-0 bg-white"
                aria-label={expanded ? 'Свернуть' : 'Развернуть'}
              >
                <span className="text-xs leading-none select-none">{expanded ? '−' : '+'}</span>
              </button>
            )}
            <span>{op.operationDate || op.accrualDate || '—'}</span>
          </div>
        </td>

        {/* Account */}
        <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
          {op.my_account_name || '—'}
        </td>

        {/* Counterparty */}
        <td className="py-3 px-4 text-sm text-gray-700">
          {counterpartyLabel}
        </td>

        {/* Article */}
        <td className="py-3 px-4 text-sm text-gray-700">
          <div className="max-w-[200px]">
            <p className="truncate">{articleLabel}</p>
          </div>
        </td>

        {/* Amount */}
        <td className="py-3 px-4 text-right">
          <AmountCell
            summa={op.summa}
            tip={op.tip}
            currency={op.currency}
          />
        </td>
      </tr>

      {/* ── Child / split rows ── */}
      {hasParts && expanded && op.operationParts.map((part, idx) => {
        const totalSumma = op.summa || 1
        const percent = totalSumma ? (part.summa / totalSumma) * 100 : null

        return (
          <tr
            key={part.guid || idx}
            className="border-b border-gray-50 bg-gray-50/40 hover:bg-gray-100/50 transition-colors"
          >
            {/* Date — indented */}
            <td className="py-2 px-4 text-sm text-gray-500 whitespace-nowrap">
              <div className="flex items-center gap-2">
                {/* indent line */}
                <div className="shrink-0 w-5 flex justify-center">
                  <div className="w-px h-full bg-gray-300 mx-auto" />
                </div>
                <span>{part.operationDate || part.accrualDate || '—'}</span>
              </div>
            </td>

            {/* Account (empty for splits, mirroring the design) */}
            <td className="py-2 px-4 text-sm text-gray-500">
              {part.my_account_name || ''}
            </td>

            {/* Counterparty */}
            <td className="py-2 px-4 text-sm text-gray-700">
              {part.counterparty || '—'}
            </td>

            {/* Article */}
            <td className="py-2 px-4 text-sm text-gray-700">
              <div className="max-w-[200px]">
                <p className="truncate">{part.chartOfAccounts || '—'}</p>
              </div>
            </td>

            {/* Amount with % */}
            <td className="py-2 px-4 text-right">
              <AmountCell
                summa={part.summa}
                tip={part.tip || op.tip}
                currency={part.currency || op.currency}
                percent={percent}
              />
            </td>
          </tr>
        )
      })}
    </>
  )
}

export default DealOperationTableRow