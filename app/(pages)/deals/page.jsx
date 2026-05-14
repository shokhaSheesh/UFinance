'use client'

import { CreateDealModal } from '@/components/deals/CreateDealModal/CreateDealModal'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import { Download, Loader2, Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { IoCloseOutline, IoCopyOutline } from 'react-icons/io5'
import { MdOutlineModeEdit } from 'react-icons/md'
import InfiniteScroll from 'react-infinite-scroll-component'
import CreateStudentModal from '../../../components/deals/CreateStudentModal'
import { DeleteDealModal } from '../../../components/deals/DeleteDealModal/DeleteDealModal'
import FilterSidebar from '../../../components/deals/FilterSidebar'
import OperationCheckbox from '../../../components/shared/Checkbox/operationCheckbox'
import Input from '../../../components/shared/Input'
import ScreenLoader from '../../../components/shared/ScreenLoader'
import SingleSelect from '../../../components/shared/Selects/SingleSelect'
import { GlobalCurrency } from '../../../constants/globalCurrency'
import { useUcodeRequestInfinite, useUcodeRequestMutation } from '../../../hooks/useDashboard'
import useMounted from '../../../hooks/useMounted'
import { apiClient } from '../../../lib/api/ucode/base'
import { showSuccessNotification } from '../../../lib/utils/notifications'
import { appStore } from '../../../store/app.store'
import { sealDeal } from '../../../store/saleDeal.store'
import { formatDateFormat } from '../../../utils/formatDate'
import { formatAmount, handleDownload } from '../../../utils/helpers'
import styles from './deals.module.scss'

export default observer(function DealsPage() {
  const router = useRouter()
  const t = useTranslations('Deals')
  const tc = useTranslations('Common')
  const [search, setSearch] = useState('')
  const mounted = useMounted()


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [dealToDelete, setDealToDelete] = useState(null)
  const [dealToEdit, setDealToEdit] = useState(null)
  const [dealToCopy, setDealToCopy] = useState(null)
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState(null)
  const [canUpdateForms, setCanUpdateForms] = useState(false)

  const [isFilterOpen, setIsFilterOpen] = useState(true)

  const queryClient = useQueryClient()
  const [selectedDeals, setSelectedDeals] = useState(new Set())

  const dealPermission = appStore.permission.deals

  const {
    selectedCounterparties,
    dealsMethod,
    dateRange,
    amountFrom,
    amountTo,
    profitFrom,
    profitTo,
    status,
    search: searchValue,
    setState
  } = sealDeal


  const dealsFilters = {
    limit: 30,
    search: search,
    from_date: dateRange?.start || null,
    to_date: dateRange?.end || null,
    amount_from: Number(amountFrom) || null,
    amount_to: Number(amountTo) || null,
    profit_from: Number(profitFrom) || null,
    profit_to: Number(profitTo) || null,
    counterparty_ids: selectedCounterparties?.length > 0 ? selectedCounterparties : null,
    status: status?.length > 0 ? status : null,
    accounting_method: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
    isCalculation: false,
  }

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useUcodeRequestInfinite({
    method: 'get_sales_list_simple',
    data: dealsFilters,
    querySetting: { staleTime: 0 },
  })


  const { mutate: exportDeals, isPending: isDealsExportLoading } = useMutation({
    mutationKey: ['export_deals'],
    mutationFn: () => apiClient.invokeFunction({ method: 'export_deals', data: dealsFilters }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t('fileDownloaded'))
      const fileLink = uploadData?.data?.link
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`
        handleDownload(contractFileLink, 'balance_report.xlsx')
      }
    }
  })

  const debouncedSetSearch = useMemo(
    () => debounce((value) => setSearch(value || null), 400),
    [setSearch])

  const handleSearch = (value) => {
    setState('search', value)
    debouncedSetSearch(value)
  }


  const allDeals = useMemo(() => {
    return infiniteData?.pages?.flatMap(page => page?.data?.data || []) || []
  }, [infiniteData])

  const summary = useMemo(() => {
    return infiniteData?.pages?.[0]?.data?.summary
  }, [infiniteData])

  const totalProfit = dealsMethod === 'accrual_method' ? summary?.accrual_profit : summary?.cash_profit

  const { mutate: deleteDeal, isPending: isDeletingDeal } = useUcodeRequestMutation()

  const formattedDeals = useMemo(() => {
    return allDeals?.map(deal => ({
      ...deal,
      guid: deal.guid,
      data_nachala: deal.Data_sdelki,
      nazvanie: deal.Nazvanie,
      kontragent: { nazvanie: deal.partner_name || '-' },
      status: deal.Status?.[0] || t('statusNew'),
      summa_sdelki: deal?.total_products_summa || 0,
      postupilo: deal?.receipts_percentage ? `${Math.round(deal.receipts_percentage)}%` : '0%',
      otgruzheno: deal?.shipments_percentage ? `${Math.round(deal.shipments_percentage)}%` : '0%',
      pribyl: deal?.profit,
      comment: deal?.Kommentariy,
    }))
  }, [allDeals])

  const isAllSelected = formattedDeals?.length > 0 && selectedDeals.size === formattedDeals?.length

  const handleRowClick = (deal, e) => {
    if (e.target.closest('button') || e.target.closest('label') || e.target.closest('input[type="checkbox"]')) return
    router.push(`/deals/${deal.guid}`)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDeals(new Set(formattedDeals.map(d => d.guid)))
    } else {
      setSelectedDeals(new Set())
    }
  }

  const handleSelectOne = (guid, e) => {
    e.stopPropagation()
    setSelectedDeals(prev => {
      const next = new Set(prev)
      if (next.has(guid)) next.delete(guid)
      else next.add(guid)
      return next
    })
  }

  const handleDeleteClick = (deal, e) => {
    e.stopPropagation()
    setDealToDelete(deal)
  }

  const confirmDelete = () => {
    if (!dealToDelete) return
    deleteDeal(
      { method: 'delete_sales_transaction', data: { guid: dealToDelete.guid } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['get_sales_list_simple'] })
          setSelectedDeals(prev => {
            const next = new Set(prev)
            next.delete(dealToDelete.guid)
            return next
          })
          setDealToDelete(null)
        }
      }
    )
  }

  const handleEditClick = (deal, e) => {
    e.stopPropagation()
    setDealToEdit(deal)
    if (deal?.contract_file) {
      setShowCreateStudentModal(true)
      return
    }
    setIsCreateModalOpen(true)
  }

  const handleCopyClick = (deal, e) => {
    e.stopPropagation()
    setDealToCopy(deal)
    setIsCreateModalOpen(true)
  }

  const handleUpdate = (deal, e) => {
    e?.stopPropagation()
    setDealToEdit(deal)
    setShowCreateStudentModal(true)
    setCanUpdateForms(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setDealToEdit(null)
    setDealToCopy(null)
  }

  const closeStudentModal = () => {
    setShowCreateStudentModal(false)
    setStudentToEdit(null)
  }

  if (!mounted) return null

  return (
    <div className='flex fixed left-[80px] top-[60px] w-[calc(100%-80px)] h-[calc(100%-60px)]'>
      <FilterSidebar onOpenChange={setIsFilterOpen} />
      <main id='scrollableDiv' className='w-full relative overflow-y-auto scroll-smooth bg-white px-2'>
        <header className='flex items-center justify-between px-3 h-[60px] sticky top-0 bg-white z-20'>
          <div className='flex items-center gap-2 flex-1'>
            <h1 className={styles.title}>{t('pageTitle')}</h1>
            {dealPermission.add && <>
              {!appStore.isDonoSchool && <button className='primary-btn text-sm rounded-sm!' onClick={() => setIsCreateModalOpen(true)}>
                {t('createDeal')}
              </button>}
              {appStore.isDonoSchool && <button className='primary-btn text-sm rounded-sm!' onClick={() => {
                setShowCreateStudentModal(true)
                setDealToEdit(null)
              }}>
                {t('createStudent')}
              </button>}
            </>}
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-44'>
              <SingleSelect
                data={[
                  { value: 'accrual_method', label: t('methods.accrual') },
                  { value: 'cash_method', label: t('methods.cash') },
                ]}
                withSearch={false}
                value={dealsMethod}
                isClearable={false}
                onChange={(value) => setState('dealsMethod', value)}
                className='bg-white'
              />
            </div>
            <div className='w-72'>
              <Input
                type='text'
                placeholder={t('searchPlaceholder')}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <div>
              <button onClick={exportDeals} type='button' className="primary-btn">{t('downloadExcel')} {isDealsExportLoading && <Loader2 size={16} className="animate-spin" />}</button>
            </div>
          </div>
        </header>

        {/* Sticky column header */}
        <div className='flex h-12 sticky top-[60px] z-10 text-xs  font-medium text-neutral-500 items-center bg-neutral-100 border-b border-neutral-200'>
          <div className='w-10 flex items-center justify-center'>
            <OperationCheckbox checked={isAllSelected} onChange={handleSelectAll} />
          </div>
          {isAllSelected && selectedDeals.size > 0 ? (
            <div className='flex items-center gap-2'>
              <p>{selectedDeals.size}</p>
              <button className='primary-btn'>{tc('delete')}</button>
            </div>
          ) : (
            <>
                <div className='w-32 flex px-2 items-center justify-start'>{t('table.date')}</div>
                <div className='flex-1 flex px-2 items-center justify-start'>{t('table.name')}</div>
                <div className='w-52 flex px-2 items-center justify-start'>{t('table.client')}</div>
                <div className='w-28 flex px-2 items-center justify-center'>{t('table.status')}</div>
              <div className='w-36 flex px-2 items-center justify-end gap-1'>
                  <span>{t('table.dealAmount')}</span>
                <span>{GlobalCurrency.name}</span>
              </div>
                <div className='w-24 flex px-2 items-center justify-end'>{t('table.received')}</div>
                <div className='w-24 flex px-2 items-center justify-end'>{t('table.shipped')}</div>
                <div className='w-44 flex px-2 items-center justify-end gap-1'>
                  <span>{t('table.profit')}</span>
                  <span>{GlobalCurrency.name}</span>
                </div>
            </>
          )}
        </div>

        {formattedDeals?.length === 0 && !isLoading && (
          <div className='py-20 text-center text-neutral-500 text-sm'>{t('empty')}</div>
        )}

        <InfiniteScroll
          dataLength={formattedDeals?.length || 0}
          hasMore={hasNextPage}
          next={fetchNextPage}
          scrollableTarget='scrollableDiv'
        >
          <div className='flex flex-col pb-15'>
            {formattedDeals?.map(deal => {
              const price = dealsMethod === 'accrual_method' ? deal?.accrual_method?.profit : deal?.cash_method?.profit
              return (
                <div
                  key={deal.guid}
                  onClick={(e) => handleRowClick(deal, e)}
                  className='flex items-center h-12 border-b border-neutral-100 hover:bg-neutral-50 group cursor-pointer text-xs'
                >
                  <div className='w-10 flex items-center justify-center shrink-0' onClick={(e) => e.stopPropagation()}>
                    <OperationCheckbox
                      checked={selectedDeals.has(deal.guid)}
                      onChange={(e) => handleSelectOne(deal.guid, e)}
                    />
                  </div>
                  <div className='w-32 shrink-0 px-2'>{formatDateFormat(deal.Data_sdelki)}</div>
                  <div className='flex-1 flex flex-col px-2 min-w-0'>
                    <p className='truncate'>{deal.nazvanie}</p>
                    <p className='text-neutral-400 truncate'>{deal.comment}</p>
                  </div>
                  <div className='w-52 shrink-0 px-2 truncate'>{deal?.partner_name || '-'}</div>
                  <div className='w-28 shrink-0 px-2 flex items-center justify-center'>
                    <span
                      className={`${styles.status} ${styles[`status_${deal.status}`]}`}
                      style={{ color: deal?.color, backgroundColor: deal?.color + '10' }}
                    >
                      {deal?.status || '-'}
                    </span>
                  </div>
                  <div className='w-36 shrink-0 px-2 text-end'>{formatAmount(deal.summa_sdelki)}</div>
                  <div className='w-24 shrink-0 px-2 text-end'>{deal.postupilo || '0%'}</div>
                  <div className='w-24 shrink-0 px-2 text-end'>{deal.otgruzheno || '0%'}</div>
                  <div className='w-44 shrink-0 relative px-2 text-end'>
                    <div className='group-hover:hidden'>
                      <p className={price < 0 ? 'text-red-600' : 'text-green-600'}>{formatAmount(price)}</p>
                    </div>
                    <div className='hidden group-hover:flex justify-between'>

                      <button className='hover:bg-neutral-100 rounded-full justify-self-start p-2 cursor-pointer' title={t('tooltips.editContract')} onClick={(e) => handleUpdate(deal, e)}>
                        &nbsp;
                      </button>

                      <div className='flex items-center justify-end'>
                        {deal.contract_file && <button className='hover:bg-neutral-100 rounded-full p-2 cursor-pointer' title={t('tooltips.downloadContract')} onClick={() => handleDownload(deal.contract_file, 'Договор.pdf')}>
                          <Download size={14} color='#686868' />
                        </button>}
                        {dealPermission.edit && <button className='hover:bg-neutral-100 rounded-full p-2 cursor-pointer' title={t('tooltips.edit')} onClick={(e) => handleEditClick(deal, e)}>
                          <MdOutlineModeEdit size={14} color='#686868' />
                        </button>}
                        {dealPermission.add && <button className='hover:bg-neutral-100 rounded-full p-2 cursor-pointer' title={t('tooltips.copy')} onClick={(e) => handleCopyClick(deal, e)}>
                          <IoCopyOutline size={14} color='#686868' />
                        </button>}
                        {dealPermission.delete && <button className='hover:bg-neutral-100 rounded-full p-2 cursor-pointer' title={t('tooltips.delete')} onClick={(e) => handleDeleteClick(deal, e)}>
                          <IoCloseOutline size={14} color='#686868' />
                        </button>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </InfiniteScroll>

        {isLoading && allDeals.length === 0 && <ScreenLoader className={'left-0!'} />}
        {(isFetchingNextPage || isFetching) && <ScreenLoader className={'left-0!'} />}
      </main>

      {/* Fixed Footer */}
      <footer className={cn(
        'fixed bottom-0 right-0 bg-neutral-100 p-2 py-3 border-t border-neutral-200 flex items-center gap-6 z-10 transition-[left] duration-300',
        isFilterOpen ? 'left-[320px]' : 'left-[110px]'
      )}>
        <span className='flex items-center gap-1.5'>
          <span className='text-[11px] text-gray-500 font-medium'>{t('footer.dealsCount', { count: summary?.count || 0 })}</span>
          <span className='text-xs font-semibold text-slate-900'>{formatAmount(summary?.total_deals_sum || 0)}</span>
          <span className='text-xs font-semibold text-slate-900'>{GlobalCurrency.name}</span>
        </span>
        <div className='w-px h-5 bg-gray-200 shrink-0' />
        <span className='flex items-center gap-1.5'>
          <span className='text-[11px] text-gray-500 font-medium'>{t('footer.totalProfit')}</span>
          <span className={cn(
            'text-xs font-semibold',
            totalProfit > 0 ? 'text-emerald-500' : totalProfit < 0 ? 'text-red-500' : 'text-slate-900'
          )}>{formatAmount(totalProfit)}</span>
          <span className='text-xs font-semibold text-slate-900'>{GlobalCurrency.name}</span>
        </span>
      </footer>

      <CreateStudentModal
        dealGuid={dealToEdit?.guid || null}
        isOpen={showCreateStudentModal}
        onClose={closeStudentModal}
        canUpdateForms={canUpdateForms}
      />
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        initialData={dealToEdit || dealToCopy}
        isEditing={!!dealToEdit}
      />
      <DeleteDealModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeletingDeal}
        deal={dealToDelete ? {
          name: dealToDelete.nazvanie || dealToDelete.guid?.substring(0, 8),
          client: dealToDelete.kontragent?.nazvanie,
          amount: formatAmount(dealToDelete.summa_sdelki)
        } : null}
      />
    </div>
  )
})
