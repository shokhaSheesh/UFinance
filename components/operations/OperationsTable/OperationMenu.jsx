"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import { cn } from "@/lib/utils";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import moment from "moment";
import { useTranslations } from "next-intl";
import { appStore } from "../../../store/app.store";
import { areDatesAllowed } from "../../../utils/dataEditingRestriction";
import { toJS } from "mobx";

export const OperationMenu = observer(
  ({ operation, onEdit, onDelete, onCopy }) => {
    const t = useTranslations("Operations");

    const operationPermissions = appStore.permission.operations;
    console.log("operationPermissions", toJS(operationPermissions));
    const canAdd =
      (operationPermissions.income.add &&
        operation.operationType === "income") ||
      (operationPermissions.payout.add &&
        operation.operationType === "payment") ||
      (operationPermissions.transfer.add &&
        operation.operationType === "transfer") ||
      (operationPermissions.accrual.add &&
        operation.operationType === "accrual") ||
      (operationPermissions.shipment.add &&
        operation.operationType === "shipment") ||
      (operationPermissions.supply.add && operation.operationType === "supply");
    // Закрытый период роли: операции вне разрешённого периода
    // нельзя ни менять, ни удалять. См. utils/dataEditingRestriction.js
    const isDateAllowed = areDatesAllowed(
      [operation.data_operatsii, operation.data_nachisleniya],
      appStore.dataEditingRestriction
    );

    const hasEditPermission =
      (operationPermissions.income.edit &&
        operation.operationType === "income") ||
      (operationPermissions.payout.edit &&
        operation.operationType === "payment") ||
      (operationPermissions.transfer.edit &&
        operation.operationType === "transfer") ||
      (operationPermissions.accrual.edit &&
        operation.operationType === "accrual") ||
      (operationPermissions.shipment.edit &&
        operation.operationType === "shipment") ||
      (operationPermissions.supply.edit &&
        operation.operationType === "supply");
    const hasDeletePermission =
      (operationPermissions.income.delete &&
        operation.operationType === "income") ||
      (operationPermissions.payout.delete &&
        operation.operationType === "payment") ||
      (operationPermissions.transfer.delete &&
        operation.operationType === "transfer") ||
      (operationPermissions.accrual.delete &&
        operation.operationType === "accrual") ||
      (operationPermissions.shipment.delete &&
        operation.operationType === "shipment") ||
      (operationPermissions.supply.delete &&
        operation.operationType === "supply");

    // Копию можно завести и в закрытом периоде — дату в модалке всё равно
    // придётся сдвинуть в разрешённый диапазон
    const canEdit = hasEditPermission && isDateAllowed;
    const canDelete = hasDeletePermission && isDateAllowed;

    const handleEdit = () => {
      onEdit(operation);
    };

    const handleDelete = () => {
      onDelete(operation);
    };

    const handleCopy = () => {
      if (onCopy) onCopy(operation);
    };

    if (!canEdit && !canDelete && !canAdd) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <RowActionsTrigger />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 p-2" align="end">
          {canEdit && (
            <DropdownMenuItem>
              <button
                className={cn(
                  "w-full flex items-center cursor-pointer text-sm gap-2 pb-2 justify-start"
                )}
                onClick={handleEdit}
              >
                <Pencil size={16} />
                <span>{t("menu.edit")}</span>
              </button>
            </DropdownMenuItem>
          )}
          {canAdd && (
            <DropdownMenuItem>
              <button
                className={cn(
                  "w-full flex items-center cursor-pointer text-sm gap-2  justify-start"
                )}
                onClick={handleCopy}
              >
                <Copy size={16} />
                <span>{t("menu.copy")}</span>
              </button>
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem>
              <button
                className={cn(
                  "w-full flex items-center text-red-500 cursor-pointer text-sm gap-2 justify-start"
                )}
                onClick={handleDelete}
              >
                <Trash2 size={16} className="text-red-500" />
                <span>{t("menu.delete")}</span>
              </button>
            </DropdownMenuItem>
          )}
          <div className="border-t border-neutral-200 pt-2 text-[9px] text-neutral-400">
            <p className="line-clamp-1">
              {t("menu.createdLabel")}{" "}
              {operation?.createdAt &&
                moment(operation?.createdAt).format("MMM, DD YYYY HH:mm")}
            </p>
            <p className="line-clamp-1">{operation?.createdBy || ""}</p>
            <p className="line-clamp-1">
              {t("menu.updatedLabel")}{" "}
              {operation?.updatedAt &&
                moment(operation?.updatedAt).format("MMM, DD YYYY HH:mm")}
            </p>
            <p className="line-clamp-1">{operation?.updatedBy || ""}</p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
