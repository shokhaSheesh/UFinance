// components/DealsTable.jsx
import { Download } from 'lucide-react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import InfiniteScroll from 'react-infinite-scroll-component'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'

import DealsTableHeader from '../components/DealsTableHeder'
import styles from '../deals-list/deals.module.scss'

/**
 * Virtualised infinite-scroll table of deals.
 */
export default function DealsTable({
  t, tc,
  formattedDeals,
  selectedDeals,
  isAllSelected,
  dealsMethod,
  dealPermission,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  isFetching,
  fetchNextPage,
  onRowClick,
  onSelectAll,
  onSelectOne,
  onDeleteClick,
  onEditClick,
  onCopyClick,
  onUpdate,
}) {
  return (
    <>
      <DealsTableHeader
        t={t}
        tc={tc}
        isAllSelected={isAllSelected}
        selectedCount={selectedDeals.size}
        onSelectAll={onSelectAll}
      />

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
            <DealRow
              key={deal.guid}
              deal={deal}
              dealsMethod={dealsMethod}
              dealPermission={dealPermission}
              isSelected={selectedDeals.has(deal.guid)}
              t={t}
              onRowClick={onRowClick}
              onSelectOne={onSelectOne}
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
  isSelected,
  t,
  onRowClick,
  onSelectOne,
  onDeleteClick,
  onEditClick,
  onCopyClick,
  onUpdate,
}) {
  const price = dealsMethod === 'accrual_method'
    ? deal?.accrual_method?.profit
    : deal?.cash_method?.profit

  return (
    <div
      onClick={(e) => onRowClick(deal, e)}
      className="flex items-center h-12 border-b border-neutral-100 hover:bg-neutral-50 group cursor-pointer text-xs"
    >
      {/* Checkbox */}
      <div
        className="w-10 flex items-center justify-center shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <OperationCheckbox
          checked={isSelected}
          onChange={(e) => onSelectOne(deal.guid, e)}
        />
      </div>

      {/* Date */}
      <div className="w-32 shrink-0 px-2">{formatDateFormat(deal.Data_sdelki)}</div>

      {/* Name + comment */}
      <div className="flex-1 min-w-24 line-clamp-1 flex flex-col px-2">
        <p className="truncate">{deal.nazvanie}</p>
        <p className="text-neutral-400 truncate">{deal.comment}</p>
      </div>

      {/* Partner */}
      <div className="flex-1 min-w-32 line-clamp-1  shrink-0 px-2 truncate">{deal?.partner_name || '-'}</div>

      {/* Status badge */}
      <div className="w-28 shrink-0 px-2 flex items-center justify-center">
        <span
          className={`${styles.status} ${styles[`status_${deal.status}`]}`}
          style={{ color: deal?.color, backgroundColor: deal?.color + '10' }}
        >
          {deal?.status || '-'}
        </span>
      </div>

      {/* Amount */}
      <div className="w-36 shrink-0 px-2 text-end">{formatAmount(deal.summa_sdelki)}</div>

      {/* Received */}
      <div className="w-24 shrink-0 px-2 text-end">{deal.postupilo || '0%'}</div>

      {/* Shipped */}
      <div className="w-24 shrink-0 px-2 text-end">{deal.otgruzheno || '0%'}</div>

      {/* Profit / actions */}
      <div className="w-44 shrink-0 relative px-2 text-end">
        {/* Default: show profit */}
        <div className="group-hover:hidden">
          <p className={price < 0 ? 'text-red-600' : 'text-green-600'}>
            {formatAmount(price)}
          </p>
        </div>

        {/* Hover: show action buttons */}
        <div className="hidden group-hover:flex justify-between">
          <button
            className="hover:bg-neutral-100 rounded-full p-2 cursor-pointer"
            title={t('tooltips.editContract')}
            onClick={(e) => onUpdate(deal, e)}
          >
            &nbsp;
          </button>

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