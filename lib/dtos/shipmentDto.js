import { FormatDateRu } from "../../utils/helpers"

export const shipmentDto = (item) => {
  return {
    guid: item?.guid,
    data_nachisleniya: item?.data_nachisleniya,
    data_obnovleniya: item?.data_obnovleniya,
    data_operatsii: item?.data_operatsii,
    data_sozdaniya: item?.data_sozdaniya,
    accrualDate: FormatDateRu(item?.data_nachisleniya),
    operationDate: FormatDateRu(item?.data_operatsii),
    tip: item?.tip?.[0],
    my_account_name: item?.my_accounts_name,
    my_account_name2: item?.my_accounts_name_2,
    payment_accrual: item?.payment_accrual,
    payment_confirmed: item?.payment_confirmed,
    counterparty: item?.counterparties_name || '',
    counterparties_id: item?.counterparties_id || null,
    chartOfAccounts:
      item?.chart_of_accounts_id_data?.nazvanie || item?.chart_of_accounts_name || '',
    chart_of_accounts_id: item?.chart_of_accounts_id || null,
    my_accounts_id: item?.my_accounts_id,
    my_accounts_id_2: item?.my_accounts_id_2,
    summa: item?.summa,
    planned_shipment: item?.planned_shipment,
    opisanie: item?.opisanie,
    legal_entity_id: item?.legal_entity_id,
    legal_entity_name: item?.legal_entity_name,
    selling_deal_id: item?.selling_deal_id,
    selling_deal_name: item?.selling_deal_name,
    currency:
      item?.currenies_kod || item?.currenies_symbol || item?.currenies_id_data?.nazvanie || '',
    createdAt: item?.created_at,
    currencyId: item?.currenies_id || null,
    product_and_service_data: item?.product_and_service_data || [],
  }
}