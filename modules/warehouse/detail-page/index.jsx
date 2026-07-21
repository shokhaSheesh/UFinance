'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { queryClient } from '@/lib/queryClient'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import PlannedDocModal from '../components/PlannedDocModal'
import PlannedListModal from '../components/PlannedListModal'
import WarehouseDetailHeader from '../components/WarehouseDetailHeader'
import WarehouseFooter from '../components/WarehouseFooter'
import WarehouseRow from '../components/WarehouseRow'
import WarehouseTableHeader from '../components/WarehouseTableHeader'
import { useWarehouseStockData } from './hooks/useWarehouseStockData'

const COLUMN_COUNT = 12

export default observer(function WarehouseDetailPage() {
  const t = useTranslations('Warehouse')
  const params = useParams()
  const warehouseId = params?.id

  const { data: warehouse, isLoading: isLoadingWarehouse } = useUcodeRequestQuery({
    queryKey: 'get_warehouse_by_id',
    method: 'get_warehouse_by_id',
    data: { guid: warehouseId },
    skip: !warehouseId,
    querySetting: {
      select: (res) => res?.data?.data,
    },
  })

  const {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    limit,
    items,
    total,
    totalPages,
    totals,
    isLoading,
  } = useWarehouseStockData(warehouseId)

  // Плановые документы: 'shipment' (продажа) | 'supply' (закупка)
  const [plannedType, setPlannedType] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const handleDocClosed = () => {
    queryClient.invalidateQueries({ queryKey: ['list_planned_warehouse_shipments'] })
    queryClient.invalidateQueries({ queryKey: ['list_planned_warehouse_supplies'] })
    queryClient.invalidateQueries({ queryKey: ['list_stock_balances'] })
    setSelectedDoc(null)
    setPlannedType(null)
  }

  // Match the other list pages: the app shell owns scrolling, not the body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <FixedContent className="flex-col bg-white">
      {(isLoading || isLoadingWarehouse) && <ScreenLoader />}

      <WarehouseDetailHeader
        t={t}
        warehouseName={warehouse?.name}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenPlanned={setPlannedType}
      />

      <div className="flex-1 min-h-0 overflow-auto px-3">
        <table className="w-full border-collapse text-[13.5px]">
          <WarehouseTableHeader t={t} />
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="py-16 text-center text-neutral-400">
                  {isLoading ? '' : t('empty')}
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <WarehouseRow key={item.guid || index} item={item} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <WarehouseFooter
        t={t}
        totals={totals}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
      />

      <PlannedListModal
        open={!!plannedType && !selectedDoc}
        onClose={() => setPlannedType(null)}
        type={plannedType}
        warehouseId={warehouseId}
        onSelect={setSelectedDoc}
        t={t}
      />

      <PlannedDocModal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        type={plannedType}
        item={selectedDoc}
        warehouseName={warehouse?.name}
        onClosed={handleDocClosed}
        t={t}
      />
    </FixedContent>
  )
})
