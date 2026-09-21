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

import PurchasesTableHeader from '../components/PurchasesTableHeder'
import styles from '../purchases-list/purchases.module.scss'

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
        <div className="py-20 text-center text-neutral-500 text-sm">
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
  return (
    <div
      onClick={(e) => onRowClick(deal, e)}
      className="flex items-center h-12 border-b border-neutral-100 hover:bg-neutral-50 group cursor-pointer text-xs"
    >
      <div className="w-32 shrink-0 px-2">{formatDateFormat(deal.Data_sdelki)}</div>

      <div className="flex-1 min-w-24 line-clamp-1 flex flex-col px-2">
        <p className="truncate">{deal.nazvanie}</p>
        <p className="text-neutral-400 truncate">{deal.comment}</p>
      </div>

      <div className="flex-1 min-w-32 line-clamp-1  shrink-0 px-2 truncate">{deal?.partner_name || '-'}</div>

      <div className="w-28 shrink-0 px-2 flex items-center justify-center">
        <span
          className={`${styles.status} ${styles[`status_${deal.status}`]}`}
          style={{ color: deal?.color, backgroundColor: deal?.color + '10' }}
        >
          {deal?.status || '-'}
        </span>
      </div>

      <div className="w-36 shrink-0 px-2 text-end">{formatAmount(deal.summa_sdelki)}</div>

      <div className="w-24 shrink-0 px-2 text-end">{deal.postupilo || '0%'}</div>

      <div className="w-24 shrink-0 px-2 text-end">{deal.otgruzheno || '0%'}</div>

      {/* Действия — одним меню вместо россыпи иконок в строке */}
      <div className="w-20 shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
