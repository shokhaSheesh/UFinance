"use client";

import { CreateDealModal } from "@/components/deals/CreateDealModal/CreateDealModal";
import { DeleteDealModal } from "@/components/deals/DeleteDealModal/DeleteDealModal";
import CommentChat from "@/components/deals/details/CommentChat";
import CreateProductService from "@/components/deals/details/CreateProductService";
import CreateShipment from "@/components/deals/details/CreatingShipment";
import ExpenseOperationsTable from "@/components/deals/details/ExpenseOperationTable";
import IncomeOperationsTable from "@/components/deals/details/IncomeOperationsTable";
import ProductServiceTable from "@/components/deals/details/ProductServiceTable";
import ShipmenTable from "@/components/deals/details/ShipmenTable";
import DealStatus from "@/components/deals/details/Status";
import PaymentModal from "@/components/deals/PaymentModal";
import OperationModal from "@/components/operations/OperationModal/OperationModal";
import Input from "@/components/shared/Input";
import CustomProgress from "@/components/shared/Progress";
import CustomRadio from "@/components/shared/Radio";
import ScreenLoader from "@/components/shared/ScreenLoader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GlobalCurrency } from "@/constants/globalCurrency";
import { BoxIcon, ShipmentPlusIcon, SupplyTruckIcon } from "@/constants/icons";
import {
  useUcodeRequestMutation,
  useUcodeRequestQuery,
} from "@/hooks/useDashboard";
import useMounted from "@/hooks/useMounted";
import FixedContent from "@/layouts/FixedContent";
import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";
import { sealDeal } from "@/store/saleDeal.store";
import {
  calculatePercent,
  formatAmount,
  formatDateRu,
  formatNumber,
  formatTotalSumma,
} from "@/utils/helpers";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import {
  ChevronUp,
  CirclePlus,
  Ellipsis,
  Pencil,
  Plus,
  Search,
  Trash,
  Undo2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HiOutlineDatabase } from "react-icons/hi";
import { HiOutlineCreditCard } from "react-icons/hi2";
import { PiDatabaseFill } from "react-icons/pi";
import styles from "./purchase-detail.module.scss";

