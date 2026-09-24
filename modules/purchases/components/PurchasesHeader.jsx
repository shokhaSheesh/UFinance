import IconButton from "@/components/shared/Buttons/IconButton";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { Download, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Шапка страницы закупок: заголовок и действия.
 * Поиск и фильтры живут в панели над таблицей (TableToolbar).
 */
export default function PurchasesHeader({
  t,
  dealPermission,
  isDealsExportLoading,
  onExport,
  onCreateDeal,
  count,
}) {
  const tPurchases = useTranslations("Purchases");

  return (
    <PageHeader
      className="px-0"
      title={tPurchases("pageTitle")}
      search={count != null && <span className="text-sm tabular-nums text-slate-500">{t("dealsCountShort", { count })}</span>}
      actions={
        <>
          <IconButton
            icon={Download}
            label={t("downloadExcel")}
            onClick={onExport}
            loading={isDealsExportLoading}
          />

          {/* В закупках всегда обычная сделка: карточка ученика (is_school)
              относится только к продажам */}
          {dealPermission.add && (
            <button className="primary-btn text-sm rounded-sm! gap-1.5" onClick={onCreateDeal}>
              <Plus size={16} />
              {t("createDeal")}
            </button>
          )}
        </>
      }
    />
  );
}
