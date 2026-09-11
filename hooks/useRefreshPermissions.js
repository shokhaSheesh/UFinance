"use client";

import { useCallback } from "react";
import { apiClient } from "@/lib/api/ucode/base";
import { queryClient } from "@/lib/queryClient";
import { appStore } from "@/store/app.store";
import { authStore } from "@/store/auth.store";

export const useRefreshPermissions = () =>
  useCallback(async () => {
    try {
      const branchesResponse = await apiClient.invokeFunction({
        method: "get_my_branches",
        data: { page: 1, limit: 200 },
      });
      const branches = branchesResponse?.data?.data || [];
      if (branches.length > 0) authStore.setBranches(branches);

      const activeBranch = branches?.find(
        (item) => item?.guid === authStore.branch_id
      );
      if (activeBranch) authStore.setSelectBranch(activeBranch);

      const role = authStore.userData?.role;

      if (role === "employees") {
        const response = await apiClient.invokeFunction({
          method: "get_user_role_permissions",
          data: { branches_id: authStore.branch_id },
          type: "role",
        });
        const rolePermissions = response?.data?.data?.role_permissions;
        if (rolePermissions) appStore.setNewPermission(rolePermissions);
        else appStore.setPlanfactPermission();
      } else if (role === "plan_fakt_admins") {
        appStore.setEmployerPermission();
      }

      queryClient.invalidateQueries({ queryKey: ["get_userPermissions"] });
      queryClient.invalidateQueries({ queryKey: ["get_my_branches"] });
    } catch (error) {
      console.error("refresh permissions failed", error);
    }
  }, []);

export default useRefreshPermissions;
