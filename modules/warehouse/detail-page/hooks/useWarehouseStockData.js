import { useUcodeRequestQuery } from "@/hooks/useDashboard";
import { useEffect, useMemo, useState } from "react";

const LIMIT = 50;

/**
 * Data hook for a single warehouse's stock table.
 * Fetches stock balances via `list_stock_balances`, scoped to `warehouseId`,
 * with server-side pagination + search. `branch_id` is injected automatically
 * by the API client.
 *
 * Остаток = Ожидание (waiting_quantity) + Доступно (quantity)
 */
export function useWarehouseStockData(warehouseId) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search input before hitting the API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Typing a new search always sends the pager back to the first page
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useUcodeRequestQuery({
    queryKey: "list_stock_balances",
    method: "list_stock_balances",
    data: { warehouse_id: warehouseId, page, limit: LIMIT, search: debouncedSearch },
    skip: !warehouseId,
    querySetting: {
      select: (res) => res?.data,
      placeholderData: (prev) => prev,
    },
  });

  const items = useMemo(() => {
    const rows = data?.data || [];
    return rows.map((it) => {
      const waiting = Number(it?.waiting_quantity) || 0;
      const available = Number(it?.quantity) || 0;
      return {
        guid: it?.guid,
        name: it?.product_name || "—",
        artikul: it?.artikul || "",
        waiting,
        available,
        balance: waiting + available,
        unit: it?.unit_short_name || "",
        daysInStock: Number(it?.days_since_update) || 0,
        averageCost: Number(it?.average_cost) || 0,
        totalCost: Number(it?.total_cost) || 0,
        salePrice: Number(it?.sale_price) || 0,
        saleTotal: Number(it?.total_sale_price) || 0,
      };
    });
  }, [data]);

  const pagination = data?.pagenation || {};
  const total = Number(pagination.total ?? items.length) || 0;
  const totalPages = Math.max(1, Number(pagination.totalPages ?? 1) || 1);

  const totals = useMemo(() => {
    const summary = data?.summary || {};
    const waiting = Number(summary.waiting_quantity) || 0;
    const available = Number(summary.total_quantity) || 0;
    return {
      positions: total, // Позиций
      waiting, // Остаток ожидание
      available, // Остаток доступно
      balance: waiting + available, // Общий остаток
      totalCost: Number(summary.total_cost) || 0, // Сумма себестоимости
      totalSale: Number(summary.total_sale_price) || 0, // Сумма продажи
    };
  }, [data, total]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    page,
    setPage,
    limit: LIMIT,
    items,
    total,
    totalPages,
    totals,
    // Валюта остатков приходит вместе со списком — суммы считаются именно в ней
    currency: data?.currency || "",
    isLoading,
    isFetching,
  };
}
