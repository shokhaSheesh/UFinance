import moment from "moment";
import { appStore } from "@/store/app.store";

/**
 * Готовит копию операции для формы «Создание операции».
 *
 * Настройка «Подставлять текущую дату при копировании операции»
 * (set_current_date_on_copy из get_general_settings): когда включена,
 * копия открывается с сегодняшними датами оплаты и начисления, а не
 * с датами исходной операции. Когда выключена — даты копируются как есть.
 */
export const applyCopyDates = (operation) => {
  if (!operation || !appStore.interfaceSettings?.setCurrentDateOnCopy) {
    return operation;
  }

  const today = moment().format("YYYY-MM-DD");
  const copy = {
    ...operation,
    data_operatsii: today,
    data_nachisleniya: today,
  };

  // Разбитая операция: даты начисления есть и у каждой части
  if (Array.isArray(operation.operationParts)) {
    copy.operationParts = operation.operationParts.map((part) => ({
      ...part,
      data_operatsii: today,
      data_nachisleniya: today,
    }));
  }

  return copy;
};

export default applyCopyDates;
