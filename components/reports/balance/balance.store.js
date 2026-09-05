import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import { GlobalCurrency } from "../../../constants/globalCurrency";
import { getPresetRange } from "../../../utils/datePresets";

// По умолчанию баланс строится за текущий квартал — тот же диапазон, что даёт
// пресет «Этот квартал» в календаре фильтров
const DEFAULT_RANGE_TYPE = "quarter";

const defaultDateRange = () => {
  const [start, end] = getPresetRange(DEFAULT_RANGE_TYPE);
  return { start, end };
};

class BalanceStore {
  // ── Filter state ────────────────────────────────────────────────────────────
  dateRange = defaultDateRange();
  selectedEntity = [];
  selectedCurrency = GlobalCurrency?.code || "UZS";
  selectedCounterparties = [];
  selectedAccount = [];
  defaultDate = defaultDateRange();
  dateRangeType = DEFAULT_RANGE_TYPE;
  // Как разбивать период на срезы: 'monthly' | 'quarterly' | 'yearly' | 'total'
  periodType = "monthly";

  constructor() {
    makeAutoObservable(this);
    if (typeof window !== "undefined") {
      makePersistable(this, {
        name: "balance_store_v2",
        properties: [
          "dateRange",
          "selectedEntity",
          "selectedCurrency",
          "selectedCounterparties",
          "selectedAccount",
          "dateRangeType",
          "periodType",
        ],
        storage: window.localStorage,
        debugMode: false,
      });
    }
  }

  // ── Setters ─────────────────────────────────────────────────────────────────
  setDateRange(range) {
    if (!range.start || !range.end) {
      this.dateRange = defaultDateRange();
    } else {
      this.dateRange = range;
    }
  }
  setDateRangeType(type) {
    this.dateRangeType = type;
  }

  setPeriodType(type) {
    this.periodType = type;
  }

  setSelectedEntity(entity) {
    this.selectedEntity = entity;
  }

  setSelectedCurrency(currency) {
    this.selectedCurrency = currency;
  }

  setSelectedCounterparties(items) {
    this.selectedCounterparties = items;
  }

  setSelectedAccount(account) {
    this.selectedAccount = account;
  }

  resetFilters() {
    this.dateRange = defaultDateRange();
    this.selectedEntity = [];
    this.selectedCurrency = GlobalCurrency?.code || "UZS";
    this.selectedCounterparties = [];
    this.selectedAccount = [];
    this.dateRangeType = DEFAULT_RANGE_TYPE;
    this.periodType = "monthly";
  }
}

export const balanceStore = new BalanceStore();
