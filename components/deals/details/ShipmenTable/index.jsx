import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { shipmentsDto } from '@/lib/dtos/shipmentsDto'
import { appStore } from '@/store/app.store'
import { areDatesAllowed } from '@/utils/dataEditingRestriction'
import { formatAmount } from '@/utils/helpers'
import { keepPreviousData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Truck } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import CustomModal from '../../../shared/CustomModal'
import CreateShipment from '../CreatingShipment'
import EmptyState from '../EmptyState'

// Общее количество по документу. Бэк отдаёт total_quantity; если поля нет
// (старые ответы), суммируем количества позиций.
const totalQuantity = (item) => {
  if (item?.total_quantity !== null && item?.total_quantity !== undefined) {
    return Number(item.total_quantity) || 0
  }
  return (item?.product_and_service_data || []).reduce(
    (acc, prod) => acc + (Number(prod?.Kol_vo ?? prod?.quantity ?? prod?.kolvo) || 0),
    0
  )
}

const ShipmenTable = observer(({
  dealName = '', dealGuid = '', onAdd, onAddProducts, canAdd, hasProducts,
  listMethod = 'list_sales_operations',
  dealIdField = 'sales_transaction_id',
  deleteMethod = 'delete_shipment_transaction',
  createMethod = 'create_shipment_transaction',
  updateMethod = 'update_shipment_transaction',
  getMethod = 'get_shipment_transaction',
  operationType = ['Отгрузка'],
  invalidateKeys = ['list_sales_operations', 'get_sales_transaction', 'get_sales_transaction_by_guid', 'get_counterparty_by_id'],
  listTab = 'shipment',
  isPurchase = false,
  allowedTypes,
}) => {
  const t = useTranslations('Directories.details.shipmentTable')
  const tp = useTranslations('Purchases.supplyTable')

  // Права роли на отгрузки/поставки: таблица одна на оба типа документа
  const documentPermission = isPurchase
    ? appStore.permission?.operations?.supply
    : appStore.permission?.operations?.shipment
  const canEdit = !!documentPermission?.edit
  const canCopy = !!documentPermission?.add
  const canDelete = !!documentPermission?.delete

  const [showModal, setShowModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shipmentToDelete, setShipmentToDelete] = useState(null)
  const queryClient = useQueryClient()
  const scrollContainerRef = useRef(null)
  const sentinelRef = useRef(null)
  // Always holds the latest fetch callback without recreating the observer
  const onIntersectRef = useRef(null)
  const LIMIT = 20

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: [listMethod, dealGuid, 'shipment'],
    queryFn: ({ pageParam = 1 }) => apiClient.invokeFunction({
      method: listMethod,
      data: {
        object_data: {
          [dealIdField]: dealGuid,
          ...(listTab ? { tab: listTab } : {}),
          search: "",
          page: pageParam,
          limit: LIMIT
        }
      }
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.data?.pagination || lastPage?.data?.pagination
      if (!pagination) return undefined
      const { page, totalPages } = pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    enabled: !!dealGuid
  })

  const { mutateAsync: deleteShipment, isPending: isDeleting } = useUcodeRequestMutation()

  const shipmentsList = useMemo(() => {
    const allItems = infiniteData?.pages?.flatMap(page => {
      const dd = page?.data?.data
      if (Array.isArray(dd)) return dd
      return dd?.items || []
    }) || []
    return shipmentsDto(allItems)
  }, [infiniteData])

  const summury = useMemo(() => {
    const lastPage = infiniteData?.pages?.[infiniteData.pages.length - 1]
    return lastPage?.data?.data?.summary || lastPage?.data?.summary
  }, [infiniteData])

  // Keep latest fetch state in a ref so the observer never goes stale
  useEffect(() => {
    onIntersectRef.current = hasNextPage && !isFetchingNextPage ? fetchNextPage : null
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // IntersectionObserver created once — no stale closures, no duplicate fetches
  useEffect(() => {
    const container = scrollContainerRef.current
    const sentinel = sentinelRef.current
    if (!container || !sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onIntersectRef.current?.() },
      { root: container, threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const handleEditShipment = (shipment) => {
    setSelectedShipment(shipment)
    setIsEditing(true)
    setIsCopying(false)
    setShowModal(true)
  }

  const handleCopyShipment = (shipment) => {
    setSelectedShipment(shipment)
    setIsEditing(false)
    setIsCopying(true)
    setShowModal(true)
  }

  const handleDeleteShipment = (shipment) => {
    setShipmentToDelete(shipment)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!shipmentToDelete) return;
    try {
      await deleteShipment({
        "method": deleteMethod,
        "data": {
          "guid": shipmentToDelete.guid
        }
      })
      invalidateKeys.forEach(key => {
        if (key === 'get_sales_transaction_by_guid' || key === 'get_purchase_transaction_by_guid') {
          queryClient.invalidateQueries({ queryKey: [key, { guid: dealGuid }] })
        } else {
          queryClient.invalidateQueries({ queryKey: [key] })
        }
      })
      queryClient.refetchQueries({ queryKey: [listMethod, dealGuid, 'shipment'] })
      setShowDeleteModal(false)
      setShipmentToDelete(null)
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }

  if (shipmentsList?.length === 0) {
    // Товар/услуга йўқ бўлса — аввал уларни қўшиш шарт (поставка/отгрузка улардан кейин).
    // Тугма модални эмас, "Товары и услуги" табига ўтказади (link кўринишида).
    if (hasProducts === false) {
      return (
        <EmptyState
          icon={<Truck size={32} className="text-gray-400 stroke-[1.5]" />}
          title={isPurchase ? tp('emptyProductsTitle') : t('emptyProductsTitle')}
          subtitle={isPurchase ? tp('emptyProductsSubtitle') : t('emptyProductsSubtitle')}
          onAdd={onAddProducts}
          buttonLabel={isPurchase ? tp('goToProducts') : t('goToProducts')}
          buttonVariant="link"
          canAdd={canAdd}
        />
      )
    }
    return (
      <EmptyState
        title={isPurchase ? tp('emptyTitle') : t('emptyTitle')}
        subtitle={isPurchase ? tp('emptySubtitle') : t('emptySubtitle')}
        onAdd={onAdd}
        canAdd={canAdd}
      />
    )
  }

  return (
    <>
      <div ref={scrollContainerRef} className="max-h-[300px] overflow-auto min-w-full">
        <table className="w-full">
          <thead className='sticky top-0 z-10'>
            <tr className='bg-neutral-100  text-neutral-600 font-normal text-xs w-full border-b border-gray-200'>
              <th className='px-3 py-2 text-left w-[150px]'>{t('date')}</th>
              <th className='px-3 py-2 text-left w-[50px]'>{t('legalEntity')}</th>
              <th className='px-3 py-2 text-left w-[150px]'>{t('counterparty')}</th>
              <th className='px-3 py-2 text-left w-[150px]'>{t('composition')}</th>
              <th className='px-3 py-2 text-left w-[150px]'>{t('article')}</th>
              <th className='px-3 py-2 text-right w-[90px]'>{t('totalQuantity')}</th>
              <th className='px-4 py-1 text-right w-[150px]'>{t('amount')}</th>
            </tr>
          </thead>
          <tbody className='w-full'>
            {shipmentsList?.map((item) => {
              const isRowPlanned = isPurchase ? item?.planned_supply : item?.planned_shipment
              const deleteBlocked = Boolean(appStore.warehouseActive) && !Boolean(isRowPlanned)
              // Закрытый период роли — см. utils/dataEditingRestriction.js
              const isDateAllowed = areDatesAllowed(
                [item?.data_operatsii, item?.data_nachisleniya],
                appStore.dataEditingRestriction,
              )
              const rowCanEdit = canEdit && isDateAllowed
              const rowCanDelete = canDelete && isDateAllowed && !deleteBlocked
              return (
                <tr key={item?.guid} className={`bg-white  hover:bg-gray-50 text-xs font-normal group  cursor-pointer border-b group border-gray-200 ${isRowPlanned ? 'text-primary' : 'text-neutral-900'}`}>
                  <td className="px-4 py-3 text-left">{item.operationDate}</td>
                  <td className="px-4 py-3 text-left w-[50px]">{item?.legal_entity_name || t('legalEntity')}</td>
                  <td className="px-4 py-3 text-left">{item.counterparty}</td>
                  <td className="px-4 py-3 text-left">
                    {item?.product_and_service_data?.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="cursor-pointer border-b border-dashed border-neutral-400 pb-0.5 hover:border-neutral-600 transition-colors">
                            {item.product_and_service_data.length} {t('position', { count: item.product_and_service_data.length })}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 overflow-hidden bg-white  borde-none rounded-md">
                          <div className="flex flex-col">
                            {item.product_and_service_data.map((prod, idx) => (
                              <div key={prod.guid || idx} className="flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                <span className="text-neutral-700 font-medium truncate mr-4">
                                  {prod.naimenovanie || t('noName')}
                                </span>
                                <span className="text-neutral-500 tabular-nums">
                                  {prod.quantity || prod.Kol_vo || prod.kolvo || 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-neutral-400">{t('goodsServices')}</span>
                    )}
                  </td>
                  {/* Нераспределенный доход / расход */}
                  <td className="px-4 py-3 text-left w-[200px]">{item?.chartOfAccounts || (isPurchase ? tp('unallocatedExpense') : t('unallocatedIncome'))}</td>
                  {/* Общее количество позиций документа: берём с бэка, а если его
                      нет — складываем количества по позициям */}
                  <td className="px-3 py-3 text-right tabular-nums w-[90px]">{formatAmount(totalQuantity(item))}</td>
                  <td className={`px-4 py-3  w-52 text-right`}>
                    <div className="flex items-center justify-end gap-4 h-6">
                      <p className={`font-base text-neutral-600`}>
                        {formatAmount(item.summa)} {item?.currency}
                      </p>
                      <div className=' items-center  hidden group-hover:flex '>
                        {rowCanEdit && (
                          <button onClick={(e) => { e.stopPropagation(); handleEditShipment(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                            <MdOutlineModeEdit size={16} className='text-gray-400' />
                          </button>
                        )}
                        {canCopy && (
                          <button onClick={(e) => { e.stopPropagation(); handleCopyShipment(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                            <IoCopyOutline size={16} className='text-gray-400' />
                          </button>
                        )}
                        {canDelete && isDateAllowed && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (rowCanDelete) handleDeleteShipment(item); }}
                            disabled={!rowCanDelete}
                            title={deleteBlocked ? (isPurchase ? tp('deleteBlockedClosedWarehouse') : t('deleteBlockedClosedWarehouse')) : undefined}
                            className={`text-neutral-600 size-6 flex items-center justify-center rounded-full ${!rowCanDelete ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer hover:text-neutral-900'}`}
                          >
                            <IoCloseOutline size={16} className='text-gray-400' />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className='animate-spin text-primary' size={20} />
          </div>
        )}
        <div ref={sentinelRef} />
      </div>
      {/* <div className='flex justify-end'>
        <div className="p-4 text-right text-neutral-700 font-semibold">Итого:</div>
        <div className={`p-4 text-right font-semibold text-neutral-600`}>{formatAmount(summury?.total_summa)} {GlobalCurrency?.name}</div>
      </div> */}

      {showModal && (
        <CreateShipment
          open={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedShipment(null)
            setIsEditing(false)
            setIsCopying(false)
            queryClient.refetchQueries({ queryKey: [listMethod, dealGuid, 'shipment'] })
          }}
          initialData={selectedShipment}
          isEditing={isEditing}
          isCopying={isCopying}
          dealName={dealName}
          dealGuid={dealGuid}
          kontragentId={selectedShipment?.counterparties_id}
          createMethod={createMethod}
          updateMethod={updateMethod}
          getMethod={getMethod}
          dealIdField={dealIdField}
          operationType={operationType}
          invalidateKeys={invalidateKeys}
          isPurchase={isPurchase}
          allowedTypes={allowedTypes}
          isReturn={Number(selectedShipment?.summa) < 0}
        />
      )}

      {showDeleteModal && (
        <CustomModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className='p-2 flex flex-col'>
            <div className='flex justify-between items-center border-b border-gray-100 pb-2'>
              <h2 className='text-xl font-bold text-neutral-800'>{isPurchase ? tp('deleteSupplyTitle') : t('deleteShipmentTitle')}</h2>
            </div>

            <div className='py-6 text-base text-neutral-700'
              dangerouslySetInnerHTML={{
                __html: isPurchase
                  ? tp('deleteSupplyConfirm', { amount: formatAmount(shipmentToDelete?.summa) + ' UZS' })
                  : t('deleteShipmentConfirm', { amount: formatAmount(shipmentToDelete?.summa) + ' UZS' })
              }}
            />

            <div className='flex justify-end gap-4'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 text-sm text-primary hover:bg-gray-50 rounded-md font-semibold'
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md flex items-center justify-center min-w-[100px]'
              >
                {isDeleting ? <Loader2 className='animate-spin h-4 w-4' /> : t('delete')}
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </>
  )
})

export default ShipmenTable