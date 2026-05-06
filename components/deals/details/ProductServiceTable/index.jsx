import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import { useUcodeRequestMutation } from '../../../../hooks/useDashboard'
import { apiClient } from '../../../../lib/api/ucode/base'
import { productServiceDto } from '../../../../lib/dtos/productServiceDto'
import { formatAmount } from '../../../../utils/helpers'
import OperationCheckbox from '../../../shared/Checkbox/operationCheckbox'
import CustomModal from '../../../shared/CustomModal'
import Loader from '../../../shared/Loader'

import EmptyState from '../EmptyState'

const ProductServiceTable = ({ handleSelect, sellingDealId, onAdd }) => {
  const t = useTranslations('Directories.details.productServiceTable')

  const [selectedItems, setSelectedItems] = useState(new Set())
  const [selectedItem, setSelectedItem] = useState([])
  const [open, setOpen] = useState(false)
  const scrollContainerRef = useRef(null)
  const LIMIT = 50

  const { mutateAsync: mutateProductServiceCustom, isPending: isProductServiceCustomPending } = useUcodeRequestMutation()
  const queryClient = useQueryClient()

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['products_services_list', sellingDealId],
    queryFn: ({ pageParam = 1 }) => apiClient.invokeFunction({
      method: "list_products_and_services",
      data: {
        sales_transactions_id: sellingDealId,
        page: pageParam,
        limit: LIMIT
      }
    }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination
      if (!pagination) return undefined
      const { page, totalPages } = pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1
  }) 


  const productServicesList = useMemo(() => {
    const allData = infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
    return productServiceDto(allData)
  }, [infiniteData])

  // Infinite scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !hasNextPage || isFetchingNextPage) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 100) {
        fetchNextPage()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])



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
        title={t('emptyTitle')}
        subtitle={t('emptySubtitle')}
        onAdd={onAdd}
      />
    )
  }



  if (isLoading) {
    return <div className='flex items-center justify-center flex-1'>
      <Loader2 className='animate-spin text-primary' size={24} />
    </div>
  }

  return (
    <>
      <div ref={scrollContainerRef} className="max-h-[1000px] overflow-y-auto min-w-full pb-10">
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
                    <p className="text-sm text-neutral-600">{selectedItems.size} {t('selected')}</p>
                    <button onClick={handleSelectCancel} className='text-red-400  hover:text-red-600 cursor-pointer flex items-center justify-center gap-2 px-2 py-1 '>
                      <BsTrash size={16} className='' />
                      <p className='text-sm '>{t('delete')}</p>
                    </button>
                  </div>
                  <button onClick={handleSelectCancel} className='text-neutral-600 size-6 mr-4 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-full hover:text-neutral-900'>
                    <IoCloseOutline size={16} className='text-gray-400' />
                  </button>
                </div>
              </th>}
              {selectedItems.size == 0 && <>
                <th className='px-3 py-2 font-medium text-left border-r border-neutral-200'>{t('title')}</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>{t('quantity')}</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>{t('unit')}</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>{t('pricePerUnit')}</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>{t('discount')}</th>
                <th className='px-3 py-2 font-medium text-right border-r border-neutral-200'>{t('vat')}</th>
                <th className='px-4 py-1 font-medium text-right'>{t('sum')}</th>
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
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className='animate-spin text-primary' size={20} />
          </div>
        )}
      </div>
      {/* <div className='flex justify-end'>
        <div className="p-4 text-right text-neutral-700 font-semibold">Итого:</div>
        <div className={`p-4 text-right font-semibold text-neutral-600`}>{formatAmount(productServicesList?.reduce((acc, item) => acc + item.summa, 0))} UZS</div>
      </div> */}
      <CustomModal isOpen={open} onClose={() => setOpen(false)}>
        <div className='p-4'>
          <h1 className='text-lg font-semibold text-neutral-900'>{t('deletePositionsTitle')}</h1>
          <p className='text-sm text-neutral-600'>{t('deletePositionsConfirm', { count: selectedItems.size })}</p>
          <div className='flex justify-end gap-2 mt-4'>
            <button onClick={() => setOpen(false)} className='secondary-btn'>
              {t('cancel')}
            </button>
            <button onClick={handleDelete} className='delete-btn'>
              {isProductServiceCustomPending ? <Loader /> : t('delete')}
            </button>
          </div>
        </div>
      </CustomModal>
    </>
  )
}

export default ProductServiceTable