export default observer(function PurchaseDetailPage() {
  const [openPayment, setOpenPayment] = useState(false);
  const params = useParams();
  const router = useRouter();
  const mounted = useMounted();
  const t = useTranslations("Deals.detail");
  const tp = useTranslations("Purchases");
  const tc = useTranslations("Common");
  const dealId = params.id;

  const { operations } = appStore.permission;

  const { data: dealData, isLoading } = useUcodeRequestQuery({
    method: "get_purchase_transaction_by_guid",
    data: {
      guid: dealId,
    },
    querySetting: {
      select: (response) => response?.data?.data,
      placeholderData: keepPreviousData,
    },
  });

  // Сделкада товар/услуга бор-йўқлиги: поставка учун улар шарт.
  // queryKey 'products_services_list' — CreateProductService шу префиксни invalidate қилади,
  // шунинг учун товар қўшилса, автомат янгиланади.
  const { data: hasProducts } = useUcodeRequestQuery({
    queryKey: "products_services_list",
    method: "list_products_and_services",
    data: { purchase_transactions_id: dealId, page: 1, limit: 1 },
    skip: !dealId,
    querySetting: {
      select: (res) => {
        const total = res?.data?.pagination?.total;
        if (typeof total === "number") return total > 0;
        return (res?.data?.data?.length || 0) > 0;
      },
    },
  });

  const { mutateAsync: updateDeal } = useUcodeRequestMutation();

  const summeryCards = useMemo(() => {
    return dealData || null;
  }, [dealData]);

  const deal = {
    guid: dealId,
    name: summeryCards?.name,
    sale_date: summeryCards?.deal_date,
    counterparties_id: summeryCards?.counterparties_id,
    nds: summeryCards?.nds,
    commentary: summeryCards?.commentary,
  };

  const handleUpdateStatus = async (status) => {
    try {
      await updateDeal({
        method: "update_purchase_transaction_status",
        data: {
          guid: dealId,
          name: deal?.name,
          sales_status_id: status?.guid,
          branch_id: authStore.branch_id,
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["get_purchase_transaction_by_guid"],
      });
    } catch (error) {
      console.log(error);
    }
  };

  const [activeTab, setActiveTab] = useState("products");
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operation, setOperation] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const accounting = sealDeal.accounting;
  const [showAccounting, setShowAccounting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [dealToEdit, setDealToEdit] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: deleteDeal, isPending: isDeletingDeal } =
    useUcodeRequestMutation();

  const confirmDelete = () => {
    if (!dealToDelete) return;

    deleteDeal(
      {
        method: "delete_purchase_transaction",
        data: { guid: dealToDelete.guid, branch_id: authStore.branch_id },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["get_purchase_list"] });
          router.push("/deals/purchase");
        },
      }
    );
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setDealToEdit(null);
  };

  const [itemToEdit, setItemToEdit] = useState(null);
  const [isCopying, setIsCopying] = useState(false);

  const incomePermission = operations.income.add;
  const incomeCanEdit = operations.income.edit;
  const incomeCanDelete = operations.income.delete;
  const paymentPermission = operations.payout.add;
  const paymentCanEdit = operations.payout.edit;
  const paymentCanDelete = operations.payout.delete;
  const shipmentPermission = operations.shipment.add;
  const productsPermission =
    appStore.permission.directories.productsServices.add;

  const dealAmount = Number(summeryCards?.deal_sum) || 0;
  const received = Number(summeryCards?.paid_amount) || 0;
  const shipped = Number(summeryCards?.supply_amount) || 0;

  const receivedPercent =
    summeryCards?.paid_percent != null
      ? Math.round(summeryCards.paid_percent)
      : 0;
  const shippedPercent =
    summeryCards?.supply_percent != null
      ? Math.round(summeryCards.supply_percent)
      : 0;

  const clientDebt = dealAmount - received;
  const remainingShipment = dealAmount - shipped;

  const handleCreateOperation = () => {
    setOperation({ isNew: true });
    setShowOperationModal(true);
    setIsModalClosing(false);
    setIsModalOpening(true);
    setTimeout(() => {
      setIsModalOpening(false);
    }, 50);
  };

  const handleSelectProduct = (item, type) => {
    setShowProductModal(true);
    if (type === "edit") {
      setItemToEdit(item);
      setIsCopying(false);
    } else if (type === "copy") {
      setItemToEdit(item);
      setIsCopying(true);
    }
  };

  if (!mounted) return null;

  return (
    <FixedContent className="flex overflow-hidden overflow-y-auto  flex-col space-y-4">
      {isLoading && <ScreenLoader />}
      {/* Breadcrumbs */}
      <div className="px-3 py-2 bg-white sticky top-0 z-10">
        <button
          onClick={() => router.push("/deals/purchase")}
          className={styles.breadcrumbLink}
        >
          {tp("backToList")}
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>
          {deal?.name || t("noName")}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 ">
        <div className={styles.header}>
          <h1 className={styles.title}>{deal?.name || t("noName")}</h1>
        </div>
        <div className="flex items-center gap-2">
          {appStore.isWLCMPayment && (
            <button
              onClick={() => setOpenPayment(true)}
              className="px-4 py-2 cursor-pointer hover:bg-primary-dark bg-blue-500 text-white rounded-md"
            >
              {tc("pay")}
            </button>
          )}
          {(operations?.shipment?.edit || operations?.shipment?.delete) && (
            <Popover>
              <PopoverTrigger asChild>
                <span className="w-10 h-10 rounded-md cursor-pointer border flex items-center justify-center p-2 bg-white">
                  <Ellipsis size={18} className="text-neutral-800" />
                </span>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 rounded-md overflow-hidden p-0 border border-gray-50! ring ring-neutral-100 bg-white shadow-md mt-1"
                align="end"
              >
                <div className="flex flex-col">
                  {operations?.shipment?.edit && (
                    <button
                      className="flex items-center gap-2 p-2.5 text-sm text-neutral-800 hover:bg-neutral-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                      onClick={() => {
                        setDealToEdit(deal);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Pencil size={16} className="text-neutral-600" />
                      <span>{t("actions.edit")}</span>
                    </button>
                  )}
                  {operations?.shipment?.delete && (
                    <button
                      className="flex items-center gap-2 p-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                      onClick={() => setDealToDelete(dealData)}
                    >
                      <Trash size={16} className="text-red-500" />
                      <span>{t("actions.delete")}</span>
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="min-w-[920px] max-w-[1920px] gap-2 xl:gap-4 px-3 grid grid-cols-3">
        {/* Card 1: Deal Amount */}
        <div
          className={
            "bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)]"
          }
        >
          <div className="flex items-center justify-between">
            <p className="text-base xl:text-xl flex gap-1 font-semibold text-neutral-800 mt-2 truncate">
              <span className="truncate">
                {formatNumber(formatTotalSumma(summeryCards?.deal_sum))}
              </span>
              <span>{GlobalCurrency && GlobalCurrency?.name}</span>
            </p>
            <div className="shrink-0 ml-1">
              <DealStatus
                currentStatus={[summeryCards?.sales_status_name]}
                onStatusChange={(status) => {
                  handleUpdateStatus(status);
                }}
              />
            </div>
          </div>

          <div className="border-b border-gray-100 my-2 xl:my-3"></div>

          <div className="grid grid-cols-[70px_1fr] xl:grid-cols-[100px_1fr] gap-y-2 mt-1 xl:mt-2 font-sans">
            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">
              {t("cards.type")}
            </span>
            <div className="flex items-center">
              <span className="flex items-center gap-1 md:gap-1.5 bg-[#F2F4F7] rounded-lg xl:rounded-[10px] px-2 xl:px-3 py-0.5 xl:py-1 text-xs xl:text-sm font-semibold text-neutral-800">
                <PiDatabaseFill
                  size={14}
                  className="text-[#9aa4b3] xl:w-4 xl:h-4 w-3.5 h-3.5"
                />
                {t("cards.purchase")}
              </span>
            </div>

            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">
              {t("cards.supplier")}
            </span>
            <div className="flex items-center w-full min-w-0 overflow-hidden">
              <span
                className="text-xs xl:text-sm font-medium text-neutral-800 border-b border-dotted border-gray-400 pb-0.5 cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group truncate w-full"
                onClick={() => {
                  setDealToEdit(deal);
                  setIsCreateModalOpen(true);
                }}
              >
                <div className="truncate">
                  {summeryCards?.counterparty_name || ""}
                </div>
                <Pencil
                  size={12}
                  className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                />
              </span>
            </div>

            <span className="text-xs xl:text-sm font-normal text-[#8892A3]">
              {t("cards.created")}
            </span>
            <div className="flex items-center">
              <span
                className="text-xs xl:text-sm font-medium text-neutral-800 border-b border-dotted border-gray-400 pb-0.5 cursor-pointer flex items-center gap-1 group whitespace-nowrap"
                onClick={() => {
                  setDealToEdit(deal);
                  setIsCreateModalOpen(true);
                }}
              >
                {formatDateRu(deal?.sale_date)}
                <Pencil
                  size={12}
                  className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Receipts */}
        <div className="bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-2 xl:mb-4">
            <span className="font-semibold text-sm xl:text-base text-gray-ucode-800 truncate pr-2">
              Выплаты поставщику
            </span>
            {incomePermission && (
              <button
                onClick={() => {
                  handleCreateOperation();
                  setActiveTab("receipts");
                }}
                className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-opacity hover:opacity-70 shrink-0"
              >
                <CirclePlus
                  size={20}
                  strokeWidth={1.5}
                  className="text-neutral-300 w-4 h-4 xl:w-5 xl:h-5"
                />
              </button>
            )}
          </div>

          <div className="flex items-center xl:items-start gap-2 xl:gap-3 mb-3 xl:mb-5">
            <div className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-lg xl:rounded-[10px] bg-[#F2F4F7] flex items-center justify-center shrink-0">
              <HiOutlineDatabase
                size={20}
                className="text-neutral-400 w-4 h-4 xl:w-5 xl:h-5"
              />
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              <div className="font-semibold text-sm xl:text-lg text-gray-ucode-800 truncate">
                {formatAmount(received)} {GlobalCurrency?.name}
              </div>
              <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">
                {t("cards.from")} {formatAmount(dealAmount)}{" "}
                {GlobalCurrency?.name}
              </div>
            </div>
          </div>

          <div className="w-full h-1.5 xl:h-2 bg-[#F2F4F7] rounded-md overflow-hidden mb-1 xl:mb-2 mt-auto">
            <CustomProgress
              min={0}
              value={received}
              max={dealAmount}
              fillColor="#12B76A"
            />
          </div>
          <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 mt-1 xl:mt-2 mb-3 xl:mb-5 truncate">
            {t("cards.received")}: {receivedPercent}%
          </div>

          <div className="flex text-mini xl:text-xs flex-wrap items-end gap-1 xl:gap-2">
            <span className="font-normal text-gray-ucode-500 whitespace-nowrap">
              {t("cards.weOwe")}
            </span>
            <p className="truncate">
              <span className="font-medium text-[#344054]">
                {formatAmount(clientDebt)}{" "}
              </span>
              <span>{GlobalCurrency?.name}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Shipments */}
        <div className="bg-white rounded-xl p-4 xl:p-6 flex flex-col shadow-[0_8px_18px_rgba(118,164,172,0.1)] overflow-hidden">
          <div className="flex items-center justify-between mb-2 xl:mb-4">
            <span className="font-semibold text-sm xl:text-base text-gray-ucode-800 truncate pr-2">
              Поставки
            </span>
            {paymentPermission && (
              <button
                onClick={() => {
                  setIsReturnMode(false);
                  setShowShipmentModal(true);
                }}
                className="bg-transparent border-none cursor-pointer p-0 flex items-center justify-center transition-opacity hover:opacity-70 shrink-0"
              >
                <div className="scale-75 xl:scale-100 origin-right transition-transform">
                  <ShipmentPlusIcon />
                </div>
              </button>
            )}
          </div>

          <div className="flex items-center xl:items-start text-lg gap-2 xl:gap-3 mb-3 xl:mb-5">
            <div className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-lg xl:rounded-[10px] bg-[#F2F4F7] flex items-center justify-center shrink-0">
              <div className="scale-75 xl:scale-100">
                <SupplyTruckIcon />
              </div>
            </div>

            <div className="flex flex-col gap-0 min-w-0">
              <div className="font-semibold text-sm xl:text-lg text-gray-ucode-800 truncate">
                {formatAmount(shipped)} {GlobalCurrency?.name}
              </div>
              <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 truncate">
                {t("cards.from")} {formatAmount(dealAmount)}{" "}
                {GlobalCurrency?.name}
              </div>
            </div>
          </div>

          <div className="w-full h-1.5 xl:h-2 bg-[#F2F4F7] rounded-md overflow-hidden mb-1 xl:mb-2 mt-auto">
            <CustomProgress
              min={0}
              value={shipped}
              max={dealAmount}
              fillColor="#12B76A"
            />
          </div>
          <div className="font-normal text-mini xl:text-xs text-gray-ucode-500 mt-1 xl:mt-2 mb-3 xl:mb-5 truncate">
            {t("cards.shipped")}: {shippedPercent}%
          </div>

          {shippedPercent < 100 && (
            <div className="flex text-mini xl:text-xs gap-1 xl:gap-2 flex-wrap items-end">
              <span className="font-normal text-gray-ucode-500 whitespace-nowrap">
                {t("cards.supplierOwes")}
              </span>
              <span className="font-medium text-[#344054] truncate">
                {formatAmount(remainingShipment)} {GlobalCurrency?.name}
              </span>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="col-span-2 bg-white rounded-xl shadow-[0_10px_10px_rgba(118,164,172,0.1)]">
          <div className="flex flex-col sticky top-16 z-10  ">
            <div className="flex  border-b h-16 border-neutral-100 rounded-t-xl  mb-0">
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${
                  activeTab === "products"
                    ? "text-neutral-900 border-neutral-900 font-bold"
                    : "text-neutral-400 border-transparent"
                }`}
                onClick={() => setActiveTab("products")}
              >
                {t("tabs.products")}
              </button>
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${
                  activeTab === "payments"
                    ? "text-neutral-900 border-neutral-900 font-bold"
                    : "text-neutral-400 border-transparent"
                }`}
                onClick={() => setActiveTab("payments")}
              >
                Выплаты
              </button>
              <button
                className={`font-semibold text-mini xl:text-xs px-3 xl:px-5 py-3 xl:py-4 cursor-pointer uppercase border-b-2 bg-transparent border-none relative transition-all hover:text-neutral-800 truncate ${
                  activeTab === "supplies"
                    ? "text-neutral-900 border-neutral-900 font-bold"
                    : "text-neutral-400 border-transparent"
                }`}
                onClick={() => setActiveTab("supplies")}
              >
                Поставки
              </button>
            </div>
            {/* Tab Content */}
            <div className="p-2  rounded-b-xl">
              <div className={styles.sectionHeader}>
                <div
                  className={`${styles.sectionTitle} text-xs xl:text-sm pr-2 truncate`}
                >
                  {activeTab === "products" && t("tabDescriptions.products")}
                  {activeTab === "payments" && t("tabDescriptions.expenses")}
                  {activeTab === "supplies" && t("tabDescriptions.supplies")}
                </div>
                <div className={styles.searchContainer}>
                  <Input
                    leftIcon={
                      <Search size={16} className="xl:w-[18px] xl:h-[18px]" />
                    }
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className={` w-[240px] xl:w-[200px] text-xs xl:text-sm`}
                  />
                  {(activeTab === "products" && productsPermission) ||
                  (activeTab === "payments" && paymentPermission) ||
                  (activeTab === "supplies" && shipmentPermission) ? (
                    activeTab === "supplies" ? (
                      hasProducts === false ? null : appStore.warehouseActive && appStore.returnActive ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="primary-btn  text-xs xl:text-sm px-3 xl:px-4 py-2 xl:py-2.5 whitespace-nowrap shrink-0">
                            {t("addButton")}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-52 rounded-md overflow-hidden p-0 border border-gray-50! ring ring-neutral-100 bg-white shadow-md mt-1"
                          align="end"
                        >
                          <div className="flex flex-col">
                            <button
                              className="flex items-center gap-2 p-2.5 text-sm text-neutral-800 hover:bg-neutral-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                              onClick={() => {
                                setIsReturnMode(false);
                                setShowShipmentModal(true);
                              }}
                            >
                              <Plus size={16} className="text-neutral-600" />
                              <span>{tp("createSupply.titleNew")}</span>
                            </button>
                            {appStore.warehouseActive &&
                              appStore.returnActive && (
                                <button
                                  className="flex items-center gap-2 p-2.5 text-sm text-neutral-800 hover:bg-neutral-50 cursor-pointer w-full text-left border-none outline-none bg-transparent"
                                  onClick={() => {
                                    setIsReturnMode(true);
                                    setShowShipmentModal(true);
                                  }}
                                >
                                  <Undo2
                                    size={16}
                                    className="text-neutral-600"
                                  />
                                  <span>{t("newReturnButton")}</span>
                                </button>
                              )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      ) : (
                        <button
                          className="primary-btn  text-xs xl:text-sm px-3 xl:px-4 py-2 xl:py-2.5 whitespace-nowrap shrink-0"
                          onClick={() => {
                            setIsReturnMode(false);
                            setShowShipmentModal(true);
                          }}
                        >
                          {t("addButton")}
                        </button>
                      )
                    ) : (
                      <button
                        className="primary-btn  text-xs xl:text-sm px-3 xl:px-4 py-2 xl:py-2.5 whitespace-nowrap shrink-0"
                        onClick={() => {
                          if (activeTab === "payments") {
                            handleCreateOperation();
                          } else if (activeTab === "products") {
                            setShowProductModal(true);
                          }
                        }}
                      >
                        {t("addButton")}
                      </button>
                    )
                  ) : null}
                </div>
              </div>
              <div className="overflow-hidden">
                {activeTab === "products" && (
                  <ProductServiceTable
                    canAdd={productsPermission}
                    handleSelect={handleSelectProduct}
                    sellingDealId={dealId}
                    onAdd={() => setShowProductModal(true)}
                    onShowOperations={() => setActiveTab("supplies")}
                    dealIdField="purchase_transactions_id"
                    invalidateKeys={["get_purchase_transaction_by_guid"]}
                  />
                )}

                {activeTab === "payments" && (
                  <ExpenseOperationsTable
                    canAdd={paymentPermission}
                    canEdit={paymentCanEdit}
                    canDelete={paymentCanDelete}
                    type="Выплата"
                    sellingDealId={dealId}
                    onAdd={handleCreateOperation}
                    dealIdField="purchase_transactions_id"
                    invalidateKeys={["get_purchase_transaction_by_guid"]}
                    isPurchase
                  />
                )}

                {activeTab === "supplies" && (
                  <ShipmenTable
                    canAdd={shipmentPermission}
                    dealGuid={dealId}
                    dealName={summeryCards?.name}
                    onAdd={() => setShowShipmentModal(true)}
                    onAddProducts={() => setActiveTab("products")}
                    hasProducts={hasProducts}
                    listMethod="list_purchase_operations"
                    dealIdField="purchase_transactions_id"
                    deleteMethod="delete_supply_transaction"
                    createMethod="create_supply_transaction"
                    updateMethod="update_supply_transaction"
                    getMethod="get_supply_transaction"
                    operationType={["Поставка"]}
                    invalidateKeys={[
                      "list_purchase_operations",
                      "get_purchase_transaction_by_guid",
                    ]}
                    listTab={null}
                    allowedTypes={["Расходы", "Актив", "Обязательства"]}
                    isPurchase
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 h-full max-h-[600px]">
          <CommentChat dealGuid={dealId} variant="purchase" />
        </div>
      </div>
      <CreateShipment
        open={showShipmentModal}
        onClose={() => {
          setShowShipmentModal(false);
          setIsReturnMode(false);
        }}
        dealName={summeryCards?.name}
        dealGuid={dealId}
        kontragentId={summeryCards?.counterparties_id}
        createMethod="create_supply_transaction"
        updateMethod="update_supply_transaction"
        getMethod="get_supply_transaction"
        dealIdField="purchase_transactions_id"
        operationType={["Поставка"]}
        invalidateKeys={[
          "list_purchase_operations",
          "get_purchase_transaction_by_guid",
        ]}
        allowedTypes={["Расходы", "Актив", "Обязательства"]}
        isPurchase
        isReturn={isReturnMode}
      />

      <PaymentModal
        open={openPayment}
        onClose={() => setOpenPayment(false)}
        dealId={dealId}
      />

      {showOperationModal && (
        <OperationModal
          operation={operation}
          isClosing={isModalClosing}
          isOpening={isModalOpening}
          defaultPurchaseDealGuid={dealId}
          onClose={() => {
            setIsModalClosing(true);
            setTimeout(() => {
              setShowOperationModal(false);
              setIsModalClosing(false);
            }, 300);
          }}
          preselectedCounterparty={summeryCards?.counterparties_id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["get_purchase_transaction_by_guid"] })
            queryClient.invalidateQueries({ queryKey: ["list_operations_by_query"] })
            queryClient.invalidateQueries({ queryKey: ["get_operations_total_income"] })
            queryClient.invalidateQueries({ queryKey: ["get_operations_total_expense"] })
            setShowOperationModal(false)
          }}
          initialTab={activeTab === "payments" ? "payment" : "income"}
        />
      )}

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
        dealIdField="purchase_transactions_id"
        invalidateKeys={["get_purchase_transaction_by_guid"]}
      />

      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        initialData={dealToEdit}
        isEditing={true}
        createMethod="create_purchase_transaction"
        updateMethod="update_purchase_transaction"
        invalidateKeys={[
          "get_purchase_list",
          "get_purchase_transaction_by_guid",
        ]}
        redirectBase="/deals/purchase"
        isPurchase
      />

      <DeleteDealModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeletingDeal}
        deal={
          dealToDelete
            ? {
                name: summeryCards?.name,
                client: summeryCards?.counterparty_name,
                amount: formatAmount(summeryCards?.products_amount),
              }
            : null
        }
      />
    </FixedContent>
  );
});
