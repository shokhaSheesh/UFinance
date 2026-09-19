"use client";

import FilterButton from '@/components/shared/Filters/FilterButton'
import IconButton from '@/components/shared/Buttons/IconButton'
import BalanceFilterSidebar from "@/components/reports/balance/FilterSidebar";
import { ExpendClose, ExpendOpen } from "@/constants/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { balanceStore } from "../../../../components/reports/balance/balance.store";
import ScreenLoader from "../../../../components/shared/ScreenLoader";
import SingleSelect from "../../../../components/shared/Selects/SingleSelect";
import { apiClient } from "../../../../lib/api/ucode/base";
import { showSuccessNotification } from "../../../../lib/utils/notifications";
import { appStore } from "../../../../store/app.store";
import {
  formatNumber,
  formatTotalSumma,
  handleDownload,
} from "../../../../utils/helpers";
import {
  buildColumns,
  buildPeriodPayload,
  collectInitialExpanded,
  mergePeriodRows,
} from "../../../../modules/reports/balance/utils/balancePeriods";

const formatCell = (value) =>
  value === 0 || value == null ? "–" : formatNumber(formatTotalSumma(value));

const BalanceRow = ({ row, columns, level = 0, expandedRows, onToggle }) => {
  const children = row?.children;
  const hasChildren = children && children.length > 0;
  const isExpanded = expandedRows.has(row?.uniquePath);
  const indent = level * 12;
  const isTotalRow = level === 0;
  const isActiveOrPassive = row?.id === "active" || row?.id === "passive";

  return (
    <React.Fragment>
      <tr
        className={`border-b border-gray-100 transition-colors duration-200 hover:bg-[#f0f4f8] ${
          isTotalRow ? "font-semibold" : ""
        }`}
      >
        <td
          className={`sticky left-0 z-1 min-w-[200px] w-[200px] px-2 py-1.5 text-[11px] text-slate-900 border-b border-r border-gray-200 whitespace-normal wrap-break-word ${
            isActiveOrPassive && "bg-primary! text-white!"
          }`}
          style={{
            paddingLeft: `${indent + 16}px`,
            backgroundColor: isActiveOrPassive ? "#007bff" : "#fff",
          }}
        >
          <div
            className={`flex items-center gap-2 ${
              hasChildren ? "cursor-pointer select-none hover:opacity-80" : ""
            }`}
            onClick={() => hasChildren && onToggle(row.uniquePath)}
          >
            {hasChildren && (
              <button className="bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center text-gray-ucode-500 rounded transition-colors duration-200 hover:bg-gray-100 [&_svg]:w-5 [&_svg]:h-5">
                {isExpanded ? (
                  <ExpendClose color={isActiveOrPassive ? "#fff" : "#667085"} />
                ) : (
                  <ExpendOpen color={isActiveOrPassive ? "#fff" : "#667085"} />
                )}
              </button>
            )}
            <span className={isTotalRow ? "font-semibold" : ""}>
              {row?.name}
            </span>
          </div>
        </td>
        {columns.map((column) => (
          <td
            key={column.key}
            className={`px-2 py-1.5 text-xs text-slate-900 border-b border-gray-200 text-right font-semibold whitespace-nowrap min-w-[120px] ${
              isActiveOrPassive && "bg-primary! text-white!"
            }`}
          >
            <span className={isTotalRow ? "text-xs font-semibold" : ""}>
              {formatCell(row?.values?.[column.key])}
            </span>
          </td>
        ))}
      </tr>
      {hasChildren &&
        isExpanded &&
        children.map((child) => (
          <BalanceRow
            key={child.uniquePath}
            row={child}
            columns={columns}
            level={level + 1}
            expandedRows={expandedRows}
            onToggle={onToggle}
          />
        ))}
    </React.Fragment>
  );
};

