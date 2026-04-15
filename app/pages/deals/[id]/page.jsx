'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import styles from './deal-detail.module.scss';
import { useUcodeRequestQuery } from '@/hooks/useDashboard';
import { keepPreviousData } from '@tanstack/react-query';
import DealStatus from '@/components/deals/details/Status';
import CreateShipment from '@/components/deals/details/CreatingShipment';
import { ChevronUp, CirclePlus, Ellipsis, Search } from 'lucide-react';
import { HiOutlineDatabase } from "react-icons/hi";
import { HiOutlineCreditCard } from "react-icons/hi2";
import { PiDatabaseFill } from "react-icons/pi";
import { ShipmentPlusIcon, BoxIcon } from '@/constants/icons';
import Input from '@/components/shared/Input';
import OperationModal from '@/components/operations/OperationModal/OperationModal';
import CreateProductService from '@/components/deals/details/CreateProductService';
import Loader from '@/components/shared/Loader';
import { formatAmount } from '@/utils/helpers';
import ShipmenTable from '../../../../components/deals/details/ShipmenTable';
import ProductServiceTable from '../../../../components/deals/details/ProductServiceTable';
import CustomRadio from '../../../../components/shared/Radio';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import CustomProgress from '../../../../components/shared/Progress';
import { observer } from 'mobx-react-lite';
import CommentChat from '../../../../components/deals/details/CommentChat';
import { sealDeal } from '../../../../store/saleDeal.store';
import ExpenseOperationsTable from '../../../../components/deals/details/ExpenseOperationTable';
import IncomeOperationsTable from '../../../../components/deals/details/IncomeOperationsTable';
import { calculatePercent, formatDateRu, formatNumber, formatTotalSumma } from '../../../../utils/helpers';
import { CreateDealModal } from '@/components/deals/CreateDealModal/CreateDealModal';
import { DeleteDealModal } from '@/components/deals/DeleteDealModal/DeleteDealModal';
import { useUcodeDefaultApiMutation } from '@/hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';
import { useUcodeRequestMutation } from '../../../../hooks/useDashboard';
import { GlobalCurrency } from '../../../../constants/globalCurrency';


