"use client";

import RowActions from "@/components/shared/RowActions/RowActions";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslations } from "next-intl";
import { appStore } from "../../../store/app.store";
import { areDatesAllowed } from "../../../utils/dataEditingRestriction";

export const OperationMenu = observer(
  ({ operation, onEdit, onDelete, onCopy }) => {
    const t = useTranslations("Operations");

    const operationPermissions = appStore.permission.operations;
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

    // Действия — кнопками прямо в строке, без меню «три точки».
    // Даты создания и изменения, которые были внизу меню, показывает шапка
    // окна редактирования.
    return (
      <RowActions
        actions={[
          { key: "edit", icon: Pencil, label: t("menu.edit"), onClick: handleEdit, hidden: !canEdit },
          { key: "copy", icon: Copy, label: t("menu.copy"), onClick: handleCopy, hidden: !canAdd },
          { key: "delete", icon: Trash2, label: t("menu.delete"), onClick: handleDelete, hidden: !canDelete, danger: true },
        ]}
      />
    );
  }
);
