import { useMemo } from "react";
import { appStore } from "@/store/app.store";
import { useUcodeRequestQuery } from "./useDashboard";

// Корни плана счетов и есть категории статей: «Доходы», «Расходы», «Актив»,
// «Обязательства», «Капитал». ПланФакт печатает их в списке операций рядом
// с названием статьи — «Нераспределенный расход [Расходы]» — когда включена
// настройка show_article_category_in_list.
const collect = (nodes, rootName, acc) => {
  for (const node of nodes || []) {
    const name = rootName ?? node?.nazvanie ?? "";
    if (node?.guid) acc.set(node.guid, name);
    if (node?.children?.length) collect(node.children, name, acc);
  }
  return acc;
};

/**
 * guid статьи → название её корневой категории.
 * Запрос уходит только когда настройка включена: список операций
 * рисуется без него, и лишний запрос при выключенной настройке не нужен.
 */
export function useChartOfAccountsCategories() {
  const enabled = Boolean(appStore.interfaceSettings?.showArticleCategoryInList);

  const { data } = useUcodeRequestQuery({
    method: "get_chart_of_accounts",
    data: { page: 1, limit: 100, search: "" },
    skip: !enabled,
    querySetting: {
      select: (res) => res?.data?.data,
      staleTime: 1000 * 60 * 30,
      refetchOnMount: false,
    },
  });

  return useMemo(() => (enabled ? collect(data, undefined, new Map()) : new Map()), [data, enabled]);
}

export default useChartOfAccountsCategories;
