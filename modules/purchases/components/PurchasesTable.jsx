import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, Trash2 } from 'lucide-react'
import { IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import InfiniteScroll from 'react-infinite-scroll-component'

import ScreenLoader from '@/components/shared/ScreenLoader'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'

import { Monogram, Progress, StatusPill } from '@/components/deals/RowParts'
import { cn } from '@/lib/utils'
import PurchasesTableHeader, { PURCHASE_COL } from '../components/PurchasesTableHeder'

export default function PurchasesTable({
  t,
  formattedDeals,
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
}) {
  return (
    <>
      <PurchasesTableHeader t={t} />

      {formattedDeals?.length === 0 && !isLoading && (
        <div className="py-20 text-center text-sm text-slate-500">
          {t('empty')}
        </div>
      )}

      <InfiniteScroll
        dataLength={formattedDeals?.length || 0}
        hasMore={hasNextPage}
        next={fetchNextPage}
        scrollThreshold={0.5}
        scrollableTarget="scrollableDiv"
      >
        <div className="flex flex-col pb-15">
          {formattedDeals?.map(deal => (
            <PurchaseRow
              key={deal.guid}
              deal={deal}
              dealPermission={dealPermission}
              t={t}
              onRowClick={onRowClick}
              onDeleteClick={onDeleteClick}
              onEditClick={onEditClick}
              onCopyClick={onCopyClick}
            />
          ))}
        </div>
      </InfiniteScroll>

      {isLoading && formattedDeals.length === 0 && <ScreenLoader className="left-0!" />}
    </>
  )
}

function PurchaseRow({
  deal,
  dealPermission,
  t,
  onRowClick,
  onDeleteClick,
  onEditClick,
  onCopyClick,
}) {
  const received = Number(deal?.paid_percent ?? deal?.receipts_percentage) || 0
  const shipped = Number(deal?.supply_percent ?? deal?.shipments_percentage) || 0

  return (
    <div
      onClick={(e) => onRowClick(deal, e)}
      className="group flex min-h-[56px] cursor-pointer items-center border-b border-slate-100 bg-white text-sm transition-colors hover:bg-[#f5f8ff]"
    >
      {/* Дата */}
      <div className={cn(PURCHASE_COL.date, 'px-4 tabular-nums text-slate-600')}>{formatDateFormat(deal.Data_sdelki)}</div>

      {/* Название и комментарий */}
      <div className={cn(PURCHASE_COL.name, 'flex min-w-0 flex-col px-3')}>
        <span className="truncate font-medium text-slate-900">{deal.nazvanie}</span>
        {deal.comment && <span className="truncate text-xs text-slate-400">{deal.comment}</span>}
      </div>

      {/* Поставщик */}
      <div className={cn(PURCHASE_COL.client, 'flex min-w-0 items-center gap-2.5 px-3')}>
        <Monogram name={deal?.partner_name} />
        <span className="truncate text-slate-700">{deal?.partner_name || '-'}</span>
      </div>

      {/* Статус */}
      <div className={cn(PURCHASE_COL.status, 'px-3')}>
        <StatusPill label={deal?.status} color={deal?.color} />
      </div>

      {/* Сумма */}
      <div className={cn(PURCHASE_COL.amount, 'px-3 text-right font-medium tabular-nums text-slate-900')}>
        {formatAmount(deal.summa_sdelki)}
      </div>

      {/* Оплачено / поставлено — полоской, как в сделках */}
      <div className={cn(PURCHASE_COL.progress, 'px-3')}>
        <Progress value={received} label={deal.postupilo || '0%'} barClass="bg-[#0e73f6]" />
      </div>
      <div className={cn(PURCHASE_COL.progress, 'px-3')}>
        <Progress value={shipped} label={deal.otgruzheno || '0%'} barClass="bg-slate-500" />
      </div>

      {/* Действия — одним меню вместо россыпи иконок в строке */}
      <div className={cn(PURCHASE_COL.menu, 'flex items-center justify-center')} onClick={(e) => e.stopPropagation()}>
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
