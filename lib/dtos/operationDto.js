import { formatDateRu } from "@/utils/helpers";

const operationDto = (operation) => {
  return {
    guid: operation?.guid,
    data_nachisleniya: operation?.data_nachisleniya,
    data_obnovleniya: operation?.data_obnovleniya,
    data_operatsii: operation?.data_operatsii,
    data_sozdaniya: operation?.data_sozdaniya,
    accrualDate: formatDateRu(operation?.data_nachisleniya),
    operationDate: formatDateRu(operation?.data_operatsii),
    tip: operation?.tip?.[0],
    my_account_name: operation?.my_accounts_name,
    my_account_name2: operation?.my_accounts_name_2,
    payment_accrual: operation?.payment_accrual,
    payment_confirmed: operation?.payment_confirmed,
    counterparty: operation.counterparties_name || "",
    counterparties_id: operation.counterparties_id || null,
    projects_id: operation?.projects_id || null,
    projectName: operation?.projects_name || operation?.project_name || operation?.projects_id_data?.nazvanie || "",
    chartOfAccounts:
      operation.chart_of_accounts_name ||
      operation.chart_of_accounts_id_data?.nazvanie ||
      "-",
    chartOfAccounts2:
      operation.chart_of_accounts_name_2 ||
      operation.chart_of_accounts_id_2_data?.nazvanie ||
      "-",
    chart_of_accounts_id: operation.chart_of_accounts_id || null,
    chart_of_accounts_id_2: operation.chart_of_accounts_id_2 || null,
    my_accounts_id: operation?.my_accounts_id,
    my_accounts_id_2: operation?.my_accounts_id_2,
    summa: operation?.summa,
    opisanie: operation?.opisanie,
    debit: operation?.debit,
    kredit: operation?.kredit,
    selling_deal_id: operation?.selling_deal_id,
    selling_deal_id_2: operation?.selling_deal_id_2,
    selling_deal_name: operation?.selling_deal_name,
    selling_deal_name_2: operation?.selling_deal_name_2,
    sales_transaction_name: operation?.sales_transaction_name,
    sales_transaction_name_2: operation?.sales_transaction_name_2,
    sales_transactions_id: operation?.sales_transactions_id,
    sales_transactions_id_2: operation?.sales_transactions_id_2,
    purchase_transaction_name: operation?.purchase_transaction_name,
    purchase_transaction_name_2: operation?.purchase_transaction_name_2,
    purchase_transactions_id: operation?.purchase_transactions_id,
    purchase_transactions_id_2: operation?.purchase_transactions_id_2,
    currency:
      operation?.currenies_symbol ||
      operation?.currenies_kod ||
      operation?.currenies_id_data?.nazvanie ||
      "",
    currencySymbol:
      operation?.currenies_symbol || operation?.currenies_kod || "",
    createdAt: operation?.created_at,
    payment_shipment: operation?.payment_shipment,
    legal_entity_id: operation?.legal_entity_id,
    legal_entity_name: operation?.legal_entity_name,
    currencyId: operation?.currenies_id || null,
    to_account_id: operation?.to_account_id,
    to_account_name: operation?.to_account_name,
    paymentType: operation?.payment_type || "-",
    to_amount: operation?.to_amount,
    to_currenies_id: operation?.to_currenies_id,
    operationType:
      operation.tip?.[0] === "Поступление"
        ? "income"
        : operation.tip?.[0] === "Выплата"
        ? "payment"
        : operation.tip?.[0] === "Перемещение"
        ? "transfer"
        : operation.tip?.[0] === "Отгрузка"
        ? "shipment"
        : operation.tip?.[0] === "Поставка"
        ? "supply"
        : "accrual",
    to_currenies_kod:
      operation?.to_currenies_symbol || operation?.to_currenies_kod,
    product_and_service_data: operation?.product_and_service_data,
    createdBy: operation?.created_by,
    updatedAt: operation?.updated_at,
    updatedBy: operation?.updated_by,
    operationParts: operation?.operationParts?.map((child) => ({
      guid: child?.guid,
      data_nachisleniya: child?.data_nachisleniya,
      data_obnovleniya: child?.data_obnovleniya,
      data_operatsii: child?.data_operatsii,
      data_sozdaniya: child?.data_sozdaniya,
      tip: child?.tip?.[0],
      my_account_name: child?.my_accounts_name,
      my_account_name2: child?.my_accounts_name_2,
      payment_accrual: child?.payment_accrual,
      counterparty: child?.counterparties_name || "",
      counterparties_id: child?.counterparties_id || null,
      payment_confirmed: child?.payment_confirmed,
      chartOfAccounts:
        child?.chart_of_accounts_name ||
        child?.chart_of_accounts_id_data?.nazvanie ||
        "",
      chartOfAccounts2:
        child?.chart_of_accounts_name_2 ||
        child?.chart_of_accounts_id_2_data?.nazvanie ||
        "",
      chart_of_accounts_id: child?.chart_of_accounts_id || null,
      chart_of_accounts_id_2: child?.chart_of_accounts_id_2 || null,
      my_accounts_id: child?.my_accounts_id,
      my_accounts_id_2: child?.my_accounts_id_2,
      summa: child?.summa,
      legal_entity_id: child?.legal_entity_id,
      tip: child?.tip?.[0],
      selling_deal_id: child?.selling_deal_id,
      selling_deal_name: child?.selling_deal_name,
      currency:
        child?.currenies_kod || child?.currenies_id_data?.nazvanie || "",
      currencyId: child?.currenies_id || null,
      accrualDate: formatDateRu(child?.data_nachisleniya),
      operationDate: formatDateRu(child?.data_operatsii),
      percent: child?.percent,
      createdAt: child?.created_at,
      createdBy: child?.created_by,
      updatedAt: child?.updated_at,
      updatedBy: child?.updated_by,
    })),
  };
};

export default operationDto;
