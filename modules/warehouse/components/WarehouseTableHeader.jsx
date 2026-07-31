import { cn } from "@/lib/utils";

const thBase =
  "sticky top-0 z-10 bg-white text-left font-medium text-neutral-400 text-xs px-3.5 py-3 border-b border-gray-200 whitespace-nowrap";

// Денежные колонки подписываем валютой из list_stock_balances
const WarehouseTableHeader = ({ t, currency }) => {
  const withCur = (label) => (currency ? `${label} (${currency})` : label);

  return (
    <thead>
      <tr>
        <th className={cn(thBase, "w-10 text-center")}>{t("columns.number")}</th>
        <th className={thBase}>{t("columns.name")}</th>
        <th className={thBase}>{t("columns.artikul")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.balance")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.waiting")}</th>
        <th className={cn(thBase, "text-right")}>{t("columns.available")}</th>
        <th className={thBase}>{t("columns.unit")}</th>
        <th className={cn(thBase, "text-center")} aria-hidden="true"></th>
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
