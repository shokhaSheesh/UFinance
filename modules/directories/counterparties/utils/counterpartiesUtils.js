// Pure utility functions for counterparties pages.
// No React dependencies — safe to use in hooks, components, or tests.

// Safe formatting utilities that handle undefined/null
export const safeFormatNumber = (value) => {
  if (value == null || value === 0) return '0'
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const safeCompare = (value, threshold = 0) => {
  const num = Number(value ?? 0)
  return num > threshold ? 'positive' : num < threshold ? 'negative' : 'neutral'
}

export const getCalculationOptions = (t) => [
  { value: "Cashflow", label: t('list.calculationOptions.cashflow') },
  { value: "Cash", label: t('list.calculationOptions.cash') },
  { value: "Calculation", label: t('list.calculationOptions.calculation') },
]

export const getDetailCalculationOptions = (t) => [
  { value: "Cashflow", label: t('calculationOptions.cashflow') },
  { value: "Cash", label: t('calculationOptions.cash') },
  { value: "Calculation", label: t('calculationOptions.calculation') },
]

export function mapCounterpartyItem(item, index, t) {
  return {
    id: item.guid || `counterparty-${index}`,
    guid: item.guid,
    nazvanie: item.nazvanie || t('noName'),
    polnoe_imya: item.polnoe_imya || null,
    gruppa: item.group_name || null,
    inn: item.inn || null,
    kpp: item.kpp || null,
    nomer_scheta: item.account_number || null,
    counterparties_group_id: item.counterparties_group_id || null,
    counterparties_group: item.group_name || null,
    komentariy: item.komentariy || null,
    data_sozdaniya: item.data_sozdaniya ? new Date(item.data_sozdaniya)?.toLocaleDateString('ru-RU') : null,
    receivables: item.receivables || 0,
    payables: item.payables || 0,
    debitorka: item.debitorka || 0,
    chart_of_accounts_id: item.chart_of_accounts_id || null,
    chart_of_accounts_id_2: item.chart_of_accounts_id_2 || null,
    primenyatь_statьi_po_umolchaniyu: item.primenyatь_statьi_po_umolchaniyu,
    difference: item?.difference,
    kreditorka: item.kreditorka || 0,
    profit: item.profit || 0,
    income: item?.income,
    expenses: item?.expense,
    rawData: item,
    operationCount: item?.operations_count
  }
}

export function groupCounterparties(items) {
  const groupsMap = {}
  items.forEach(item => {
    const groupId = item.counterparties_group_id || 'no-group'
    const groupName = item.counterparties_group || 'Без группы'

    if (!groupsMap[groupId]) {
      groupsMap[groupId] = {
        id: `group-${groupId}`,
        guid: groupId === 'no-group' ? null : groupId,
        nazvanie: groupName,
        items: [],
        operationsCount: 0,
        receivables: 0,
        payables: 0,
        debitorka: 0,
        kreditorka: 0,
        profit: 0,
        income: 0,
        expenses: 0,
        difference: 0
      }
    }

    groupsMap[groupId].items.push(item)
    groupsMap[groupId].receivables += (item.receivables || 0)
    groupsMap[groupId].payables += (item.payables || 0)
    groupsMap[groupId].debitorka += (item.debitorka || 0)
    groupsMap[groupId].kreditorka += (item.kreditorka || 0)
    groupsMap[groupId].profit += (item.profit || 0)
    groupsMap[groupId].income += (item.income || 0)
    groupsMap[groupId].expenses += (item.expenses || 0)
    groupsMap[groupId].difference += (item.difference || 0)
    groupsMap[groupId].operationsCount += (item.operationCount || 0)
  })

  return Object.values(groupsMap).map(group => ({
    ...group,
    isGroup: true
  }))
}

export function buildCounterpartyInfo(counterparty, tc) {
  if (!counterparty) return null

  return {
    name: counterparty.nazvanie || tc('noName'),
    fullName: counterparty.polnoe_imya || '',
    address: counterparty.address || null,
    inn: counterparty.inn && counterparty.inn !== 0 ? counterparty.inn : null,
    kpp: (Array.isArray(counterparty.kpp) ? counterparty.kpp.filter(v => v !== null && v !== '') : (counterparty.kpp && counterparty.kpp !== 0 ? [counterparty.kpp] : [])),
    accountNumber: (Array.isArray(counterparty.account_number) ? counterparty.account_number.filter(v => v !== null && v !== '') : (counterparty.account_number && counterparty.account_number !== 0 ? [counterparty.account_number] : [])),
    bank: counterparty.bank || null,
    mfo: counterparty.mfo && counterparty.mfo !== 0 ? counterparty.mfo : null,
    receiptArticle: counterparty.chart_of_accounts_name || (counterparty.chart_of_accounts_id ? '-' : null),
    paymentArticle: counterparty.chart_of_accounts_name_2 || (counterparty.chart_of_accounts_id_2 ? '-' : null),
    comment: counterparty.komentariy || null,
    type: counterparty.tip || tc('noName'),
    income: counterparty.income || 0,
    expense: counterparty.expense || 0,
    difference: counterparty.difference || 0,
    guid: counterparty.guid || null,
    kreditorka: counterparty.kreditorka || 0,
    debitorka: counterparty.debitorka || 0,
    receivables: counterparty.receivables || counterparty.debitorka || 0,
    payables: counterparty.payables || counterparty.kreditorka || 0,
    operationsCount: counterparty.operations_count || 0
  }
}

export function calculateOperationStats(operations) {
  let receipts = 0
  let payments = 0
  let receiptsCount = 0
  let paymentsCount = 0

  operations.forEach(op => {
    const amount = op.summa || 0
    if (op.tip === 'Поступление') {
      receipts += amount
      receiptsCount++
    } else if (op.tip === 'Выплата') {
      payments += amount
      paymentsCount++
    }
  })

  return {
    receipts,
    payments,
    difference: receipts - payments,
    receiptsCount,
    paymentsCount,
    totalCount: operations.length
  }
}
