"use client";

import {
  useUcodeRequestMutation,
  useUcodeRequestQuery,
} from "@/hooks/useDashboard";
import { queryClient } from "@/lib/queryClient";

const REASONS_KEY = "get_non_participation_reasons";

// Справочник причин отсутствия. Записи разделяются только по company_id,
// branch_id у этой таблицы нет
export function useReasonsData(search = "") {
  const { data, isLoading } = useUcodeRequestQuery({
    method: REASONS_KEY,
    data: { page: 1, limit: 100, search },
    querySetting: {
      select: (response) => response?.data?.data || [],
    },
  });

  return { reasons: data || [], isLoading };
}

export const invalidateReasons = () => {
  queryClient.invalidateQueries({ queryKey: [REASONS_KEY] });
};

export function useSaveReason() {
  const { mutateAsync, isPending } = useUcodeRequestMutation({
    mutationSetting: { onSuccess: invalidateReasons },
  });

  const save = ({ guid, description }) =>
    mutateAsync({
      method: guid
        ? "update_non_participation_reason"
        : "create_non_participation_reason",
      data: guid ? { guid, description } : { description },
    });

  return { save, isSaving: isPending };
}

export function useDeleteReason() {
  const { mutateAsync, isPending } = useUcodeRequestMutation({
    mutationSetting: { onSuccess: invalidateReasons },
  });

  const remove = (guid) =>
    mutateAsync({ method: "delete_non_participation_reason", data: { guid } });

  return { remove, isDeleting: isPending };
}
