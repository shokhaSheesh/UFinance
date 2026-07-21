'use client'

import CustomDialog from '@/components/shared/CustomDialog'
import Loader from '@/components/shared/Loader'
import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { FormatDateRu } from '@/utils/helpers'
import { X } from 'lucide-react'

// «Продажа» — плановые отгрузки, «Закупки» — плановые поставки
const LIST_METHOD = {
  shipment: 'list_planned_warehouse_shipments',
  supply: 'list_planned_warehouse_supplies',
}

// Конверт ответа у методов различается глубиной вложенности `data`
const toRows = res => {
  const candidates = [res?.data?.data, res?.data, res]
  return candidates.find(Array.isArray) || []
}

const readDate = item =>
  item?.data_operatsii || item?.data_nachislenie || item?.data_nachisleniya || ''

const readCounterparty = item =>
  item?.counterparties_name || item?.partners_name || item?.partner_name || '—'

// У отгрузок это имя сделки, у поставок — имя закупки
const readDealName = item =>
  item?.sales_transactions_name || item?.purchase_transactions_name || '—'

const PlannedListModal = ({ open, onClose, type, warehouseId, onSelect, t }) => {
  const { data, isFetching } = useUcodeRequestQuery({
    method: LIST_METHOD[type] || LIST_METHOD.shipment,
    data: { warehouse_id: warehouseId },
    skip: !open || !warehouseId || !type,
    querySetting: { select: toRows },
  })

  const rows = Array.isArray(data) ? data : []
  const isSupply = type === 'supply'

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      contentClass="w-[760px] max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-neutral-800">
          {isSupply ? t('planned.listTitlePurchases') : t('planned.listTitleSales')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-auto px-6 py-2">
        {isFetching && rows.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">
            {t('planned.listEmpty')}
          </p>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="py-2 font-medium">{t('planned.colDate')}</th>
                <th className="py-2 font-medium">{t('planned.colCounterparty')}</th>
                <th className="py-2 font-medium">{t('planned.colDeal')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={item?.guid || index}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer border-t border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <td className="py-2.5 whitespace-nowrap">
                    {FormatDateRu(readDate(item)) || '—'}
                  </td>
                  <td className="py-2.5">{readCounterparty(item)}</td>
                  <td className="py-2.5">{readDealName(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </CustomDialog>
  )
}

export default PlannedListModal
