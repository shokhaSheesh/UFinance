import { queryClient } from "@/lib/queryClient";
import { refetchInfiniteQueriesForUpdate } from "./infiniteQuery";

const OPERATIONS_LIST_KEY = ["list_operations_by_query"];

const matchOperation = (guid) => (item) =>
  item?.guid === guid ||
  item?.operationParts?.some((child) => child?.guid === guid);

export async function refreshOperationsListAfterSave({ guid, newDate, isNew }) {
  queryClient.invalidateQueries({ queryKey: ["get_operations_total"] });

  if (!isNew && guid) {
    const patched = await refetchInfiniteQueriesForUpdate({
      queryClient,
      queryKeyPrefix: OPERATIONS_LIST_KEY,
      isTarget: matchOperation(guid),
      getSortValue: (item) => item?.data_operatsii,
      newSortValue: newDate,
    });
    if (patched) return;
  }

  queryClient.refetchQueries({ queryKey: OPERATIONS_LIST_KEY });
}
