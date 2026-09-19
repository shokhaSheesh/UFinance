"use client";

import { useScrollDetector } from "@/hooks/useScrollDetector";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import {
  useDeleteOperation,
  useUcodeRequestInfinite,
  useUcodeRequestMutation,
} from "@/hooks/useDashboard";
import useMounted from "@/hooks/useMounted";
import { apiClient } from "@/lib/api/ucode/base";
import operationsDto from "@/lib/dtos/operationsDto";
import { showSuccessNotification } from "@/lib/utils/notifications";
import { appStore } from "@/store/app.store";
import { operationFilterStore } from "@/store/operationFilter.store";
import { handleDownload } from "@/utils/helpers";
import { applyCopyDates } from "@/utils/operationCopy";
import { refetchInfinitePagesAfter } from "@/utils/infiniteQuery";

// Eager (critical for initial render)
import ScreenLoader from "@/components/shared/ScreenLoader";

// Sub-components (split out for clarity)
import FixedContent from "@/layouts/FixedContent";
import operationDto from "@/lib/dtos/operationDto";
import ImportErrorModal from "../components/ImportErrorModal";
import { Search } from "lucide-react";
import FilterButton from "@/components/shared/Filters/FilterButton";
import FilterChips from "@/components/shared/Filters/FilterChips";
import Input from "@/components/shared/Input";
import TableCard from "@/components/shared/Table/TableCard";
import TableToolbar from "@/components/shared/Table/TableToolbar";
import OperationsHeader from "../components/OperationsHeader";
import OperationsTableHeader from "../components/OperationsTableHeader";
import { useImportOperations } from "../hooks/useImportOperations";
import { useOperationsFilters } from "../hooks/useOperationsFilters";
import { useShipmentActions } from "../hooks/useShipmentActions";
import { buildFlatItems } from "../utils/operationsUtils";
import { useOperationFilterChips } from "./useOperationFilterChips";

// ── Lazy modals / heavy components ──────────────────────────────────────────
const CreateShipment = lazy(() =>
  import("@/components/deals/details/CreatingShipment").then((m) => ({
    default: m.default || m.CreateShipment || m,
  }))
);
const OperationModal = lazy(() =>
  import("@/components/operations/OperationModal/OperationModal").then((m) => ({
    default: m.default || m.OperationModal || m,
  }))
);
const OperationsFiltersSidebar = lazy(() =>
  import(
    "@/components/operations/OperationsFiltersSidebar/OperationsFiltersSidebar"
  ).then((m) => ({ default: m.default || m.OperationsFiltersSidebar || m }))
);
const DeleteConfirmModal = lazy(() =>
  import("@/components/operations/OperationsTable/DeleteConfirmModal").then(
    (m) => ({ default: m.default || m.DeleteConfirmModal || m })
  )
);
const OperationTableRow = lazy(() =>
  import("@/components/operations/TableRow/new").then((m) => ({
    default: m.default || m,
  }))
);
const CustomDialog = lazy(() =>
  import("@/components/shared/CustomDialog").then((m) => ({
    default: m.default || m.CustomDialog || m,
  }))
);
const OperationsFooter = lazy(() =>
  import("@/components/operations/OperationsFooter/OperationsFooter").then(
    (m) => ({ default: m.default || m.OperationsFooter || m })
  )
);

