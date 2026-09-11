import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useRefreshPermissions } from "@/hooks/useRefreshPermissions";
import { apiClient } from "@/lib/api/ucode/base";
import {
  showErrorNotification,
  showSuccessNotification,
} from "@/lib/utils/notifications";

export const useBranchDetailData = ({ branchId, tb }) => {
  const queryClient = useQueryClient();
  const refreshPermissions = useRefreshPermissions();
  const [roleSearch, setRoleSearch] = useState("");

  const debouncedRoleSearch = useMemo(
    () => debounce((value) => setRoleSearch(value), 400),
    []
  );

  useEffect(() => {
    debouncedRoleSearch(roleSearch);
    return () => debouncedRoleSearch.cancel();
  }, [roleSearch, debouncedRoleSearch]);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["get_roles_list"],
    queryFn: () =>
      apiClient.invokeFunction({
        method: "get_roles",
        data: { page: 1, limit: 150, search: roleSearch },
        type: "role",
      }),
    select: (data) =>
      data?.data?.data?.items?.map((item) => ({
        value: item?.guid,
        label: item?.name,
      })) || [],
    refetchOnMount: true,
  });

  const createUserMutation = useMutation({
    mutationFn: (data) =>
      apiClient.invokeFunction({
        method: "create_branch_user",
        data: {
          branch_id: branchId,
          ...data,
        },
        type: "role",
      }),
    onSuccess: () => {
      showSuccessNotification(
        tb?.("userAdded") || "Пользователь успешно добавлен"
      );
      queryClient.invalidateQueries({
        queryKey: ["get_branch_users", branchId],
      });
      refreshPermissions();
    },
    onError: (error) => {
      showErrorNotification(
        error?.message ||
          tb?.("userAddError") ||
          "Ошибка при добавлении пользователя"
      );
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) =>
      apiClient.invokeFunction({
        method: "update_branch_user",
        data,
        type: "role",
      }),
    onSuccess: () => {
      showSuccessNotification(
        tb?.("userUpdated") || "Пользователь успешно обновлен"
      );
      queryClient.invalidateQueries({
        queryKey: ["get_branch_users", branchId],
      });
      refreshPermissions();
    },
    onError: (error) => {
      showErrorNotification(
        error?.message ||
          tb?.("userUpdateError") ||
          "Ошибка при обновлении пользователя"
      );
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (guid) =>
      apiClient.invokeFunction({
        method: "delete_branch_user",
        data: { guid },
        type: "role",
      }),
    onSuccess: () => {
      showSuccessNotification(
        tb?.("userDeleted") || "Пользователь успешно удален"
      );
      queryClient.invalidateQueries({
        queryKey: ["get_branch_users", branchId],
      });
      refreshPermissions();
    },
    onError: (error) => {
      showErrorNotification(
        error?.message ||
          tb?.("userDeleteError") ||
          "Ошибка при удалении пользователя"
      );
    },
  });

  return {
    rolesData,
    rolesLoading,
    setRoleSearch,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  };
};
