import IconButton from '@/components/shared/Buttons/IconButton'
import FilterButton from "@/components/shared/Filters/FilterButton";
import Input from "@/components/shared/Input";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Шапка страницы закупок: поиск и фильтры слева, создание и меню — справа.
 */
export default function PurchasesHeader({
  t,
  dealPermission,
  searchValue,
  isDealsExportLoading,
  onSearch,
  onExport,
  onCreateDeal,
  onOpenFilters,
  filterCount = 0,
}) {
  const tPurchases = useTranslations("Purchases");

  return (
    <PageHeader
      title={tPurchases("pageTitle")}
      search={
        <div className="w-72">
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      }
      filters={<FilterButton onClick={onOpenFilters} count={filterCount} />}
      actions={
        <>
          {/* В закупках всегда обычная сделка: карточка ученика (is_school)
              относится только к продажам */}
          {dealPermission.add && (
            <button className="primary-btn text-sm rounded-sm!" onClick={onCreateDeal}>
              {t("createDeal")}
            </button>
          )}

          <IconButton icon={Download} label={t("downloadExcel")} onClick={onExport} loading={isDealsExportLoading} />
        </>
      }
    />
  );
}