export default observer(function BalanceTestPage() {
  const t = useTranslations("Reports");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    dateRange,
    selectedEntity,
    selectedCurrency,
    selectedCounterparties,
    selectedAccount,
    periodType,
  } = balanceStore;

  const periodOptions = useMemo(
    () => [
      { value: "monthly", label: t("balance.grouping.monthly") },
      { value: "quarterly", label: t("balance.grouping.quarterly") },
      { value: "yearly", label: t("balance.grouping.yearly") },
      { value: "total", label: t("balance.grouping.total") },
    ],
    [t]
  );

  const baseFilterData = {
    account_ids: selectedAccount ? selectedAccount : [],
    legal_entity_id: selectedEntity,
    user_currency_code: selectedCurrency,
    contr_agent_ids: selectedCounterparties,
  };

  const filterData = {
    ...baseFilterData,
    ...buildPeriodPayload(dateRange, periodType),
  };

  // Экспорт по-прежнему одной датой — на конец периода
  const exportFilterData = {
    ...baseFilterData,
    as_of: dateRange?.end ? moment(dateRange.end).format("YYYY-MM-DD") : "",
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["balance_report", "multi", filterData],
    queryFn: () =>
      apiClient.invokeFunction({
        method: "balance_report_multi",
        data: filterData,
      }),
    // ответ приходит как { data: { periods, cutoffs, ... } }, но на всякий случай
    // поддерживаем и вложенный вариант { data: { data: {...} } }
    select: (res) =>
      res?.data?.periods ? res.data : res?.data?.data ?? res?.data,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const {
    mutate: exportBalanceReport,
    isPending: isExportBalanceReportLoading,
  } = useMutation({
    mutationKey: ["export_balance_report"],
    mutationFn: () =>
      apiClient.invokeFunction({
        method: "export_balance_report",
        data: exportFilterData,
      }),
    onSuccess: (uploadData) => {
      showSuccessNotification(t("common.fileDownloaded"));
      const fileLink = uploadData?.data?.link;
      if (fileLink) {
        const contractFileLink = `https://cdn.u-code.io/${fileLink}`;
        handleDownload(contractFileLink, "balance_report.xlsx");
      }
    },
  });

  const periods = useMemo(() => data?.periods || [], [data]);
  const columns = useMemo(() => buildColumns(periods), [periods]);
  const rows = useMemo(() => mergePeriodRows(periods), [periods]);

  useEffect(() => {
    if (!isInitialLoad || rows.length === 0) return;
    setExpandedRows(collectInitialExpanded(rows));
    setIsInitialLoad(false);
  }, [rows, isInitialLoad]);

  const toggleRow = (uniquePath) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(uniquePath)) {
        next.delete(uniquePath);
      } else {
        next.add(uniquePath);
      }
      return next;
    });
  };

  return (
    <div className="fixed left-[80px] w-[calc(100%-80px)] flex top-[60px] h-[calc(100%-60px)]">
      <BalanceFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {(isLoading || isFetching) && <ScreenLoader />}

      <div className="w-full relative bg-white flex flex-col overflow-hidden">
        <div className="flex px-4 h-16 shrink-0 items-center z-20 bg-white justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl whitespace-nowrap font-semibold">
              {t("balance.titleTest")}
            </h1>
            <SingleSelect
              data={appStore.myCurrencies}
              value={balanceStore.selectedCurrency}
              onChange={(value) => balanceStore.setSelectedCurrency(value)}
              isClearable={false}
              withSearch={false}
              className={"bg-white w-28"}
              dropdownClassName={"w-28"}
            />
            <FilterButton onClick={() => setIsFilterOpen(true)} />
          </div>
          <div className="flex items-center gap-3">
            <SingleSelect
              data={periodOptions}
              value={periodType}
              onChange={(value) => balanceStore.setPeriodType(value)}
              placeholder={t("balance.display")}
              withSearch={false}
              isClearable={false}
              className="bg-white w-44"
              dropdownClassName="bg-white"
            />
            <IconButton icon={Download} label={t('common.downloadExcel')} onClick={exportBalanceReport} loading={isExportBalanceReportLoading} />
          </div>
        </div>

        <div className="px-4 text-center mb-4 text-sm font-medium shrink-0">
          {t("balance.formula")}
        </div>

        {/* Единственный скролл-контейнер таблицы: шапка с месяцами липнет к его верху,
            а не сдвигается на высоту заголовка страницы, как было при sticky top-16 */}
        <div className="px-4 flex-1 min-h-0 overflow-auto pb-10">
          {error && !isLoading && !isFetching ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 bg-white rounded-lg [&>p]:text-base [&>p]:text-red-600 [&>p]:m-0 [&>p]:text-center">
              <p>
                {t("balance.errorLoading")} {error.message}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-100 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-2 text-[11px] font-medium sticky left-0 z-20 bg-neutral-100 min-w-[200px] w-[200px]">
                    {t("balance.accountHeader")}
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="text-right px-4 py-2 text-xs font-medium whitespace-nowrap min-w-[120px]"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {rows.map((row) => (
                  <BalanceRow
                    key={row.uniquePath}
                    row={row}
                    columns={columns}
                    expandedRows={expandedRows}
                    onToggle={toggleRow}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
});
