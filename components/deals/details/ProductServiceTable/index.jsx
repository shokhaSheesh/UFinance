import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import { formatAmount } from '../../../../utils/helpers'
import OperationCheckbox from '../../../shared/Checkbox/operationCheckbox'
import { useMemo, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '../../../../hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import CustomModal from '../../../shared/CustomModal'
import Loader from '../../../shared/Loader'
import { productServiceDto } from '../../../../lib/dtos/productServiceDto'
import { Loader2 } from 'lucide-react'

import EmptyState from '../EmptyState'

const ProductServiceTable = ({ handleSelect, sellingDealId, onAdd }) => {
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState([])
  const [open, setOpen] = useState(false)

  const { mutateAsync: mutateProductServiceCustom, isPending: isProductServiceCustomPending } = useUcodeRequestMutation()
  const queryClient = useQueryClient()

  const { data: productServices, isLoading } = useUcodeRequestQuery({
    queryKey: "products_services_list",
    method: "list_products_and_services",
    data: {
      sales_transactions_id: sellingDealId,
    },
    querySetting: {
      select: data => data?.data?.data
    }
  }) 


  const productServicesList = useMemo(() => {
    return productServiceDto(productServices)
  }, [productServices])



  const handleSelectAll = (event) => {
    const checked = event.target.checked
    if (checked) {
      productServicesList.forEach(item => selectedItems.add(item.guid))
    } else {
      selectedItems.clear()
    }
    setSelectedItems(new Set(selectedItems))
  }

  const handleSelectItem = (event, guid) => {
    const checked = event.target.checked
    if (checked) {
      selectedItems.add(guid)
    } else {
      selectedItems.delete(guid)
    }
    setSelectedItems(new Set(selectedItems))
  }

  const handleSelectCancel = () => {
    selectedItems.clear()
    setSelectedItems(new Set(selectedItems))
  }

  const handleDelete = async () => {
    try {
      if (selectedItem.length === 0) return;

      await mutateProductServiceCustom({
        method: "delete_product_and_service",
        data: {
          guid: selectedItem?.length > 1 ? selectedItem : selectedItem?.[0]
        }
      })

      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
      queryClient.invalidateQueries({ queryKey: ['products_services_list'] })
      queryClient.invalidateQueries({ queryKey: ['list_sales_operations'] })
      queryClient.invalidateQueries({ queryKey: ['products_services_list'] })
      queryClient.invalidateQueries({ queryKey: ['get_counterparty_by_id'] })
      setOpen(false)
      setSelectedItems(new Set())
    } catch (error) {
      console.error('mutateProductService', error?.message)
    }
  }


  if (productServicesList.length === 0) {
    return (
      <EmptyState
        title="Добавьте товары или услуги в сделку"
        subtitle="Наполните сделку товарами/услугами, которые покупаете или продаете своим клиентам"
        onAdd={onAdd}
      />
    )
  }

  // "1e1e3673-95aa-4651-8b2e-649c583a2c26"
  // "acc59c68-cb5f-4c74-b943-d531b25107c5"
  // "275ceb8e-5b2f-40bd-9d96-4036bc6c5e1a"


  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }

  return (
    <>
      <div className="overflow-y-auto flex-1 min-w-full pb-10">
        <table className="w-full">
          <thead className='sticky top-0 z-10'>
            <tr className='bg-neutral-100  text-neutral-600 font-normal text-xs w-full border-b border-gray-200'>
              <th className='w-14 py-2 text-center place-content-center'>
                <div className='flex items-center justify-center'>
                  <OperationCheckbox checked={selectedItems.size === productServicesList.length} onChange={handleSelectAll} />
                </div>
              </th>
              {selectedItems.size > 0 && <th colSpan={7} className='text-lef'>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-neutral-600">{selectedItems.size} выбрано</p>
                    <button onClick={handleSelectCancel} className='text-red-400  hover:text-red-600 cursor-pointer flex items-center justify-center gap-2 px-2 py-1 '>
                      <BsTrash size={16} className='' />
                      <p className='text-sm '>Удалить</p>
                    </button>
                  </div>
                  <button onClick={handleSelectCancel} className='text-neutral-600 size-6 mr-4 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                    <IoCloseOutline size={16} className='text-gray-400' />
                  </button>
                </div>
              </th>}
              {selectedItems.size == 0 && <>
                <th className='px-3 py-2 font-medium text-left border-r border-neutral-200'>Наименование</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>Кол-во</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>Единица</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>Цена за ед.</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>Скидка</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>НДС</th>
                <th className='px-4 py-1 font-medium text-right'>Сумма</th>
              </>}
            </tr>
          </thead>
          <tbody className='w-full'>
            {productServicesList?.map((item) => {
              return (
                <tr key={item?.guid} className="bg-white hover:bg-gray-50 text-xs font-normal group text-neutral-900 cursor-pointer border-b group border-gray-200">
                  <td className="w-14 py-3 text-center">
                    <div className='flex items-center justify-center'>
                      <OperationCheckbox checked={selectedItems.has(item.guid)} onChange={(e) => handleSelectItem(e, item.guid)} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-left border-r border-neutral-200">{item?.name}</td>
                  <td className="px-4 py-3 text-right border-r border-neutral-200">{item?.kolvo}</td>
                  <td className="px-4 py-3 text-right border-r border-neutral-200">{item?.unit_name}</td>
                  <td className="px-4 py-3 text-right border-r border-neutral-200">{item?.tsena_za_ed}</td>
                  <td className="px-4 py-3 text-right border-r border-neutral-200">{item?.discount}%</td>
                  <td className="px-4 py-3 text-right border-r border-neutral-200">{item?.nds}%</td>
                  <td className={`px-4 py-3  w-72 text-right`}>
                    <div className="flex items-center justify-end gap-4 h-6">
                      <p className={`text-sm text-neutral-600`}>
                        {formatAmount(item?.summa)} {item?.currency}
                      </p>
                      <div className=' items-center  hidden group-hover:flex '>
                        <button onClick={(event) => {
                          event.stopPropagation()
                          handleSelect(item, 'edit')
                        }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                          <MdOutlineModeEdit size={16} className='text-gray-400' />
                        </button>
                        <button onClick={(event) => {
                          event.stopPropagation()
                          handleSelect(item, 'copy')
                        }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                          <IoCopyOutline size={16} className='text-gray-400' />
                        </button>
                        <button onClick={(event) => {
                          event.stopPropagation()
                          setSelectedItem([item.guid])
                          setOpen(true)
                        }} className='text-neutral-600 size-6 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
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
        <div className={`p-4 text-right font-semibold text-neutral-600`}>{formatAmount(productServicesList?.reduce((acc, item) => acc + item.summa, 0))} UZS</div>
      </div> */}
      <CustomModal isOpen={open} onClose={() => setOpen(false)}>
        <div className='p-4'>
          <h1 className='text-lg font-semibold text-neutral-900'>Удалить позиции из сделки</h1>
          <p className='text-sm text-neutral-600'>Вы действительно хотите удалить {selectedItems.size} {selectedItems.size === 1 ? 'позицию' : 'позиции'} из сделки?</p>
          <div className='flex justify-end gap-2 mt-4'>
            <button onClick={() => setOpen(false)} className='secondary-btn'>
              Отмена
            </button>
            <button onClick={handleDelete} className='delete-btn'>
              {isProductServiceCustomPending ? <Loader /> : 'Удалить'}
            </button>
          </div>
        </div>
      </CustomModal>
    </>
  )
}

export default ProductServiceTable