import { cn } from "@/lib/utils";

const thBase =
  "sticky top-0 z-10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 px-3.5 py-2.5 border-b border-slate-200 whitespace-nowrap";

// Денежные колонки подписываем валютой из list_stock_balances
const WarehouseTableHeader = ({ t, currency }) => {
  const withCur = (label) => (currency ? `${label}, ${currency}` : label);

  return (
    <thead>
      <tr>
        <th className={cn(thBase, "w-12 text-center")}>{t("columns.number")}</th>
        <th className={thBase}>{t("columns.name")}</th>
        <th className={thBase}>{t("columns.artikul")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.balance")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.waiting")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.available")}</th>
        <th className={thBase}>{t("columns.unit")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.daysInStock")}</th>
        <th className={cn(thBase, "text-right")}>{withCur(t("columns.cost"))}</th>
        <th className={cn(thBase, "text-right")}>{withCur(t("columns.totalCost"))}</th>
        <th className={cn(thBase, "text-right")}>{withCur(t("columns.salePrice"))}</th>
        <th className={cn(thBase, "text-right")}>{withCur(t("columns.saleTotal"))}</th>
      </tr>
    </thead>
  );
};

export default WarehouseTableHeader;
