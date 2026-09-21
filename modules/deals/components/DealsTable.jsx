// components/DealsTable.jsx
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSignature, Handshake, Trash2 } from 'lucide-react'
import { IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import InfiniteScroll from 'react-infinite-scroll-component'

import ScreenLoader from '@/components/shared/ScreenLoader'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'

import { cn } from '@/lib/utils'

import DealsTableHeader, { DEAL_COL } from '../components/DealsTableHeder'

/**
 * Virtualised infinite-scroll table of deals.
 */
export default function DealsTable({
  t,
  formattedDeals,
  dealsMethod,
  dealPermission,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
  fetchNextPage,
  onRowClick,
  onDeleteClick,
  onEditClick,
  onCopyClick,
  onUpdate,
}) {
  return (
    <>
      <DealsTableHeader t={t} />

      {formattedDeals?.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Handshake size={22} aria-hidden="true" />
          </span>
          <span className="text-sm text-slate-500">{t('empty')}</span>
        </div>
      )}

      <InfiniteScroll
        dataLength={formattedDeals?.length || 0}
        hasMore={hasNextPage}
        next={fetchNextPage}
        scrollThreshold={0.5}
        scrollableTarget="scrollableDiv"
      >
        <div className="flex flex-col">
          {formattedDeals?.map(deal => (
            <DealRow
              key={deal.guid}
              deal={deal}
              dealsMethod={dealsMethod}
              dealPermission={dealPermission}
              t={t}
              onRowClick={onRowClick}
              onDeleteClick={onDeleteClick}
              onEditClick={onEditClick}
              onCopyClick={onCopyClick}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </InfiniteScroll>

      {isLoading && formattedDeals.length === 0 && <ScreenLoader className="left-0!" />}
      {/* {(isFetchingNextPage || isFetching) && <ScreenLoader className="left-0!" />} */}
    </>
  )
}

// ─── Single row ──────────────────────────────────────────────────────────────
function DealRow({
  deal,
  dealsMethod,
  dealPermission,
  t,
  onRowClick,
  onDeleteClick,
  onEditClick,
  onCopyClick,
  onUpdate,
}) {
  const price = dealsMethod === 'accrual_method'
    ? deal?.accrual_method?.profit
    : deal?.cash_method?.profit

  const received = Number(deal?.receipts_percentage) || 0
  const shipped = Number(deal?.shipments_percentage) || 0
  const profit = Number(price) || 0

  return (
    <div
      onClick={(e) => onRowClick(deal, e)}
      className="group flex min-h-[56px] cursor-pointer items-center border-b border-slate-100 bg-white text-sm transition-colors hover:bg-[#f5f8ff]"
    >
      {/* Дата */}
      <div className={cn(DEAL_COL.date, 'px-4 tabular-nums text-slate-600')}>{formatDateFormat(deal.Data_sdelki)}</div>

      {/* Название и комментарий */}
      <div className={cn(DEAL_COL.name, 'flex min-w-0 flex-col px-3')}>
        <span className="truncate font-medium text-slate-900">{deal.nazvanie}</span>
        {deal.comment && <span className="truncate text-xs text-slate-400">{deal.comment}</span>}
      </div>

      {/* Клиент */}
      <div className={cn(DEAL_COL.client, 'flex min-w-0 items-center gap-2.5 px-3')}>
        <Monogram name={deal?.partner_name} />
        <span className="truncate text-slate-700">{deal?.partner_name || '-'}</span>
      </div>

      {/* Статус — цвет из справочника статусов */}
      <div className={cn(DEAL_COL.status, 'px-3')}>
        <StatusPill label={deal?.status} color={deal?.color} />
      </div>

      {/* Сумма */}
      <div className={cn(DEAL_COL.amount, 'px-3 text-right font-medium tabular-nums text-slate-900')}>
        {formatAmount(deal.summa_sdelki)}
      </div>

      {/* Поступило / отгружено — полоской, а не голым процентом: видно, на какой стадии сделка */}
      <div className={cn(DEAL_COL.progress, 'px-3')}>
        <Progress value={received} label={deal.postupilo || '0%'} barClass="bg-[#0e73f6]" />
      </div>
      <div className={cn(DEAL_COL.progress, 'px-3')}>
        <Progress value={shipped} label={deal.otgruzheno || '0%'} barClass="bg-slate-500" />
      </div>

      {/* Прибыль */}
      <div
        className={cn(
          DEAL_COL.profit,
          'px-3 text-right font-medium tabular-nums',
          profit === 0 ? 'text-slate-300' : profit < 0 ? 'text-red-600' : 'text-emerald-700'
        )}
      >
        {formatAmount(price)}
      </div>

      {/* Действия — отдельной колонкой, одним меню: раньше иконки лежали
          поверх прибыли и показывались только при наведении */}
      <div className={cn(DEAL_COL.menu, 'flex items-center justify-center')} onClick={(e) => e.stopPropagation()}>
        {(dealPermission.edit || dealPermission.add || dealPermission.delete || deal.contract_file) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RowActionsTrigger />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 p-1.5" align="end">
              {dealPermission.edit && (
                <DropdownMenuItem
                  onClick={(e) => onEditClick(deal, e)}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <MdOutlineModeEdit size={15} /> <span>{t('tooltips.edit')}</span>
                </DropdownMenuItem>
              )}
              {dealPermission.add && (
                <DropdownMenuItem
                  onClick={(e) => onCopyClick(deal, e)}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <IoCopyOutline size={15} /> <span>{t('tooltips.copy')}</span>
                </DropdownMenuItem>
              )}
              {dealPermission.edit && (
                <DropdownMenuItem
                  onClick={(e) => onUpdate(deal, e)}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <FileSignature size={15} /> <span>{t('tooltips.editContract')}</span>
                </DropdownMenuItem>
              )}
              {deal.contract_file && (
                <DropdownMenuItem
                  onClick={() => handleDownload(deal.contract_file, 'Договор.pdf')}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none"
                >
                  <Download size={15} /> <span>{t('tooltips.downloadContract')}</span>
                </DropdownMenuItem>
              )}
              {dealPermission.delete && (
                <DropdownMenuItem
                  onClick={(e) => onDeleteClick(deal, e)}
                  className="w-full flex items-center gap-2 cursor-pointer text-sm px-2 py-1.5 rounded-md outline-none text-red-600"
                >
                  <Trash2 size={15} /> <span>{t('tooltips.delete')}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
// ─── Row parts ───────────────────────────────────────────────────────────────

/** Инициалы клиента в кружке — как в справочнике контрагентов. */
function Monogram({ name }) {
  const letters = (name || '')
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (!letters) return null
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
      {letters}
    </span>
  )
}

/** Статус сделки: точка и подпись цветом статуса. */
function StatusPill({ label, color }) {
  const tint = color || '#64748b'
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: tint, backgroundColor: `${tint}14` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
      <span className="truncate">{label || '-'}</span>
    </span>
  )
}

/** Процент выполнения полоской; 100% — зелёная. */
function Progress({ value, label, barClass }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full', width >= 100 ? 'bg-emerald-600' : barClass)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-600">{label}</span>
    </div>
  )
}
