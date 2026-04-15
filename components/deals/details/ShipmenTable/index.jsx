import React, { useMemo, useState } from 'react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import { formatAmount } from '../../../../utils/helpers'
import CreateShipment from '../CreatingShipment'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '../../../../hooks/useDashboard'
import { keepPreviousData } from '@tanstack/react-query'
import { shipmentsDto } from '../../../../lib/dtos/shipmentsDto'
import { Loader2 } from 'lucide-react'
import CustomModal from '../../../shared/CustomModal'
import { useQueryClient } from '@tanstack/react-query'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import EmptyState from '../EmptyState'
import { GlobalCurrency } from '../../../../constants/globalCurrency'

const ShipmenTable = ({ dealName = '', dealGuid = '', onAdd }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [shipmentToDelete, setShipmentToDelete] = useState(null)
  const queryClient = useQueryClient()


  const { data: shipments, isLoading } = useUcodeRequestQuery({
    method: "list_sales_operations",
    data: {
      object_data: {
        sales_transaction_id: dealGuid,
        tab: 'shipment',
        search: "",
        page: 1,
        limit: 20
      }
    },
    skip: !dealGuid,
    querySetting: {
      select: (response) => response?.data?.data,
      placeholderData: keepPreviousData,
    }
  })

  const { mutateAsync: deleteShipment, isPending: isDeleting } = useUcodeRequestMutation()

  const shipmentsList = useMemo(() => {
    return shipmentsDto(shipments?.items)
  }, [shipments])

  const summury = useMemo(() => {
    return shipments?.summary
  }, [shipments])

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
        "method": "delete_shipment_transaction",
        "data": {
          "guid": shipmentToDelete.guid
        }
      })
      queryClient.invalidateQueries({ queryKey: ["list_sales_operations"] })
      queryClient.invalidateQueries({ queryKey: ["get_sales_transaction"] })
      queryClient.invalidateQueries({ queryKey: ["get_sales_transaction_by_guid"] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
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
    return (
      <EmptyState
        title="Добавьте отгрузки в сделку"
        subtitle="Учитывайте отгрузки товара/услуг, чтобы контролировать выполнение обязательств по сделке"
        onAdd={onAdd}
      />
    )
  }

  return (
    <>
      <div className="h-96 overflow-auto min-w-full">
        <table className="w-full overflow-auto">
          <thead className='sticky top-0 z-10'>
            <tr className='bg-neutral-100  text-neutral-600 font-normal text-xs w-full border-b border-gray-200'>
              <th className='px-3 py-2 text-left w-[150px]'>Дата</th>
              <th className='px-3 py-2 text-left w-[50px]'>Юрлицо</th>
              <th className='px-3 py-2 text-left w-[150px]'>Контрагент</th>
              <th className='px-3 py-2 text-left w-[150px]'>Состав</th>
              <th className='px-3 py-2 text-left w-[150px]'>Статья</th>
              <th className='px-4 py-1 text-right w-[150px]'>Сумма</th>
            </tr>
          </thead>
          <tbody className='w-full'>
            {shipmentsList?.map((item) => {
              return (
                <tr key={item?.guid} className={`bg-white  hover:bg-gray-50 text-xs font-normal group  cursor-pointer border-b group border-gray-200 ${item?.planned_shipment ? 'text-primary' : 'text-neutral-900'}`}>
                  <td className="px-4 py-3 text-left">{item.operationDate}</td>
                  <td className="px-4 py-3 text-left w-[50px]">{item?.legal_entity_name || 'Юрлицо'}</td>
                  <td className="px-4 py-3 text-left">{item.counterparty}</td>
                  <td className="px-4 py-3 text-left">
                    {item?.product_and_service_data?.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="cursor-pointer border-b border-dashed border-neutral-400 pb-0.5 hover:border-neutral-600 transition-colors">
                            {item.product_and_service_data.length} {
                              item.product_and_service_data.length === 1 ? 'позиция' :
                                (item.product_and_service_data.length >= 2 && item.product_and_service_data.length <= 4) ? 'позиции' : 'позиций'
                            }
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 overflow-hidden bg-white  borde-none rounded-md">
                          <div className="flex flex-col">
                            {item.product_and_service_data.map((prod, idx) => (
                              <div key={prod.guid || idx} className="flex justify-between items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                                <span className="text-neutral-700 font-medium truncate mr-4">
                                  {prod.naimenovanie || 'Без названия'}
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
                      <span className="text-neutral-400">Товары/услуги</span>
                    )}
                  </td>
                  {/* Нераспределенный доход */}
                  <td className="px-4 py-3 text-left w-[200px]">{item?.chartOfAccounts || 'Нераспределенный доход'}</td>
                  <td className={`px-4 py-3  w-52 text-right`}>
                    <div className="flex items-center justify-end gap-4 h-6">
                      <p className={`font-base text-neutral-600`}>
                        {formatAmount(item.summa)} {item?.currency}
                      </p>
                      <div className=' items-center  hidden group-hover:flex '>
                        <button onClick={(e) => { e.stopPropagation(); handleEditShipment(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                          <MdOutlineModeEdit size={16} className='text-gray-400' />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleCopyShipment(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                          <IoCopyOutline size={16} className='text-gray-400' />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteShipment(item); }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                          <IoCloseOutline size={16} className='text-gray-400' />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* <div className='flex justify-end'>
        <div className="p-4 text-right text-neutral-700 font-semibold">Итого:</div>
        <div className={`p-4 text-right font-semibold text-neutral-600`}>{formatAmount(summury?.total_summa)} {GlobalCurrency.name}</div>
      </div> */}

      {showModal && (
        <CreateShipment
          open={showModal}
          onClose={() => setShowModal(false)}
          initialData={selectedShipment}
          isEditing={isEditing}
          isCopying={isCopying}
          dealName={dealName}
          dealGuid={dealGuid}
          kontragentId={selectedShipment?.counterparties_id}
        />
      )}

      {showDeleteModal && (
        <CustomModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className='p-2 flex flex-col'>
            <div className='flex justify-between items-center border-b border-gray-100 pb-2'>
              <h2 className='text-xl font-bold text-neutral-800'>Удалить отгрузку</h2>
            </div>

            <div className='py-6 text-base text-neutral-700'>
              Вы действительно хотите удалить отгрузку на сумму <span className='font-bold'>{formatAmount(shipmentToDelete?.summa)} UZS</span>? <br />
              Восстановить её будет невозможно.
            </div>

            <div className='flex justify-end gap-4'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 text-sm text-primary hover:bg-gray-50 rounded-md font-semibold'
              >
                Отменить
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className='px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md flex items-center justify-center min-w-[100px]'
              >
                {isDeleting ? <Loader2 className='animate-spin h-4 w-4' /> : 'Удалить'}
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </>
  )
}

export default ShipmenTable