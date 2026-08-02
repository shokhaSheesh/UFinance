import { useMemo } from "react";
import { useUcodeRequestQuery } from "./useDashboard";

const collectAccountIds = (node) =>
  [node?.guid, ...(node?.children || []).flatMap(collectAccountIds)].filter(
    Boolean
  );

const matchesRoot = (name, roots) =>
  roots.some((root) =>
    String(name || "")
      .trim()
      .toLowerCase()
      .startsWith(String(root).toLowerCase())
  );

export function useChartOfAccountsIds(rootNames = []) {
  const { data, isPending } = useUcodeRequestQuery({
    method: "get_chart_of_accounts",
    data: { page: 1, limit: 100, search: "" },
    querySetting: {
      select: (res) => res?.data?.data,
      staleTime: 1000 * 60 * 30,
    },
  });

  const ids = useMemo(
    () =>
      (data || [])
        .filter((root) => matchesRoot(root?.nazvanie, rootNames))
        .flatMap(collectAccountIds),
    // rootNames приходит константой из модуля вызывающего компонента
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, rootNames.join("|")]
  );

  return { ids, isLoading: isPending };
}

export default useChartOfAccountsIds;
