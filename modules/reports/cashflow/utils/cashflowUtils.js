import { isUUID } from '@/utils/helpers'

export const nameMap = {
  "Поступления": ["Поступление"],
  "Выплаты": ["Выплата"],
  "Списания": ["Списание", "Перемещение"],
  "Зачисления": ["Зачисление", "Перемещение"],
  "Перемещения": ["Списание", "Зачисление", "Перемещение"],
  "Операционный поток": ["Поступление", "Выплата"],
  "Инвестиционный поток": ["Поступление", "Выплата"],
  "Финансовый поток": ["Поступление", "Выплата"],
}

// Recursive — node's OWN id + all descendant ids
export const collectAllIds = (node) => {
  const ownId = node?.id ? [node.id?.slice(0, 36)] : []
  const hasChildren = node?.details && node.details.length > 0
  if (!hasChildren) return ownId
  const childIds = node.details.flatMap(child => collectAllIds(child))
  return [...ownId, ...childIds]
}

export const getRootTip = (rootName) => {
  if (rootName === 'Операционный поток' || rootName === 'Инвестиционный поток' || rootName === 'Финансовый поток') {
    return ['Поступление', 'Выплата']
  }
  if (rootName === 'Перемещения') return ['Списание', 'Зачисление', 'Перемещение']
  if (rootName === 'Общий денежный поток' || rootName === 'Остатки на конец периода') {
    return ['Списание', 'Зачисление', 'Перемещение', 'Поступление', 'Выплата']
  }
  return []
}

export const getSubtreeTip = (name) => {
  if (name === 'Поступления') return ['Поступление']
  if (name === 'Выплаты') return ['Выплата']
  if (name === 'Списания') return ['Списание']
  if (name === 'Зачисления') return ['Зачисление']
  return null
}

// Build the unique sanitized id array for a row's filter data
export const buildIdList = (node) => [
  ...new Set(
    collectAllIds(node)
      ?.map(id => id?.replace(/':+/g, ''))
      ?.filter(id => isUUID(id))
  ),
]

// Recursive transform of one row + all descendants
export const transformRow = (
  row,
  months,
  depth = 0,
  sectionName = null,
  parentPath = '',
  inheritedSubtreeTip = null,
  rootName = null,
  inheritedClickable = true,
) => {
  const monthData = {}
  months.forEach(monthKey => { monthData[monthKey] = row?.values?.[monthKey] || 0 })

  let currentSection = sectionName
  if (depth === 1) {
    if (row?.name === 'Поступления') currentSection = 'Поступления'
    if (row?.name === 'Выплаты') currentSection = 'Выплаты'
    if (row?.name === 'Списания') currentSection = 'Списания'
    if (row?.name === 'Зачисления') currentSection = 'Зачисления'
  }

  const rowUniquePath = parentPath ? `${parentPath}-${row?.id}` : String(row?.id)
  const currentRootName = depth === 0 ? row?.name : rootName

  let currentSubtreeTip = inheritedSubtreeTip
  const subtreeTipFromName = getSubtreeTip(row?.name)
  if (depth >= 1 && subtreeTipFromName) currentSubtreeTip = subtreeTipFromName

  let tip
  if (depth === 0) tip = getRootTip(row?.name)
  else if (currentSubtreeTip) tip = currentSubtreeTip
  else tip = getRootTip(currentRootName)

  let isClickable = inheritedClickable
  if (depth === 0) {
    isClickable = row?.name !== 'Остатки на конец периода' && row?.id !== 'ending-balance'
  }

  const node = {
    id: row?.id,
    uniquePath: rowUniquePath,
    name: row?.name,
    total: row?.totalValue || 0,
    months: monthData,
    level: depth,
    section: currentSection,
    isClickable,
    filterdata: { ids: buildIdList(row), tip },
    subRows: [],
  }

  if (row?.details && Array.isArray(row.details) && row.details.length > 0) {
    node.subRows = row.details.map(detail =>
      transformRow(detail, months, depth + 1, currentSection, rowUniquePath, currentSubtreeTip, currentRootName, isClickable)
    )
  }
  return node
}

// After transformation: aggregate ids for "Общий денежный поток" leaf
export const aggregateOverallCashFlow = (transformed) => {
  const overallIndex = transformed.findIndex(r => r?.name === 'Общий денежный поток' || r?.id === 'overall-cash-flow')
  if (overallIndex !== -1) {
    const aggregatedIds = []
    for (let i = 0; i < overallIndex; i++) {
      aggregatedIds.push(...(transformed[i]?.filterdata?.ids || []))
    }
    transformed[overallIndex].filterdata.ids = [...new Set(aggregatedIds)]
  }
  return transformed
}
