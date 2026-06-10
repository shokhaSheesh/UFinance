// components/DealsTableHeader.jsx
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { GlobalCurrency } from '@/constants/globalCurrency'

/**
 * Sticky column header row for the deals table.
 * When all rows are selected, shows a bulk-action bar instead.
 */
export default function DealsTableHeader({ t, tc, isAllSelected, selectedCount, onSelectAll }) {
  return (
    <div className="flex h-12 sticky top-[60px] z-10 text-xs font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200">
      <div className="w-10 flex items-center justify-center">
        <OperationCheckbox checked={isAllSelected} onChange={onSelectAll} />
      </div>

      {isAllSelected && selectedCount > 0 ? (
        <div className="flex items-center gap-2">
          <p>{selectedCount}</p>
          <button className="primary-btn">{tc('delete')}</button>
        </div>
      ) : (
        <>
          <div className="w-32 flex px-2 items-center justify-start">{t('table.date')}</div>
          <div className="flex-1 min-w-24  flex px-2 items-center justify-start">{t('table.name')}</div>
          <div className="flex-1 min-w-32 flex px-2 items-center justify-start">{t('table.client')}</div>
          <div className="w-28 flex px-2 items-center justify-center">{t('table.status')}</div>
          <div className="w-36 flex px-2 items-center justify-end gap-1">
            <span>{t('table.dealAmount')}</span>
              <span>{GlobalCurrency?.name}</span>
          </div>
          <div className="w-24 flex px-2 items-center justify-end">{t('table.received')}</div>
          <div className="w-24 flex px-2 items-center justify-end">{t('table.shipped')}</div>
          <div className="w-44 flex px-2 items-center justify-end gap-1">
            <span>{t('table.profit')}</span>
              <span>{GlobalCurrency?.name}</span>
          </div>
        </>
      )}
    </div>
  )
}