// ── Main page ────────────────────────────────────────────────────────────────
const OperationsListPage = observer(() => {
  const t = useTranslations("Operations");
  const isMounted = useMounted();
  const queryClient = useQueryClient();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isModalOpening, setIsModalOpening] = useState(false);

  // ── Delete state ───────────────────────────────────────────────────────────
  const [operationToDelete, setOperationToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShipmentDeleting, setIsShipmentDeleting] = useState(false);

  // ── Shipment state ─────────────────────────────────────────────────────────
  const {
    showShipmentModal,
    selectedShipment,
    isShipmentEditing,
    isShipmentCopying,
    handleEditShipment,
    handleCopyShipment,
    closeShipmentModal,
    handleDeleteShipment: _handleDeleteShipment,
  } = useShipmentActions({
    setOperationToDelete,
    setIsShipmentDeleting,
    setIsDeleteModalOpen,
  });

  // ── Permissions ────────────────────────────────────────────────────────────
  const operationPermissions = appStore.permission.operations;
  const canAdd =
    operationPermissions.income.add ||
    operationPermissions.payout.add ||
    operationPermissions.transfer.add ||
    operationPermissions.accrual.add ||
    operationPermissions.shipment.add ||
    operationPermissions.supply.add;

  // ── Filters & debounced request filters ───────────────────────────────────
  const { requestOperationFilters } = useOperationsFilters(t);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingOperations,
    isLoading: isLoadingOperations,
  } = useUcodeRequestInfinite({
    method: "list_operations_by_query",
    data: requestOperationFilters,
    querySetting: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60,
      placeholderData: keepPreviousData,
    },
  });

  const { data: operationsTotal } = useQuery({
    queryKey: ["get_operations_total", requestOperationFilters],
    queryFn: () =>
      apiClient.invokeFunction({
        method: "summary_operations",
        data: requestOperationFilters,
      }),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60,
    placeholderData: keepPreviousData,
    select: (response) => response?.data?.data,
  });

  const allOperations = useMemo(
    () => infiniteData?.pages?.flatMap((p) => p?.data?.data || []) || [],
    [infiniteData]
  );

  const totalSummary = useMemo(() => operationsTotal, [operationsTotal]);

  const currentPage = useMemo(
    () => infiniteData?.pageParams?.length,
    [infiniteData]
  );

  // --- Get single operation --------------------------------------------------

  const { mutateAsync: getOperation, isPending: isPendingGetOperation } =
    useMutation({
      mutationKey: ["get_operation"],
      mutationFn: (data) =>
        apiClient.invokeFunction({ method: "get_operation", data }),
    });

  // const { mutateAsync: getShipment, isPending: isPendingGetShipment } = useMutation({
  //   mutationKey: ['get_shipment_transaction'],
  //   mutationFn: (data) => apiClient.invokeFunction({ method: 'get_shipment_transaction', data })
  // })

  // ── Safe pagination ────────────────────────────────────────────────────────

  // ── Export ─────────────────────────────────────────────────────────────────
  const { mutate: exportOperations, isPending: isExporting } = useMutation({
    mutationKey: ["export_operations"],
    mutationFn: () =>
      apiClient.invokeFunction({
        method: "export_operations",
        data: requestOperationFilters,
      }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t("page.fileDownloaded"));
      const link = uploadData?.data?.link;
      if (link)
        handleDownload(`https://cdn.u-code.io/${link}`, "operations.xlsx");
    },
  });

  // ── Import ─────────────────────────────────────────────────────────────────
  const {
    isImporting,
    importErrorModalOpen,
    setImportErrorModalOpen,
    importErrorData,
    handleImportOperations,
  } = useImportOperations({ t, queryClient });

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openWithAnimation = (cb) => {
    setIsModalClosing(false);
    setIsModalOpening(true);
    cb();
    setTimeout(() => setIsModalOpening(false), 50);
  };

  const closeOperationModal = () => {
    setIsModalClosing(true);
    document.body.style.overflow = "auto";
    setTimeout(() => {
      setOpenModal(null);
      setIsModalClosing(false);
    }, 300);
  };

  const resolveModalType = (typeCategory) => {
    if (typeCategory === "transfer") return "transfer";
    if (typeCategory === "payment") return "payment";
    if (typeCategory === "income") return "income";
    return "accrual";
  };

  // ── Operation actions ──────────────────────────────────────────────────────
  const openOperationModal = (operation) => {
    const { tip, operationType } = operation;
    const canEdit =
      (operationPermissions.income.edit && tip === "Поступление") ||
      (operationPermissions.payout.edit && tip === "Выплата") ||
      (operationPermissions.transfer.edit && tip === "Перемещение") ||
      (operationPermissions.accrual.edit && tip === "Начисление") ||
      (operationPermissions.shipment.edit && tip === "Отгрузка") ||
      (operationPermissions.shipment.edit && tip === "Поставка");

    if (!canEdit) return;
    if (tip === "Отгрузка" || tip === "Поставка") {
      handleEditShipment(operation);
      return;
    }

    openWithAnimation(() => {
      setModalType(resolveModalType(operationType));
      setOpenModal(operation);
    });
  };

  const handleEditOperation = async (operation) => {
    const fullOpertionData = await getOperation({ guid: operation?.guid });
    const operatoinFullData = operationDto(fullOpertionData?.data?.data);

    if (
      operatoinFullData.tip === "Отгрузка" ||
      operatoinFullData.tip === "Поставка"
    ) {
      handleEditShipment(operatoinFullData);
      return;
    }
    const typeMap = {
      transfer: "transfer",
      pyment: "payment",
      income: "income",
      accrual: "accrual",
    };
    setModalType(typeMap[operatoinFullData.operationType] || "income");
    openOperationModal(operatoinFullData);
    setOpenModal({ ...operatoinFullData, isNew: false });
  };

  const handleDeleteOperation = (operation) => {
    if (operation.tip === "Отгрузка") {
      _handleDeleteShipment(operation);
      return;
    }
    setOperationToDelete(operation);
    setIsDeleteModalOpen(true);
  };

  const handleCopyOperation = async (operation) => {
    if (operation.tip === "Отгрузка" || operation.tip === "Поставка") {
      handleCopyShipment(operation);
      return;
    }

    const fullOpertionData = await getOperation({ guid: operation?.guid });
    const operatoinFullData = operationDto(fullOpertionData?.data?.data);
    // Open modal as "new" but with the copied operation's data

    const { operationType } = operatoinFullData;
    const copy = applyCopyDates({ ...operatoinFullData });

    openWithAnimation(() => {
      setModalType(resolveModalType(operationType));
      setOpenModal({ ...copy, id: "new", isNew: true, isCopy: true });
    });
  };

  const handleCreate = () => {
    // document.body.style.overflow = 'hidden'
    openWithAnimation(() => {
      setOpenModal({ id: "new", isNew: true });
      setModalType("income");
    });
  };

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const deleteOperationMutation = useDeleteOperation();
  const { mutateAsync: deleteShipmentMutation, isPending: isDeletingShipment } =
    useUcodeRequestMutation();

  const invalidateAfterDelete = () => {
    const keys = [
      "dashboard",
      "operationsList",
      "find_operations",
      "get_counterparty_by_id",
      "list_sales_operations",
      "get_sales_transaction",
      "myAccountsBoard",
      "legalEntitiesPlanFact",
      "get_my_accounts",
    ];
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  };

  const operationsQueryKey = useMemo(
    () => ["list_operations_by_query", requestOperationFilters],
    [requestOperationFilters]
  );

  // Вместо invalidateQueries (перезапрашивает все загруженные страницы подряд)
  // обновляем только страницу с удалённой операцией и следующую за ней.
  const refetchOperationsAfterDeleted = async (guid) => {
    try {
      const patched = await refetchInfinitePagesAfter({
        queryClient,
        queryKey: operationsQueryKey,
        method: "list_operations_by_query",
        data: requestOperationFilters,
        isTarget: (item) =>
          item?.guid === guid ||
          item?.operationParts?.some((child) => child?.guid === guid),
        lookahead: 1,
      });
      if (patched) return;
    } catch (err) {
      console.error("Error refetching operations pages:", err);
    }
    // Операция не найдена в кеше (или запрос упал) — обычная инвалидация
    queryClient.invalidateQueries({ queryKey: ["list_operations_by_query"] });
  };

  const handleDeleteConfirm = async () => {
    if (!operationToDelete) return;
    const guid = operationToDelete.rawData?.guid || operationToDelete.guid;
    if (!guid) return;

    try {
      if (isShipmentDeleting) {
        const isSupply = operationToDelete.tip === "Поставка";
        await deleteShipmentMutation({
          method: isSupply
            ? "delete_supply_transaction"
            : "delete_shipment_transaction",
          data: { guid },
        });
      } else {
        await deleteOperationMutation.mutateAsync([guid]);
      }
      setIsDeleteModalOpen(false);
      setOperationToDelete(null);
      setIsShipmentDeleting(false);
      invalidateAfterDelete();
      await refetchOperationsAfterDeleted(guid);
      queryClient.invalidateQueries({ queryKey: ["get_operations_total"] });
      queryClient.invalidateQueries({ queryKey: ["find_operations"] });
    } catch (err) {
      console.error("Error deleting operation:", err);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setOperationToDelete(null);
    setIsShipmentDeleting(false);
  };

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const operationsList = useMemo(
    () => ({
      future: operationsDto(allOperations, "future"),
      today: operationsDto(allOperations, "today"),
      before: operationsDto(allOperations, "before"),
    }),
    [allOperations]
  );

  const flatItems = useMemo(
    () => buildFlatItems(operationsList, t),
    [operationsList, t]
  );

  const { isScrolling, handleScroll, scrollRef } = useScrollDetector(2000);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (flatItems[i]?.type === "header" ? 36 : 56),
    overscan: 10,
  });

  // Активные фильтры: счётчик для кнопки и чипсы над таблицей
  const { chips: filterChips, count: filterCount } = useOperationFilterChips();

  const handleClearFilters = useCallback(() => {
    operationFilterStore.resetFilters();
    queryClient.invalidateQueries({ queryKey: ["find_operations"] });
  }, [queryClient]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <FixedContent>
      {isPendingGetOperation && <ScreenLoader />}
      {/* Sidebar */}
      <Suspense
        fallback={<div className="w-80 bg-white border-r border-neutral-200" />}
      >
        <OperationsFiltersSidebar
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </Suspense>

      {/* Main */}
      <div className="w-full flex flex-col min-h-0 px-4 pb-3">
        <OperationsHeader
          t={t}
          isMounted={isMounted}
          canAdd={canAdd}
          isImporting={isImporting}
          isExporting={isExporting}
          onCreate={handleCreate}
          onImport={handleImportOperations}
          onExport={() => exportOperations()}
        />

        <TableCard className="mb-12">
          {/* Поиск и фильтры — внутри рамки таблицы, над её шапкой */}
          <TableToolbar
            search={
              <Input
                type="text"
                leftIcon={<Search size={18} />}
                placeholder={t("page.searchPlaceholder")}
                value={operationFilterStore.searchQuery}
                className="w-full max-w-[420px]"
                onChange={(e) => operationFilterStore.setSearchQuery(e.target.value)}
              />
            }
            actions={<FilterButton onClick={() => setIsFilterOpen(true)} count={filterCount} />}
          />

          {/* Что сейчас отфильтровано — видно всегда, даже когда панель закрыта */}
          <FilterChips chips={filterChips} onClearAll={handleClearFilters} />

        <div
          id="scrollableDiv"
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-auto flex-1 min-h-0 w-full bg-white"
        >
          <OperationsTableHeader t={t} />

          {allOperations.length === 0 && !isLoadingOperations && (
            <div className="py-20 text-center text-neutral-500 bg-white">
              {t("page.noData")}
            </div>
          )}

          {/* Infinite + Virtual scroll */}
          <InfiniteScroll
            dataLength={allOperations.length}
            hasMore={hasNextPage}
            next={fetchNextPage}
            scrollThreshold={0.5}
            scrollableTarget="scrollableDiv"
          >
            <div
              style={{
                height: totalSize,
                position: "relative",
                paddingBottom: 10,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const item = flatItems[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {item.type === "header" ? (
                      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {item.label}
                        </h3>
                      </div>
                    ) : (
                      <Suspense
                        fallback={
                          <div className="h-14 bg-white border-b border-neutral-200 animate-pulse" />
                        }
                      >
                        <OperationTableRow
                          op={item.op}
                          openOperationModal={openOperationModal}
                          handleEditOperation={handleEditOperation}
                          handleDeleteOperation={handleDeleteOperation}
                          handleCopyOperation={handleCopyOperation}
                        />
                      </Suspense>
                    )}
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>

        </div>
        </TableCard>

        <Suspense fallback={null}>
          <OperationsFooter totalSummary={totalSummary} />
        </Suspense>
      </div>

      {/* Loaders */}
      {isLoadingOperations && allOperations.length === 0 && (
        <ScreenLoader className="left-0!" />
      )}
      {(isFetchingNextPage || isFetchingOperations) && !isScrolling && (
        <ScreenLoader className="left-0!" />
      )}

      {/* Operation modal */}
      {openModal && (
        <Suspense fallback={<ScreenLoader />}>
          <OperationModal
            operation={openModal}
            currentPage={currentPage}
            initialTab={modalType}
            isClosing={isModalClosing}
            isOpening={isModalOpening}
            onClose={closeOperationModal}
          />
        </Suspense>
      )}

      {/* Delete modal */}
      <Suspense fallback={null}>
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          operation={operationToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={
            isShipmentDeleting
              ? isDeletingShipment
              : deleteOperationMutation.isPending
          }
        />
      </Suspense>

      {/* Shipment modal */}
      {showShipmentModal && (
        <Suspense fallback={<ScreenLoader />}>
          <CreateShipment
            open={showShipmentModal}
            onClose={closeShipmentModal}
            initialData={selectedShipment}
            isEditing={!!selectedShipment}
            shipmentId={selectedShipment?.guid}
            isPurchase={selectedShipment?.tip === "Поставка"}
            createMethod={
              selectedShipment?.tip === "Поставка"
                ? "create_supply_transaction"
                : "create_shipment_transaction"
            }
            updateMethod={
              selectedShipment?.tip === "Поставка"
                ? "update_supply_transaction"
                : "update_shipment_transaction"
            }
            getMethod={
              selectedShipment?.tip === "Поставка"
                ? "get_supply_transaction"
                : "get_shipment_transaction"
            }
            dealIdField={
              selectedShipment?.tip === "Поставка"
                ? "purchase_transactions_id"
                : "sales_id"
            }
            operationType={
              selectedShipment?.tip === "Поставка" ? ["Поставка"] : ["Отгрузка"]
            }
            invalidateKeys={
              selectedShipment?.tip === "Поставка"
                ? [
                    "list_purchase_operations",
                    "get_purchase_transaction_by_guid",
                    "find_operations",
                  ]
                : [
                    "get_sales_transaction_by_guid",
                    "list_sales_operations",
                    "find_operations",
                  ]
            }
            allowedTypes={
              selectedShipment?.tip === "Поставка"
                ? ["Расходы", "Актив", "Обязательства"]
                : undefined
            }
            onSuccess={() => {
              closeShipmentModal();
              // Список операций страницы идёт по list_operations_by_query — без его
              // инвалидации таблица не обновлялась после апдейта поставки/отгрузки.
              queryClient.invalidateQueries({ queryKey: ["list_operations_by_query"] });
              queryClient.invalidateQueries({ queryKey: ["get_operations_total"] });
              queryClient.invalidateQueries({ queryKey: ["find_operations"] });
            }}
          />
        </Suspense>
      )}

      {/* Import error modal */}
      <Suspense fallback={null}>
        <ImportErrorModal
          t={t}
          isOpen={importErrorModalOpen}
          data={importErrorData}
          onClose={() => setImportErrorModalOpen(false)}
          CustomDialog={CustomDialog}
        />
      </Suspense>
    </FixedContent>
  );
});

export default OperationsListPage;
