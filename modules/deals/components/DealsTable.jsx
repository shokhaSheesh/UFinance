// components/DealsTable.jsx
import RowActions from '@/components/shared/RowActions/RowActions'
import { Copy, Download, FileSignature, Pencil, Trash2 } from 'lucide-react'
import InfiniteScroll from 'react-infinite-scroll-component'

import ScreenLoader from '@/components/shared/ScreenLoader'
import { formatDateFormat } from '@/utils/formatDate'
import { formatAmount, handleDownload } from '@/utils/helpers'

import DealsTableHeader from '../components/DealsTableHeder'
import styles from '../deals-list/deals.module.scss'

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

  return (
    <div
      onClick={(e) => onRowClick(deal, e)}
      className="flex items-center h-12 border-b border-neutral-100 hover:bg-neutral-50 group cursor-pointer text-xs"
    >
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

      {/* Profit */}
      <div className="w-44 shrink-0 px-2 text-end">
        <p className={price < 0 ? 'text-red-600' : 'text-green-600'}>
          {formatAmount(price)}
        </p>
      </div>

      {/* Действия — отдельной колонкой, одним меню: раньше иконки лежали
          поверх прибыли и показывались только при наведении */}
      <div className="w-[176px] shrink-0 flex items-center justify-end pr-2" onClick={(e) => e.stopPropagation()}>
        {(dealPermission.edit || dealPermission.add || dealPermission.delete || deal.contract_file) && (
          <RowActions
            actions={[
              { key: 'edit', icon: Pencil, label: t('tooltips.edit'), onClick: (e) => onEditClick(deal, e), hidden: !(dealPermission.edit) },
              { key: 'copy', icon: Copy, label: t('tooltips.copy'), onClick: (e) => onCopyClick(deal, e), hidden: !(dealPermission.add) },
              { key: 'a2', icon: FileSignature, label: t('tooltips.editContract'), onClick: (e) => onUpdate(deal, e), hidden: !(dealPermission.edit) },
              { key: 'a3', icon: Download, label: t('tooltips.downloadContract'), onClick: () => handleDownload(deal.contract_file, 'Договор.pdf'), hidden: !(deal.contract_file) },
              { key: 'delete', icon: Trash2, label: t('tooltips.delete'), onClick: (e) => onDeleteClick(deal, e), hidden: !(dealPermission.delete), danger: true },
            ]}
          />
        )}
      </div>
    </div>
  )
}