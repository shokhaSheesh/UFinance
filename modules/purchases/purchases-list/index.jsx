"use client";

import FilterButton from "@/components/shared/Filters/FilterButton";
import Input from "@/components/shared/Input";
import TableCard from "@/components/shared/Table/TableCard";
import TableToolbar from "@/components/shared/Table/TableToolbar";
import { Search } from "lucide-react";
import { useScrollDetector } from "@/hooks/useScrollDetector";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useRouter } from "@/hooks/useAppRouter";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import {
  useUcodeRequestInfinite,
  useUcodeRequestMutation,
} from "@/hooks/useDashboard";
import useMounted from "@/hooks/useMounted";
import { apiClient } from "@/lib/api/ucode/base";
import { cn } from "@/lib/utils";
import { showSuccessNotification } from "@/lib/utils/notifications";
import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";
import { sealDeal } from "@/store/saleDeal.store";
import { formatAmount, handleDownload, StringtoNumber } from "@/utils/helpers";

import KpiCard from "@/components/shared/KpiCard/KpiCard";
import ScreenLoader from "@/components/shared/ScreenLoader";
import Segmented from "@/components/shared/Segmented/Segmented";
import { GlobalCurrency } from "@/constants/globalCurrency";
import { Banknote, FileText, Percent, TrendingUp } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";
import { useUcodeDefaultApiQuery } from "@/hooks/useDashboard";
import { isObjectInUseError } from "@/lib/api/ucode/errors";
import { showErrorNotification } from "@/lib/utils/notifications";
import FixedContent from "@/layouts/FixedContent";
import { toJS } from "mobx";
import moment from "moment";
import PurchasesHeader from "../components/PurchasesHeader";
import PurchasesTable from "../components/PurchasesTable";
import { usePurchasesActions } from "../hooks/usePurchasesActions";
import { usePurchasesSelection } from "../hooks/usePurchasesSelection";

export function formatPurchases(rawDeals = [], t) {
  return rawDeals.map((deal) => ({
    ...deal,
    guid: deal.guid,
    data_nachala: deal.purchase_date || deal.deal_date,
    nazvanie: deal.name,
    Data_sdelki: deal.purchase_date || deal.deal_date,
    Nazvanie: deal.name,
    partner_name: deal.counterparty_name || "-",
    kontragent: { nazvanie: deal.counterparty_name || "-" },
    status:
      deal.sales_status_name ||
      deal.sales_status_id?.[0] ||
      deal.Status?.[0] ||
      t("statusNew"),
    color: deal.sales_status_color || null,
    summa_sdelki: deal?.deal_amount || deal?.total_products_summa || 0,
    postupilo:
      deal?.paid_percent != null
        ? `${Math.round(deal.paid_percent)}%`
        : deal?.receipts_percentage
        ? `${Math.round(deal.receipts_percentage)}%`
        : "0%",
    otgruzheno:
      deal?.supply_percent != null
        ? `${Math.round(deal.supply_percent)}%`
        : deal?.shipments_percentage
        ? `${Math.round(deal.shipments_percentage)}%`
        : "0%",
    pribyl: deal?.profit,
    comment: deal?.commentary || deal?.Kommentariy,
  }));
}

// ─── Lazy-loaded heavy modals ────────────────────────────────────────────────
const FilterSidebar = lazy(() => import("@/components/deals/FilterSidebar"));
const CreateDealModal = lazy(() =>
  import("@/components/deals/CreateDealModal/CreateDealModal").then((m) => ({
    default: m.CreateDealModal,
  }))
);
const DeleteDealModal = lazy(() =>
  import("@/components/deals/DeleteDealModal/DeleteDealModal").then((m) => ({
    default: m.DeleteDealModal,
  }))
);

