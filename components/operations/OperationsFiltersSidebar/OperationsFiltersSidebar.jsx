"use client";

import { useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appStore } from "../../../store/app.store";
import {
  allowedTip,
  operationFilterStore,
} from "../../../store/operationFilter.store";
import { useOperationFilterChips } from "../../../modules/operations/list-page/useOperationFilterChips";
import { formatAmountInput } from "../../../utils/helpers";
import MultiSelectStatiya from "../../ReadyComponents/MultiSelectStatiya";
import MultiSelectZdelka from "../../ReadyComponents/MultiZdelka";
import MultiSelectPurchaseZdelka from "../../ReadyComponents/MultiPurchaseZdelka";
import SelectCounterParties from "../../ReadyComponents/SelectCounterParties";
import SelectMyAccounts from "../../ReadyComponents/SelectMyAccounts";
import SelectProjects from "../../ReadyComponents/SelectProjects";
import {
  FilterDrawer,
  FilterField,
  FilterSection,
} from "../../shared/Filters/FilterDrawer";
import ToggleChip from "../../shared/Filters/ToggleChip";
import OperationTypeIcon from "../OperationTypeIcon/OperationTypeIcon";
import { cn } from "@/lib/utils";
import NewDateRangeComponent from "../../directories/NewDateRangeComponent";
import Input from "../../shared/Input";
import SingleSelect from "../../shared/Selects/SingleSelect";


/**
 * Плитка типа операции в окне фильтров: значок типа, название и отметка.
 * Подтипы (списание/зачисление, дебет/кредит) — чипы внутри плитки.
 */
const TypeTile = ({ tip, label, checked, onToggle, children }) => (
  <div
    role="checkbox"
    aria-checked={checked}
    tabIndex={0}
    onClick={onToggle}
    onKeyDown={(e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onToggle();
      }
    }}
    className={cn(
      "flex flex-col gap-2 rounded-xl border p-3 cursor-pointer transition-colors",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]",
      checked
        ? "border-[#0e73f6] bg-[#f5f9ff]"
        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
    )}
  >
    <div className="flex items-center gap-2.5">
      <OperationTypeIcon tip={tip} />
      <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border",
          checked ? "border-[#0e73f6] bg-[#0e73f6] text-white" : "border-slate-300 bg-white"
        )}
        aria-hidden="true"
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        )}
      </span>
    </div>
    {children && <div className="flex flex-wrap gap-1.5 pl-9">{children}</div>}
  </div>
);

