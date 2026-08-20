import { Download } from 'lucide-react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
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

      <div className="w-20 shrink-0 relative px-2 text-end">
        <div className="hidden group-hover:flex justify-end">
          <div className="flex items-center justify-end">
            {deal.contract_file && (
              <button
                className="hover:bg-neutral-100 rounded-full p-2 cursor-pointer"
                title={t('tooltips.downloadContract')}
                onClick={() => handleDownload(deal.contract_file, 'Договор.pdf')}
              >
                <Download size={14} color="#686868" />
              </button>
            )}
            {dealPermission.edit && (
              <button
                className="hover:bg-neutral-100 rounded-full p-2 cursor-pointer"
                title={t('tooltips.edit')}
                onClick={(e) => onEditClick(deal, e)}
              >
                <MdOutlineModeEdit size={14} color="#686868" />
              </button>
            )}
            {dealPermission.add && (
              <button
                className="hover:bg-neutral-100 rounded-full p-2 cursor-pointer"
                title={t('tooltips.copy')}
                onClick={(e) => onCopyClick(deal, e)}
              >
                <IoCopyOutline size={14} color="#686868" />
              </button>
            )}
            {dealPermission.delete && (
              <button
                className="hover:bg-neutral-100 rounded-full p-2 cursor-pointer"
                title={t('tooltips.delete')}
                onClick={(e) => onDeleteClick(deal, e)}
              >
                <IoCloseOutline size={14} color="#686868" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