// ─── Modal Fallback ──────────────────────────────────────────────────────────
const ModalFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
    <div className="bg-white rounded-lg p-6 shadow-xl">
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default observer(function PurchasesPage() {
  const router = useRouter();
  const t = useTranslations("Deals");
  const tErrors = useTranslations("Errors");
  const mounted = useMounted();
  const queryClient = useQueryClient();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [dealToEdit, setDealToEdit] = useState(null);
  const [dealToCopy, setDealToCopy] = useState(null);

  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000);

  const dealPermission = appStore.permission.deals.purchases || appStore.permission.deals;

  // ── Store state ────────────────────────────────────────────────────────────
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
    setState,
  } = sealDeal;

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleSearch = (value) => {
    setState("search", value || null);
  };

  const dateRanges = toJS(dateRange);
  // ── Filters ────────────────────────────────────────────────────────────────
  const dealsFilters = useMemo(
    () => ({
      limit: 50,
      search: searchValue,
      from_date: dateRanges?.start
        ? moment(dateRanges?.start).format("YYYY-MM-DD")
        : null,
      to_date: dateRanges?.end
        ? moment(dateRanges?.end).format("YYYY-MM-DD")
        : null,
      amount_from: StringtoNumber(amountFrom) || null,
      amount_to: StringtoNumber(amountTo) || null,
      profit_from: StringtoNumber(profitFrom) || null,
      profit_to: StringtoNumber(profitTo) || null,
      counterparty_ids:
        selectedCounterparties?.length > 0 ? selectedCounterparties : null,
      status: status?.length > 0 ? status : null,
      accounting_method:
        dealsMethod === "accrual_method"
          ? t("methods.accrual")
          : t("methods.cash"),
      isCalculation: false,
      branch_id: authStore.branch_id,
    }),
    [
      searchValue,
      dateRanges,
      amountFrom,
      amountTo,
      profitFrom,
      profitTo,
      selectedCounterparties,
      status,
      dealsMethod,
      t,
      authStore.branch_id,
    ]
  );

  // Outer debounce: delays actual request (1 second)
  const [requestOperationFilters, setRequestOperationFilters] =
    useState(dealsFilters);

  useEffect(() => {
    const timer = setTimeout(
      () => setRequestOperationFilters(dealsFilters),
      1000
    );
    return () => clearTimeout(timer);
  }, [dealsFilters]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useUcodeRequestInfinite({
    method: "get_purchase_list",
    data: requestOperationFilters,
    querySetting: { staleTime: 0, cacheTime: 0 },
  });

  const allDeals = useMemo(
    () => infiniteData?.pages?.flatMap((p) => p?.data?.data || []) || [],
    [infiniteData]
  );

  const summary = useMemo(
    () => infiniteData?.pages?.[0]?.data?.summary,
    [infiniteData]
  );

  const formattedDeals = useMemo(
    () => formatPurchases(allDeals, t),
    [allDeals, t]
  );

  const totalProfit =
    dealsMethod === "accrual_method"
      ? summary?.accrual_profit
      : summary?.cash_profit;

  // Статусы — тот же запрос, что в окне фильтров (общий кэш)
  const { data: statusList } = useUcodeDefaultApiQuery({
    queryKey: 'sales_status',
    urlMethod: 'GET',
    urlParams: '/items/sales_status?from-ofs=true',
    data: {},
    querySetting: {
      select: response => response?.data?.data?.response,
      staleTime: 1000 * 60 * 60,
      placeholder: keepPreviousData,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  // ── Export ─────────────────────────────────────────────────────────────────
  const { mutate: exportDeals, isPending: isDealsExportLoading } = useMutation({
    mutationKey: ["export_purchases"],
    mutationFn: () =>
      apiClient.invokeFunction({ method: "export_deals", data: dealsFilters }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t("fileDownloaded"));
      const link = uploadData?.data?.link;
      if (link)
        handleDownload(`https://cdn.u-code.io/${link}`, "balance_report.xlsx");
    },
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
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
        // Бэк отвечает 200 с телом-ошибкой, поэтому проверяем и успешный ответ
        onSuccess: (result) => {
          if (isObjectInUseError(result)) {
            showErrorNotification(tErrors("cannotDelete.deal"));
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["get_purchase_list"] });
          removeSelected(dealToDelete.guid);
          setDealToDelete(null);
        },
        onError: (error) => {
          if (isObjectInUseError(error))
            showErrorNotification(tErrors("cannotDelete.deal"));
        },
      }
    );
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const { removeSelected } = usePurchasesSelection(formattedDeals);

  // ── Row actions ────────────────────────────────────────────────────────────
  const {
    handleRowClick,
    handleDeleteClick,
    handleEditClick,
    handleCopyClick,
  } = usePurchasesActions({
    router,
    dealPermission,
    setDealToDelete,
    setDealToEdit,
    setDealToCopy,
    setIsCreateModalOpen,
  });

  // ── Modal closers ──────────────────────────────────────────────────────────
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setDealToEdit(null);
    setDealToCopy(null);
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!mounted) return null;

  const methodOptions = [
    { value: "accrual_method", label: t("methods.accrual") },
    { value: "cash_method", label: t("methods.cash") },
  ];

  // Итоги — те же цифры, что были в полосе внизу, плюс рентабельность
  const totalSum = Number(summary?.total_deal_amount ?? summary?.total_deals_sum) || 0;
  const profitValue = Number(totalProfit) || 0;
  const margin = totalSum ? Math.round((profitValue / totalSum) * 1000) / 10 : 0;
  const purchasesCount = summary?.total ?? summary?.count ?? 0;
  const kpis = [
    { key: 'sum', label: t('kpi.sum'), value: totalSum, currency: GlobalCurrency?.name, hint: t('kpi.sumHint'), icon: Banknote },
    {
      key: 'profit',
      label: t('kpi.profit'),
      value: profitValue,
      currency: GlobalCurrency?.name,
      hint: dealsMethod === 'accrual_method' ? t('methods.accrual') : t('methods.cash'),
      icon: TrendingUp,
      tone: 'signed',
    },
    { key: 'margin', label: t('kpi.margin'), value: margin, currency: '%', hint: t('kpi.marginHint'), icon: Percent, tone: 'signed' },
    // Количество — последней карточкой, как на странице сделок
    { key: 'count', label: t('kpi.count'), value: purchasesCount, hint: t('kpi.countHint'), icon: FileText },
  ];

  // Быстрый фильтр по статусу — вкладками над таблицей
  const activeStatus = status?.length === 1 ? status[0] : status?.length ? null : 'all';
  const statusTabs = [
    { value: 'all', label: t('statusAll') },
    ...(statusList || []).map(item => ({ value: item.guid, label: item.name, color: item.color })),
  ];

  return (
    <FixedContent>
      {/* ── Filter Sidebar (lazy) ── */}
      <Suspense
        fallback={
          <div className="w-[240px] bg-neutral-50 border-r border-neutral-200 animate-pulse" />
        }
      >
        <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} isPurchase />
      </Suspense>

      {/* ── Main content ── */}
      <main
        id="scrollableDiv"
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full relative overflow-auto scroll-smooth bg-canvas px-6 pb-10"
      >
        <PurchasesHeader
          t={t}
          dealPermission={dealPermission}
          isDealsExportLoading={isDealsExportLoading}
          onExport={exportDeals}
          onCreateDeal={() => setIsCreateModalOpen(true)}
          count={purchasesCount}
        />

        {/* Метод учёта — от него зависят прибыль и рентабельность */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm text-slate-500">{t('methodLabel')}</span>
          <Segmented
            ariaLabel={t('methodLabel')}
            options={methodOptions}
            value={dealsMethod}
            onChange={(v) => setState('dealsMethod', v)}
          />
        </div>

        <div className="mb-4 grid grid-cols-4 gap-3">
          {kpis.map(({ key, ...kpi }) => (
            <KpiCard key={key} {...kpi} />
          ))}
        </div>

        <TableCard className="min-w-fit overflow-visible">
          {/* Поиск и фильтры — в панели над таблицей */}
          <TableToolbar
            search={
              <div className="w-full max-w-[420px]">
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search size={18} />}
                />
              </div>
            }
            actions={<FilterButton onClick={() => setIsFilterOpen(true)} />}
            className="rounded-t-xl"
          />

          {/* Вкладки статусов */}
          {statusTabs.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3" role="tablist">
              {statusTabs.map(tab => {
                const active = activeStatus === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setState('status', tab.value === 'all' ? [] : [tab.value])}
                    className={cn(
                      '-mb-px flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium cursor-pointer transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0e73f6]',
                      active ? 'border-[#0e73f6] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
                    )}
                  >
                    {tab.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

        <PurchasesTable
          t={t}
          formattedDeals={formattedDeals}
          dealPermission={dealPermission}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          fetchNextPage={fetchNextPage}
          onRowClick={handleRowClick}
          onDeleteClick={handleDeleteClick}
          onEditClick={handleEditClick}
          onCopyClick={handleCopyClick}
        />
        </TableCard>
        {/* Loaders */}
        {isLoading && formattedDeals.length === 0 && (
          <ScreenLoader className="left-0!" />
        )}
        {(isFetchingNextPage || isFetching) && !isScrolling && (
          <ScreenLoader className="left-0!" />
        )}
      </main>

      {/* ── Lazy Modals ── */}
      <Suspense fallback={isCreateModalOpen ? <ModalFallback /> : null}>
        <CreateDealModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          initialData={dealToEdit || dealToCopy}
          isEditing={!!dealToEdit}
          createMethod="create_purchase_transaction"
          updateMethod="update_purchase_transaction"
          invalidateKeys={[
            "get_purchase_list",
            "get_purchase_transaction_by_guid",
          ]}
          redirectBase="/purchases"
          isPurchase
        />
      </Suspense>

      <Suspense fallback={dealToDelete ? <ModalFallback /> : null}>
        <DeleteDealModal
          isOpen={!!dealToDelete}
          onClose={() => setDealToDelete(null)}
          onConfirm={confirmDelete}
          isDeleting={isDeletingDeal}
          deal={
            dealToDelete
              ? {
                  name:
                    dealToDelete.nazvanie || dealToDelete.guid?.substring(0, 8),
                  client: dealToDelete.kontragent?.nazvanie,
                  amount: formatAmount(dealToDelete.summa_sdelki),
                }
              : null
          }
        />
      </Suspense>
    </FixedContent>
  );
});
