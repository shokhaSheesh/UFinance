import { isBefore, isFuture, isToday } from "../../utils/formatDate"
import { formatDateRu } from "../../utils/helpers"

const operationsDto = (operations, type) => {

	return operations
		?.filter(item => {
			if (type === 'today') return isToday(item?.data_operatsii)
			if (type === 'before') return isBefore(item?.data_operatsii)
			if (type === 'future') return isFuture(item?.data_operatsii)
			return true
		})
		.map(item => ({
			guid: item?.guid,
			data_nachisleniya: item?.data_nachisleniya,
			data_obnovleniya: item?.data_obnovleniya,
			data_operatsii: item?.data_operatsii,
			data_sozdaniya: item?.data_sozdaniya,
			accrualDate: formatDateRu(item?.data_nachisleniya),
			operationDate: formatDateRu(item?.data_operatsii),
			tip: item?.tip?.[0],
			my_account_name: item?.my_accounts_name,
			my_account_name2: item?.my_accounts_name_2,
			payment_accrual: item?.payment_accrual,
			payment_confirmed: item?.payment_confirmed,
			counterparty: item.counterparties_name || '',
			counterparties_id: item.counterparties_id || null,
			chartOfAccounts:
				item.chart_of_accounts_name || item.chart_of_accounts_id_data?.nazvanie || '-',
			chartOfAccounts2:
				item.chart_of_accounts_name_2 || item.chart_of_accounts_id_2_data?.nazvanie || '-',
			chart_of_accounts_id: item.chart_of_accounts_id || null,
			chart_of_accounts_id_2: item.chart_of_accounts_id_2 || null,
			my_accounts_id: item?.my_accounts_id,
			my_accounts_id_2: item?.my_accounts_id_2,
			summa: item?.summa,
			opisanie: item?.opisanie,
			debit: item?.debit,
			kredit: item?.kredit,
			selling_deal_id: item?.selling_deal_id,
			selling_deal_id_2: item?.selling_deal_id_2,
			selling_deal_name: item?.selling_deal_name,
			selling_deal_name_2: item?.selling_deal_name_2,
			sales_transaction_name: item?.sales_transaction_name,
			sales_transaction_name_2: item?.sales_transaction_name_2,
			sales_transactions_id: item?.sales_transactions_id,
			sales_transactions_id_2: item?.sales_transactions_id_2,
			currency:
				item?.currenies_symbol || item?.currenies_kod || item?.currenies_id_data?.nazvanie || '',
			currencySymbol: item?.currenies_symbol || item?.currenies_kod || '',
			createdAt: item?.created_at,
			payment_shipment: item?.payment_shipment,
			legal_entity_id: item?.legal_entity_id,
			legal_entity_name: item?.legal_entity_name,
			currencyId: item?.currenies_id || null,
			to_account_id: item?.to_account_id,
			to_account_name: item?.to_account_name,
			to_amount: item?.to_amount,
			to_currenies_id: item?.to_currenies_id,
			operationType: item.tip?.[0] === 'Поступление' ? 'income' : item.tip?.[0] === 'Выплата' ? 'payment' : item.tip?.[0] === 'Перемещение' ? 'transfer' : item.tip?.[0] === 'Отгрузка' ? 'shipment' : 'accrual',
			//Поступление,  Выплата,  Перемещение, Отгрузка, Начисление
			to_currenies_kod: item?.to_currenies_symbol || item?.to_currenies_kod,
			product_and_service_data: item?.product_and_service_data,
			operationParts: item?.operationParts?.map(child => ({
				guid: child?.guid,
				data_nachisleniya: child?.data_nachisleniya,
				data_obnovleniya: child?.data_obnovleniya,
				data_operatsii: child?.data_operatsii,
				data_sozdaniya: child?.data_sozdaniya,
				tip: child?.tip?.[0],
				my_account_name: child?.my_accounts_name,
				my_account_name2: child?.my_accounts_name_2,
				payment_accrual: child?.payment_accrual,
				counterparty: child?.counterparties_name || '',
				counterparties_id: child?.counterparties_id || null,
				payment_confirmed: child?.payment_confirmed,
				chartOfAccounts:
					child?.chart_of_accounts_name || child?.chart_of_accounts_id_data?.nazvanie || '',
				chartOfAccounts2:
					child?.chart_of_accounts_name_2 || child?.chart_of_accounts_id_2_data?.nazvanie || '',
				chart_of_accounts_id: child?.chart_of_accounts_id || null,
				chart_of_accounts_id_2: child?.chart_of_accounts_id_2 || null,
				my_accounts_id: child?.my_accounts_id,
				my_accounts_id_2: child?.my_accounts_id_2,
				summa: child?.summa,
				legal_entity_id: child?.legal_entity_id,
				tip: child?.tip?.[0],
				selling_deal_id: child?.selling_deal_id,
				selling_deal_name: child?.selling_deal_name,
				currency: child?.currenies_kod || child?.currenies_id_data?.nazvanie || '',
				currencyId: child?.currenies_id || null,
				accrualDate: formatDateRu(child?.data_nachisleniya),
				operationDate: formatDateRu(child?.data_operatsii),
				percent: child?.percent,
			})),
		}))
}

export default operationsDto