export default observer(function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id;

  const { data: dealData, isLoading } = useUcodeRequestQuery({
    method: "get_sales_transaction_by_guid",
    data: {
      guid: dealId
    },
    querySetting: {
      select: (response) => response?.data?.data,
      placeholderData: keepPreviousData,
    }
  })

  const { mutateAsync: updateDeal } = useUcodeRequestMutation()



  const summeryCards = useMemo(() => {
    return dealData || null
  }, [dealData])

  const deal = {
    guid: dealId,
    name: summeryCards?.name,
    sale_date: summeryCards?.sale_date,
    counterparties_id: summeryCards?.counterparties_id,
    nds: summeryCards?.nds,
    commentary: summeryCards?.commentary
  }

  console.log(deal)

  const handleUpdateStatus = async (status) => {
    try {
      await updateDeal({
        method: "update_sales_transaction",
        data: {
          guid: dealId,
          name: deal?.name,
          sales_status_id: status?.guid,
        }
      })
      queryClient.invalidateQueries({ queryKey: ['get_sales_transaction_by_guid'] })
    } catch (error) {
      console.log(error)
    }
  }

  const [activeTab, setActiveTab] = useState('products');
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operation, setOperation] = useState(null)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [isModalOpening, setIsModalOpening] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const accounting = sealDeal.accounting
  const [showAccounting, setShowAccounting] = useState(false)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [dealToEdit, setDealToEdit] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: deleteDeal, isPending: isDeletingDeal } = useUcodeDefaultApiMutation({ mutationKey: 'delete-deal' });

  const confirmDelete = () => {
    if (!dealToDelete) return;

    deleteDeal(
      {
        urlMethod: 'DELETE',
        urlParams: `/items/sales_transactions/${dealToDelete.guid}?from-ofs=true`
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['deals'] });
          router.push('/pages/deals');
        }
      }
    );
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setDealToEdit(null);
  };


  // Product/service row action menu state 
  const [itemToEdit, setItemToEdit] = useState(null)
  const [isCopying, setIsCopying] = useState(false)


  if (isLoading) {
    return (
      <div className="w-full h-dvh flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const dealAmount = Number(summeryCards?.total_products_summa) || 0;
  const received = Number(summeryCards?.total_receipts_summa) || 0;
  const shipped = Number(summeryCards?.total_shipment_summa) || 0;

  const profit = (accounting === 'accrual' ? summeryCards?.accrual_method?.profit : summeryCards?.cash_method?.profit) || 0;
  const expenses = (accounting === 'accrual' ? summeryCards?.accrual_method?.expenses : summeryCards?.cash_method?.expenses) || 0;
  const income = (accounting === 'accrual' ? summeryCards?.accrual_method?.income : summeryCards?.cash_method?.income) || 0;

  const receivedPercent = summeryCards?.receipts_percentage != null ? Math.round(Number(summeryCards.receipts_percentage) * 100) : 0;
  const shippedPercent = summeryCards?.shipments_percentage != null ? Math.round(Number(summeryCards.shipments_percentage)) : 0;


  const profitPercent = Math.round(Number(accounting === 'accrual' ? summeryCards?.accrual_method?.profitability : summeryCards?.cash_method?.profitability)) || 0;

  const clientDebt = Number(summeryCards?.client_debt) || 0;
  const remainingShipment = Number(summeryCards?.remaining_shipment) || 0;


  const handleCreateOperation = () => {
    setOperation({ isNew: true })
    setShowOperationModal(true)
    setIsModalClosing(false)
    setIsModalOpening(true)
    setTimeout(() => {
      setIsModalOpening(false)
    }, 50)
  }

  const handleSelectProduct = (item, type) => {
    setShowProductModal(true)
    if (type === 'edit') {
      setItemToEdit(item)
      setIsCopying(false)
    } else if (type === 'copy') {
      setItemToEdit(item)
      setIsCopying(true)
    }
  }

  return (
    <div className="flex overflow-hidden overflow-y-auto  flex-col space-y-4 fixed left-[80px] top-[60px] w-[calc(100%-80px)] h-[calc(100%-60px)]">
      {/* Breadcrumbs */}
      <div className="px-3 py-2 bg-white sticky top-0 z-10">
        <button onClick={() => router.push('/pages/deals')} className={styles.breadcrumbLink}>
          Сделки по продажам
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{deal?.name || 'Без названия'}</span>
      </div>

      {/* Header */}
      <div className='flex items-center justify-between px-3 '>
        <div className={styles.header}>
          <h1 className={styles.title}>{deal?.name || 'Без названия'}</h1>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <span className="w-10 h-10 rounded-md cursor-pointer border flex items-center justify-center p-2 bg-white">
              <Ellipsis size={18} className='text-neutral-800' />
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-40 rounded-md overflow-hidden p-0 border border-gray-50! ring ring-neutral-100 bg-white shadow-md mt-1" align="end">
            <div className="flex flex-col">
              <button
                className="flex items-center gap-2 p-2.5 text-sm text-neutral-800 hover:bg-neutral-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                onClick={() => {
                  setDealToEdit(deal);
                  setIsCreateModalOpen(true);
                }}
              >
                <Pencil size={16} className="text-neutral-600" />
                <span>Редактировать</span>
              </button>
              <button
                className="flex items-center gap-2 p-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                onClick={() => setDealToDelete(dealData)}
              >
                <Trash size={16} className="text-red-500" />
                <span>Удалить</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Info Cards */}
      <div className="min-w-[920px] max-w-[1920px] gap-2 xl:gap-4 px-3 grid grid-cols-4">
        {/* Card 1: Deal Amount */}
        <div className={'bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)]'}>
          <div className="flex items-center justify-between">
            <p className='text-base xl:text-xl flex gap-1 font-semibold text-neutral-800 mt-2 truncate'>
              <span className="truncate">{formatNumber(formatTotalSumma(summeryCards?.total_products_summa))}</span>
              <span>{GlobalCurrency.name}</span>
            </p>
            <div className="shrink-0 ml-1">
              <DealStatus
                currentStatus={summeryCards?.status}
                onStatusChange={(status) => {
                  handleUpdateStatus(status);
                }}
              />
            </div>
          </div>


          <div className="border-b border-gray-100 my-2 xl:my-3"></div>

          <div className="grid grid-cols-[70px_1fr] xl:grid-cols-[100px_1fr] gap-y-2 mt-1 xl:mt-2 font-sans">
            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">Тип</span>
            <div className="flex items-center">
              <span className="flex items-center gap-1 md:gap-1.5 bg-[#F2F4F7] rounded-lg xl:rounded-[10px] px-2 xl:px-3 py-0.5 xl:py-1 text-xs xl:text-sm font-semibold text-neutral-800">
                <PiDatabaseFill size={14} className='text-[#9aa4b3] xl:w-4 xl:h-4 w-3.5 h-3.5' />
                Продажа
              </span>
            </div>

            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">Клиент</span>
            <div className="flex items-center w-full min-w-0 overflow-hidden">
              <span
                className="text-xs xl:text-sm font-medium text-neutral-800 border-b border-dotted border-gray-400 pb-0.5 cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group truncate w-full"
                onClick={() => { setDealToEdit(deal); setIsCreateModalOpen(true); }}
              >
                <div className="truncate">{summeryCards?.counterparties_name || 'test'}</div>
                <Pencil size={12} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
              </span>
            </div>

            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">Создана</span>
            <div className="flex items-center">
              <span
                className="text-xs xl:text-sm font-medium text-neutral-800 border-b border-dotted border-gray-400 pb-0.5 cursor-pointer flex items-center gap-1 group whitespace-nowrap"
                onClick={() => { setDealToEdit(deal); setIsCreateModalOpen(true); }}
              >
                {formatDateRu(deal?.sale_date)}
                <Pencil size={12} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Receipts */}
        <div className="bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-2 xl:mb-4">
            <span className="font-semibold text-sm xl:text-base text-gray-ucode-800 truncate pr-2">Поступления</span>
            <button onClick={() => { handleCreateOperation(); setActiveTab('receipts'); }} className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-opacity hover:opacity-70 shrink-0">
              <CirclePlus size={20} strokeWidth={1.5} className='text-neutral-300 w-4 h-4 xl:w-5 xl:h-5' />
            </button>
          </div>

          <div className="flex items-center xl:items-start gap-2 xl:gap-3 mb-3 xl:mb-5">
            <div className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-lg xl:rounded-[10px] bg-[#F2F4F7] flex items-center justify-center shrink-0">
              <HiOutlineDatabase size={20} className='text-neutral-400 w-4 h-4 xl:w-5 xl:h-5' />
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              <div className="font-semibold text-sm xl:text-lg text-gray-ucode-800 truncate">{formatAmount(received)} {GlobalCurrency.name}</div>
              <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">из {formatAmount(dealAmount)} {GlobalCurrency.name}</div>
            </div>
          </div>

          <div className="w-full h-1.5 xl:h-2 bg-[#F2F4F7] rounded-md overflow-hidden mb-1 xl:mb-2 mt-auto">
            <CustomProgress min={0} value={received} max={dealAmount} fillColor="#12B76A" />
          </div>
          <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 mt-1 xl:mt-2 mb-3 xl:mb-5 truncate">Поступило: {calculatePercent(dealAmount, received)}</div>

          <div className="flex text-mini xl:text-xs flex-wrap items-end gap-1 xl:gap-2">
            <span className="font-normal text-gray-ucode-500 whitespace-nowrap">Клиент должен:</span>
            <p className="truncate">
              <span className="font-medium text-[#344054]">{formatAmount(clientDebt)} </span>
              <span>{GlobalCurrency.name}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Shipments */}
        <div className="bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-2 xl:mb-4">
            <span className="font-semibold text-sm xl:text-base text-gray-ucode-800 truncate pr-2">Отгрузки клиенту</span>
            <button onClick={() => setShowShipmentModal(true)} className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-opacity hover:opacity-70 shrink-0">
              <div className="scale-75 xl:scale-100 origin-right transition-transform"><ShipmentPlusIcon /></div>
            </button>
          </div>

          <div className="flex items-center xl:items-start text-lg gap-2 xl:gap-3 mb-3 xl:mb-5">
            <div className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-lg xl:rounded-[10px] bg-[#F2F4F7] flex items-center justify-center shrink-0">
              <div className="scale-75 xl:scale-100"><BoxIcon /></div>
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              <div className="font-semibold text-sm xl:text-lg text-gray-ucode-800 truncate">{formatAmount(shipped)} {GlobalCurrency.name}</div>
              <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">из {formatAmount(dealAmount)} {GlobalCurrency.name}</div>
            </div>
          </div>

          <div className="w-full h-1.5 xl:h-2 bg-[#F2F4F7] rounded-md overflow-hidden mb-1 xl:mb-2 mt-auto">
            <CustomProgress min={0} value={shipped} max={dealAmount} fillColor="#12B76A" />
          </div>
          <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 mt-1 xl:mt-2 mb-3 xl:mb-5 truncate">Отгружено: {calculatePercent(dealAmount, shipped)}</div>

          <div className="flex text-mini xl:text-xs gap-1 xl:gap-2 flex-wrap items-end">
            <span className="font-normal text-gray-ucode-500 whitespace-nowrap">Мы должны:</span>
            <span className="font-medium text-[#344054] truncate">{formatAmount(remainingShipment)} {GlobalCurrency.name}</span>
          </div>
        </div>

        {/* Card 4: Profit */}
        <div className="bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-2 xl:mb-4">
            <span className="font-semibold text-sm xl:text-base text-gray-ucode-800 truncate pr-1">Прибыль сделки</span>
            <Popover open={showAccounting} onOpenChange={setShowAccounting}>
              <PopoverTrigger className="relative bg-primary/10 cursor-pointer text-primary px-1.5 xl:px-2 py-0.5 xl:py-1 rounded-full text-mini xl:text-xs border-none outline-none shrink-0">
                <div className="flex items-center gap-1 xl:gap-2">
                  <p className="text-mini xl:text-xs">Учет</p>
                  <ChevronUp size={12} className={`transition-all duration-300 ${showAccounting ? 'rotate-180' : ''}`} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-md overflow-hidden p-0 border-none" align="end">
                <div className="flex flex-col bg-white">
                  <label htmlFor="accrual" className="flex p-3 items-center gap-2 cursor-pointer hover:bg-neutral-50">
                    <CustomRadio name="accounting" id="accrual" value="accrual" checked={accounting === 'accrual'} onChange={(e) => { sealDeal.setState('accounting', e.target.value); setShowAccounting(false); }} />
                    <span className="whitespace-nowrap text-xs text-neutral-800">Методом начисления</span>
                  </label>
                  <label htmlFor="cash" className="flex p-3 items-center gap-2 cursor-pointer hover:bg-neutral-50">
                    <CustomRadio name="accounting" id="cash" value="cash" checked={accounting === 'cash'} onChange={(e) => { sealDeal.setState('accounting', e.target.value); setShowAccounting(false); }} />
                    <span className="whitespace-nowrap text-xs text-neutral-800">Кассовым методом</span>
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center xl:items-start gap-2 xl:gap-3 mb-2 xl:mb-3 mt-auto">
            <div className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-lg xl:rounded-[10px] bg-[#F2F4F7] flex items-center justify-center shrink-0">
              <HiOutlineCreditCard size={20} className='text-neutral-400 w-4 h-4 xl:w-5 xl:h-5' />
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              <div className="font-semibold text-sm xl:text-lg text-gray-ucode-800 truncate">{formatAmount(profit)} {GlobalCurrency.name}</div>
              <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">Рентабельность {profitPercent}%</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 xl:gap-2 my-1 xl:my-2">
            <div className="w-full xl:h-2 h-1.5 bg-[#F2F4F7] rounded-md overflow-hidden">
              <CustomProgress value={received} fillColor="#12B76A" min={0} max={received} />
            </div>
            <div className="w-full xl:h-2 h-1.5 bg-[#F2F4F7] rounded-md overflow-hidden">
              <CustomProgress value={expenses} fillColor="#FFC609" min={0} max={income} />
            </div>
          </div>

          <div className="flex flex-1 items-end gap-1.5 xl:gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <div className={styles.profitBarDot} style={{ backgroundColor: '#12B76A', flexShrink: 0, width: '4px', height: '4px', borderRadius: '50%', marginBottom: '2px' }}></div>
              <span className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">Доходы</span>
              <span className="font-medium text-[11px] xl:text-sm text-gray-ucode-800 truncate">+{formatAmount(income)} {GlobalCurrency.name}</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className={styles.profitBarDot} style={{ backgroundColor: '#FFC609', flexShrink: 0, width: '4px', height: '4px', borderRadius: '50%', marginBottom: '2px' }}></div>
              <span className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">Расходы</span>
              <span className="font-medium text-[11px] xl:text-sm text-gray-ucode-800 truncate">-{formatAmount(expenses)} {GlobalCurrency.name}</span>
            </div>
          </div>
        </div>
        {/* Main Content Layout */}
        {/* Left side - Tabs and content */}
        <div className="col-span-3 bg-white rounded-xl shadow-[0_10px_10px_rgba(118,164,172,0.1)]">
          <div className='flex flex-col sticky top-16 z-10  '>
            <div className="flex  border-b h-16 border-neutral-100 rounded-t-xl  mb-0">
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${activeTab === 'products' ? 'text-neutral-900 border-neutral-900 font-bold' : 'text-neutral-400 border-transparent'
                  }`}
                onClick={() => setActiveTab('products')}
              >
                Товары и услуги ({summeryCards?.products_count ?? 0})
              </button>
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${activeTab === 'receipts' ? 'text-neutral-900 border-neutral-900 font-bold' : 'text-neutral-400 border-transparent'
                  }`}
                onClick={() => setActiveTab('receipts')}
              >
                Поступления ({summeryCards?.receipts_count ?? 0})
              </button>
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${activeTab === 'expenses' ? 'text-neutral-900 border-neutral-900 font-bold' : 'text-neutral-400 border-transparent'
                  }`}
                onClick={() => setActiveTab('expenses')}
              >
                Расходы ({summeryCards?.expenses_count ?? 0})
              </button>
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${activeTab === 'shipments' ? 'text-neutral-900 border-neutral-900 font-bold' : 'text-neutral-400 border-transparent'
                  }`}
                onClick={() => setActiveTab('shipments')}
              >
                Отгрузки ({summeryCards?.shipments_count ?? 0})
              </button>
            </div>
            {/* Tab Content */}
            <div className="p-2  rounded-b-xl">
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionTitle} text-xs xl:text-sm pr-2 truncate`}>
                  {activeTab === 'products' && 'Выберите товары или услуги для продажи'}
                  {activeTab === 'receipts' && 'Платежи от клиентов за проданные товары или оказанные услуги '}
                  {activeTab === 'expenses' && 'Понесенные затраты по сделке'}
                  {activeTab === 'shipments' && 'Товары и услуги, которые вы отгрузили клиенту '}
                </div>
                <div className={styles.searchContainer}>
                  <Input
                    leftIcon={<Search size={16} className="xl:w-[18px] xl:h-[18px]" />}
                    type="text"
                    placeholder="Поиск"
                    className={` w-[240px] xl:w-[200px] text-xs xl:text-sm`}
                  />
                  <button
                    className='primary-btn  text-xs xl:text-sm px-3 xl:px-4 py-2 xl:py-2.5 whitespace-nowrap shrink-0'
                    onClick={() => {
                      if (activeTab === 'shipments') {
                        setShowShipmentModal(true);
                      } else if (activeTab === 'receipts' || activeTab === 'expenses') {
                        handleCreateOperation()
                      } else if (activeTab === 'products') {
                        setShowProductModal(true)
                      }
                    }}
                  >
                    Добавить
                  </button>
                </div>
              </div>
              <div className="overflow-hidden">
                {activeTab === 'products' && <ProductServiceTable handleSelect={handleSelectProduct} sellingDealId={dealId} onAdd={() => setShowProductModal(true)} />}

                {activeTab === 'receipts' && <IncomeOperationsTable type='Поступление' sellingDealId={dealId} onAdd={handleCreateOperation} />}

                {activeTab === 'expenses' && <ExpenseOperationsTable type='Выплата' sellingDealId={dealId} onAdd={handleCreateOperation} />}

                {activeTab === 'shipments' && <ShipmenTable dealGuid={dealId} dealName={summeryCards?.Nazvanie} onAdd={() => setShowShipmentModal(true)} />}
              </div>
            </div>
          </div>
        </div>
        <div className='flex-1 h-full max-h-[600px]'>
          <CommentChat dealGuid={dealId} />
        </div>

        {/* Shipment Creation Modal */}
      </div>
      <CreateShipment
        open={showShipmentModal}
        onClose={() => setShowShipmentModal(false)}
        dealName={summeryCards?.Nazvanie}
        dealGuid={dealId}
        kontragentId={summeryCards?.counterparties_id}
      />



      {/* Operation Modal */}
      {showOperationModal && (
        <OperationModal
          operation={operation}
          isClosing={isModalClosing}
          isOpening={isModalOpening}
          defaultDealGuid={dealId}
          onClose={() => {
            setIsModalClosing(true)
            setTimeout(() => {
              setShowOperationModal(false)
              setIsModalClosing(false)
            }, 300)
          }}
          preselectedCounterparty={summeryCards?.counterparties_id}
          onSuccess={() => setShowOperationModal(false)}
          initialTab={activeTab === 'expenses' ? 'payment' : 'income'}
        />
      )}

      {/* Create Product/Service Modal */}
      <CreateProductService
        open={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setItemToEdit(null);
          setIsCopying(false);
        }}
        dealGuid={dealId}
        initialData={itemToEdit}
        isEditing={!!itemToEdit && !isCopying}
      />

      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        initialData={dealToEdit}
        isEditing={true}
      />

      <DeleteDealModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeletingDeal}
        deal={dealToDelete ? {
          name: summeryCards?.Nazvanie,
          client: summeryCards?.counterparty_name,
          amount: formatAmount(summeryCards?.total_products_summa)
        } : null}
      />



      {/* Delete Confirm Modal */}
      {/* <CustomModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)}>
        <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#101828', fontFamily: 'Inter, sans-serif' }}>
          Удалить товар
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#344054', lineHeight: '20px', fontFamily: 'Inter, sans-serif' }}>
          Вы действительно хотите удалить «<strong>{itemToDelete?.name}</strong>»?<br />Восстановить его будет невозможно.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={() => setItemToDelete(null)}
            style={{ background: 'transparent', border: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#0c8c9a', padding: '8px 16px', cursor: 'pointer' }}
          >
            Отменить
          </button>
          <button
            disabled={isDeletingItem}
            onClick={handleDeleteConfirm}
            style={{ background: isDeletingItem ? '#f98080' : '#F04438', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, padding: '8px 20px', cursor: 'pointer' }}
          >
            {isDeletingItem ? <Loader /> : 'Удалить'}
          </button>
        </div>
      </CustomModal> */}
    </div>
  );
})