export const OperationsFiltersSidebar = observer(({ isOpen, onClose }) => {
  const t = useTranslations("Operations");
  const tf = useTranslations("filters");
  const queryClient = useQueryClient();
  const {
    selectedFilters,
    selectedDatePaymentRange,
    selectedDateStartRange,
    selectedLegalEntities,
    selectedCounterAgents,
    selectedChartOfAccounts,
    selectedProjects,
    paymentType,
    deals,
    purchaseDeals,
    paymentConfirm,
    paymentNotConfirm,
    accrualConfirm,
    accrualNotConfirm,
    amountRange,
  } = operationFilterStore;

  // Ensure selectedFilters is always an array
  const safeSelectedFilters = useMemo(
    () => (Array.isArray(selectedFilters) ? selectedFilters : []),
    [selectedFilters]
  );

  // const [activeTab, setActiveTab] = useState('general')
  // сохранённые в сторе суммы тоже показываем в общем формате
  const [localAmount, setLocalAmount] = useState({
    min: formatAmountInput(amountRange?.min ?? ""),
    max: formatAmountInput(amountRange?.max ?? ""),
  });
  const amountDebounceRef = useRef(null);

  // Счётчик берём из общего хука — тот же источник, что у кнопки фильтров
  // и чипсов над таблицей, иначе числа разъезжаются
  const { count: clearCount } = useOperationFilterChips();

  // Clear all filters
  const onClear = useCallback(() => {
    operationFilterStore.resetFilters();
    setLocalAmount({ min: "", max: "" });
    queryClient.invalidateQueries({ queryKey: ["find_operations"] });
  }, [queryClient]);

  useEffect(() => () => clearTimeout(amountDebounceRef.current), []);

  const handleAmountChange = useCallback((field, rawValue) => {
    const amount = formatAmountInput(rawValue);
    setLocalAmount((prev) => ({ ...prev, [field]: amount }));
    if (amountDebounceRef.current) clearTimeout(amountDebounceRef.current);
    amountDebounceRef.current = setTimeout(() => {
      operationFilterStore.setAmountRange((prev) => ({
        ...prev,
        [field]: amount,
      }));
    }, 200);
  }, []);

  return (
    <>
      <FilterDrawer
        isOpen={isOpen}
        onClose={onClose}
        clearCount={clearCount}
        onClear={onClear}
      >
        {/* Тип операции — плитки со значками типа. Подтипы перемещения и
            начисления видны сразу внутри плитки, без раскрывающих стрелок. */}
        <FilterSection title={t("filters.operationType")}>
          {allowedTip.allowIncome && (
            <TypeTile tip="Поступление" label={t("filters.income")}
              checked={safeSelectedFilters.includes("Поступление")}
              onToggle={() => operationFilterStore.toggleFilter("Поступление")} />
          )}
          {allowedTip.allowPayout && (
            <TypeTile tip="Выплата" label={t("filters.payout")}
              checked={safeSelectedFilters.includes("Выплата")}
              onToggle={() => operationFilterStore.toggleFilter("Выплата")} />
          )}
          {allowedTip.allowTransfer && (
            <TypeTile tip="Перемещение" label={t("filters.transfer")}
              checked={safeSelectedFilters.includes("Перемещение")}
              onToggle={() => operationFilterStore.toggleComplexFilter("Перемещение")}>
              <ToggleChip size="sm" checked={safeSelectedFilters.includes("Списание")}
                onChange={() => operationFilterStore.toggleFilter("Списание")}>
                {t("filters.writeOff")}
              </ToggleChip>
              <ToggleChip size="sm" checked={safeSelectedFilters.includes("Зачисление")}
                onChange={() => operationFilterStore.toggleFilter("Зачисление")}>
                {t("filters.enrollment")}
              </ToggleChip>
            </TypeTile>
          )}
          {allowedTip.allowAccrual && (
            <TypeTile tip="Начисление" label={t("filters.accrual")}
              checked={safeSelectedFilters.includes("Начисление")}
              onToggle={() => operationFilterStore.toggleComplexFilter("Начисление")}>
              <ToggleChip size="sm" checked={safeSelectedFilters.includes("Дебет")}
                onChange={() => operationFilterStore.toggleFilter("Дебет")}>
                {t("filters.debit")}
              </ToggleChip>
              <ToggleChip size="sm" checked={safeSelectedFilters.includes("Кредит")}
                onChange={() => operationFilterStore.toggleFilter("Кредит")}>
                {t("filters.credit")}
              </ToggleChip>
            </TypeTile>
          )}
          {allowedTip.allowShipment && (
            <TypeTile tip="Отгрузка" label={t("filters.shipment")}
              checked={safeSelectedFilters.includes("Отгрузка")}
              onToggle={() => operationFilterStore.toggleFilter("Отгрузка")} />
          )}
          {allowedTip.allowShipment && (
            <TypeTile tip="Поставка" label={t("filters.supply")}
              checked={safeSelectedFilters.includes("Поставка")}
              onToggle={() => operationFilterStore.toggleFilter("Поставка")} />
          )}
        </FilterSection>

        {/* Дата оплаты: период и статус подтверждения */}
        <FilterSection title={t("filters.paymentDate")}>
          <FilterField label={tf("period")}>
            <NewDateRangeComponent
              value={selectedDatePaymentRange}
              onChange={(val) => operationFilterStore.setSelectedDatePaymentRange(val)}
              present={operationFilterStore.dateRangeTypeOplata}
              onSetPresent={(present) => operationFilterStore.setState("dateRangeTypeOplata", present)}
              onClear={() => operationFilterStore.setState("dateRangeTypeOplata", "")}
            />
          </FilterField>
          <FilterField label={tf("status")}>
            <div className="flex flex-wrap gap-2">
              <ToggleChip checked={paymentConfirm}
                onChange={(v) => operationFilterStore.setState("paymentConfirm", v)}>
                {t("filters.confirmed")}
              </ToggleChip>
              <ToggleChip checked={paymentNotConfirm}
                onChange={(v) => operationFilterStore.setState("paymentNotConfirm", v)}>
                {t("filters.notConfirmed")}
              </ToggleChip>
            </div>
          </FilterField>
        </FilterSection>

        {/* «Дата начисления» — только при включённой настройке
            show_accrual_date_filter, как в ПланФакте */}
        {appStore.interfaceSettings?.showAccrualDateFilter && (
          <FilterSection title={t("filters.accrualDate")}>
            <FilterField label={tf("period")}>
              <NewDateRangeComponent
                value={selectedDateStartRange}
                onChange={(val) => operationFilterStore.setSelectedDateStartRange(val)}
                present={operationFilterStore.dateRangeTypeNachisleniya}
                onSetPresent={(present) => operationFilterStore.setState("dateRangeTypeNachisleniya", present)}
                onClear={() => operationFilterStore.setState("dateRangeTypeNachisleniya", "")}
              />
            </FilterField>
            <FilterField label={tf("status")}>
              <div className="flex flex-wrap gap-2">
                <ToggleChip checked={accrualConfirm}
                  onChange={(v) => operationFilterStore.setState("accrualConfirm", v)}>
                  {t("filters.confirmed")}
                </ToggleChip>
                <ToggleChip checked={accrualNotConfirm}
                  onChange={(v) => operationFilterStore.setState("accrualNotConfirm", v)}>
                  {t("filters.notConfirmed")}
                </ToggleChip>
              </div>
            </FilterField>
          </FilterSection>
        )}

        {/* Параметры — у каждого поля видимая подпись, две колонки */}
        <FilterSection title={t("filters.parameters")}>
          <FilterField label={t("filters.legalEntitiesPlaceholder")}>
            <SelectMyAccounts
              value={selectedLegalEntities}
              onChange={(val) => operationFilterStore.setSelectedLegalEntities(val)}
              placeholder={tf("all")}
              multi={true}
            />
          </FilterField>
          <FilterField label={t("filters.counterpartiesPlaceholder")}>
            <SelectCounterParties
              value={selectedCounterAgents}
              onChange={(val) => operationFilterStore.setSelectedCounterAgents(val)}
              placeholder={tf("all")}
            />
          </FilterField>
          <FilterField label={t("filters.chartOfAccountsPlaceholder")}>
            <MultiSelectStatiya
              value={selectedChartOfAccounts}
              onChange={(val) => operationFilterStore.setSelectedChartOfAccounts(val)}
              placeholder={tf("all")}
              type=""
              dropdownClassName={"w-64"}
            />
          </FilterField>
          {appStore.projectActive && (
            <FilterField label={t("filters.projectsPlaceholder")}>
              <SelectProjects
                multi
                value={selectedProjects}
                onChange={(val) => operationFilterStore.setSelectedProjects(val)}
                placeholder={tf("all")}
                dropdownClassName={"w-64"}
              />
            </FilterField>
          )}
          <FilterField label={t("filters.dealsPlaceholder")}>
            <MultiSelectZdelka
              value={deals}
              onChange={(val) => operationFilterStore.setSelectedDeals(val)}
              placeholder={tf("all")}
              className={"w-full"}
            />
          </FilterField>
          <FilterField label={t("filters.purchaseDealsPlaceholder")}>
            <MultiSelectPurchaseZdelka
              value={purchaseDeals}
              onChange={(val) => operationFilterStore.setSelectedPurchaseDeals(val)}
              placeholder={tf("all")}
              className={"w-full"}
            />
          </FilterField>
          {appStore.isPayment && (
            <FilterField label={t("filters.paymentTypePlaceholder")}>
              <SingleSelect
                data={[
                  { label: t("paymentTypes.cash"), value: "cash" },
                  { label: t("paymentTypes.card"), value: "card" },
                  { value: "transfer", label: t("paymentTypes.transfer") },
                ]}
                value={paymentType}
                onChange={(val) => operationFilterStore.setPaymentType(val)}
                isClearable={false}
                placeholder={tf("all")}
              />
            </FilterField>
          )}
          <FilterField label={tf("amount")} full>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder={t("filters.amountFrom")}
                value={localAmount.min}
                onChange={(e) => handleAmountChange("min", e.target.value)}
              />
              <span className="text-slate-400">—</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={t("filters.amountTo")}
                value={localAmount.max}
                onChange={(e) => handleAmountChange("max", e.target.value)}
              />
            </div>
          </FilterField>
        </FilterSection>
      </FilterDrawer>
    </>
  );
});
