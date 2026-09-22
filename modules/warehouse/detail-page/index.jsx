'use client'

import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import Input from '@/components/shared/Input'
import KpiCard from '@/components/shared/KpiCard/KpiCard'
import ScreenLoader from '@/components/shared/ScreenLoader'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { formatNumber } from '@/utils/helpers'
import { Banknote, Boxes, Clock, Layers, PackageCheck, Search, Tag } from 'lucide-react'
import FixedContent from '@/layouts/FixedContent'
import { queryClient } from '@/lib/queryClient'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import InventoryModal from '../components/InventoryModal'
import PlannedDocModal from '../components/PlannedDocModal'
import PlannedListModal from '../components/PlannedListModal'
import TransferDocModal from '../components/TransferDocModal'
import TransferListModal from '../components/TransferListModal'
import TransferModal from '../components/TransferModal'
import WarehouseDetailHeader from '../components/WarehouseDetailHeader'
import WarehouseFooter from '../components/WarehouseFooter'
import WarehouseRow from '../components/WarehouseRow'
import WarehouseTableHeader from '../components/WarehouseTableHeader'
import { useWarehouseStockData } from './hooks/useWarehouseStockData'

// колонки: № + 11 данных (значок товара теперь в колонке названия)
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
    currency,
    isLoading,
  } = useWarehouseStockData(warehouseId)

  // Плановые документы: 'shipment' (продажа) | 'supply' (закупка)
  const [plannedType, setPlannedType] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)

  // Перемещения между складами: история → документ, и отдельная форма создания
  const [isTransferListOpen, setIsTransferListOpen] = useState(false)
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const canCreateTransfer = !!appStore.permission.warehouse?.add

  // Те же итоги, что были в подвале, плюс потенциальная наценка (продажа − себестоимость)
  const markup = totals.totalSale - totals.totalCost
  const kpis = [
    { key: 'positions', label: t('footer.positions'), value: totals.positions, hint: t('kpi.positionsHint'), icon: Boxes },
    { key: 'balance', label: t('footer.totalBalance'), value: totals.balance, hint: t('kpi.balanceHint'), icon: Layers },
    { key: 'waiting', label: t('footer.waitingBalance'), value: totals.waiting, hint: t('kpi.waitingHint'), icon: Clock },
    { key: 'available', label: t('footer.availableBalance'), value: totals.available, hint: t('kpi.availableHint'), icon: PackageCheck },
    { key: 'cost', label: t('footer.totalCost'), value: totals.totalCost, currency, hint: t('kpi.costHint'), icon: Banknote },
    {
      key: 'sale',
      label: t('footer.totalSale'),
      value: totals.totalSale,
      currency,
      hint: t('kpi.saleHint', { amount: `${markup > 0 ? '+' : ''}${formatNumber(markup)}${currency ? ` ${currency}` : ''}` }),
      icon: Tag,
    },
  ]

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
    <FixedContent className="flex-col bg-canvas">
      {(isLoading || isLoadingWarehouse) && <ScreenLoader />}

      <WarehouseDetailHeader
        t={t}
        warehouseName={warehouse?.name}
        address={warehouse?.address}
        isDefault={!!warehouse?.is_default}
        onOpenPlanned={setPlannedType}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenTransfers={() => setIsTransferListOpen(true)}
      />

      {/* Итоги по складу — раньше мелкой строкой в сером подвале */}
      <div className="grid shrink-0 grid-cols-3 gap-3 px-6 pt-4 xl:grid-cols-6">
        {kpis.map(({ key, ...kpi }) => (
          <KpiCard key={key} {...kpi} />
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pt-4 pb-6">
        <TableCard>
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            }
          />
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <WarehouseTableHeader t={t} currency={currency} />
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMN_COUNT} className="py-16 text-center text-slate-400">
                      {isLoading ? '' : t('empty')}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <WarehouseRow
                      key={item.guid || index}
                      item={item}
                      // сквозная нумерация: на второй странице продолжается, а не начинается с 1
                      number={(page - 1) * limit + index + 1}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <WarehouseFooter
            t={t}
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </TableCard>
      </div>

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
        warehouseId={warehouseId}
        warehouseName={warehouse?.name}
        onClosed={handleDocClosed}
        t={t}
      />

      <InventoryModal
        open={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        warehouseId={warehouseId}
        warehouseName={warehouse?.name}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['list_stock_balances'] })}
        t={t}
      />

      <TransferListModal
        open={isTransferListOpen && !isTransferFormOpen}
        onClose={() => setIsTransferListOpen(false)}
        warehouseId={warehouseId}
        canAdd={canCreateTransfer}
        onCreate={() => setIsTransferFormOpen(true)}
        onSelect={setSelectedTransfer}
        t={t}
      />

      <TransferDocModal
        open={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        item={selectedTransfer}
        t={t}
      />

      <TransferModal
        open={isTransferFormOpen}
        onClose={() => setIsTransferFormOpen(false)}
        warehouseId={warehouseId}
        t={t}
      />
    </FixedContent>
  )
})
