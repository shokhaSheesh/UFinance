export const formatDateLocal = (date) => {
  if (!date) return null
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Recursively collect own + descendant numeric ids
export const collectAllIds = (node) => {
  const ownId = node?.id && String(node.id).match(/\d+/) ? [node.id] : []
  const hasChildren = node?.details && node.details.length > 0
  if (!hasChildren) return ownId
  const childIds = node.details.flatMap(child => collectAllIds(child))
  return [...ownId, ...childIds]
}

// Build the tip array for a root item
export const getTip = (rootItem, isCalculation) => {
  let tips = []
  const income = rootItem?.name === "income" || rootItem?.id === "income" || rootItem?.type === "income"
  const expenses = rootItem?.name === "expenses" || rootItem?.id === "expenses" || rootItem?.type === "expenses"

  if (isCalculation === 'accrual') tips.push("Отгрузка")
  if (expenses) tips = ["Выплата", "Кредит", "Дебет", "Начисление"]
  if (income) tips = [...tips, "Поступление", "Кредит", "Дебет", "Начисление"]
  if (!income && !expenses) tips = [...tips, "Выплата", "Поступление", "Дебет", "Кредит", "Начисление"]
  return tips
}

// Recursively enrich a node with filterdata
export const enrichNode = (node, rootItem, isCalculation) => {
  const enriched = {
    ...node,
    filterdata: {
      ids: [...new Set(collectAllIds(node))],
      tip: getTip(rootItem, isCalculation),
    },
  }
  if (node?.details && node.details.length > 0) {
    enriched.details = node.details.map(child => enrichNode(child, rootItem, isCalculation))
  }
  return enriched
}

// Build enriched rows array from the API rows
export const buildEnrichedRows = (list, isCalculation) => {
  const accumulatedIds = []
  return (list || []).map((item) => {
    const hasChildren = item?.details && item.details.length > 0
    if (hasChildren) {
      const enriched = enrichNode(item, item, isCalculation)
      accumulatedIds.push(...enriched.filterdata.ids)
      return enriched
    }
    return {
      ...item,
      filterdata: {
        ids: [...new Set(accumulatedIds)],
        tip: getTip(item, isCalculation),
      },
    }
  })
}
