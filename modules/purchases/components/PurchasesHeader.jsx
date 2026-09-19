import IconButton from "@/components/shared/Buttons/IconButton";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { Download } from "lucide-react";
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
}) {
  const tPurchases = useTranslations("Purchases");

  return (
    <PageHeader
      className="px-0"
      title={tPurchases("pageTitle")}
      actions={
        <>
          {/* В закупках всегда обычная сделка: карточка ученика (is_school)
              относится только к продажам */}
          {dealPermission.add && (
            <button className="primary-btn text-sm rounded-sm!" onClick={onCreateDeal}>
              {t("createDeal")}
            </button>
          )}
          <IconButton
            icon={Download}
            label={t("downloadExcel")}
            onClick={onExport}
            loading={isDealsExportLoading}
          />
        </>
      }
    />
  );
}
