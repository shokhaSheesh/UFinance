/**
 * Разбор дерева балансового отчёта в показатели для диаграмм.
 *
 * `balance_report_multi` отдаёт по каждому срезу дерево: «Активы» и «Пассивы»
 * со статьями внутри. Здесь из него достаются суммы (активы, обязательства,
 * капитал), коэффициенты (ликвидность, долг к капиталу) и состав для круговых
 * диаграмм. Узлы ищем по id, а если его нет — по названию: состав плана счетов
 * у компаний отличается, и жёсткий список id сломался бы на первой же.
 */

const num = (value) => Number(value) || 0
const childrenOf = (node) => node?.children || node?.details || []

const byName = (nodes, pattern) => nodes.find((node) => pattern.test(String(node?.name || '')))

const findRoot = (rows, id, pattern) =>
  rows.find((row) => String(row?.id || '').toLowerCase() === id) || byName(rows, pattern)

/**
 * Состав раздела для круговой диаграммы: берём статьи первого уровня, а если
 * у статьи есть подстатьи — раскрываем их (иначе «Денежные средства» скрыли бы
 * наличные и безналичные одним куском).
 */
const compositionOf = (node) => {
  const parts = []
  childrenOf(node).forEach((child) => {
    const sub = childrenOf(child)
    if (sub.length) {
      sub.forEach((item) => parts.push({ name: item?.name, value: num(item?.value) }))
    } else {
      parts.push({ name: child?.name, value: num(child?.value) })
    }
  })
  return parts.filter((part) => part.value !== 0).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
}

/** Показатели одного среза баланса. */
export const readBalancePeriod = (rows = []) => {
  const assetsRoot = findRoot(rows, 'active', /актив/i)
  const passiveRoot = findRoot(rows, 'passive', /пассив/i)

  const assetChildren = childrenOf(assetsRoot)
  const passiveChildren = childrenOf(passiveRoot)

  const nonCurrentAssets = byName(assetChildren, /внеоборот/i)
  const equity = byName(passiveChildren, /капитал/i)
  const currentLiabilities = byName(passiveChildren, /краткосроч/i)
  const longTermLiabilities = byName(passiveChildren, /долгосроч/i)

  const assets = num(assetsRoot?.value)
  const passive = num(passiveRoot?.value)
  const equityValue = num(equity?.value)
  // обязательства = пассивы минус капитал; если разделов нет — считаем по ним
  const liabilities = passiveRoot ? passive - equityValue : num(currentLiabilities?.value) + num(longTermLiabilities?.value)

  const currentAssets = assets - num(nonCurrentAssets?.value)
  const currentLiabilitiesValue = num(currentLiabilities?.value)
  const cash = num(byName(assetChildren, /денежн/i)?.value)
  const receivables = num(byName(assetChildren, /дебитор/i)?.value)
  const inventory = assetChildren
    .filter((child) => /запас|склад/i.test(String(child?.name || '')))
    .reduce((sum, child) => sum + num(child?.value), 0)

  const ratio = (a, b) => (b > 0 ? a / b : null)

  return {
    assets,
    liabilities,
    equity: equityValue,
    currentAssets,
    currentLiabilities: currentLiabilitiesValue,
    nonCurrentAssets: num(nonCurrentAssets?.value),
    longTermLiabilities: num(longTermLiabilities?.value),
    cash,
    receivables,
    inventory,
    otherCurrentAssets: currentAssets - cash - receivables - inventory,
    workingCapital: currentAssets - currentLiabilitiesValue,
    // коэффициенты: покрытие краткосрочных долгов и структура финансирования
    currentRatio: ratio(currentAssets, currentLiabilitiesValue),
    quickRatio: ratio(cash + receivables, currentLiabilitiesValue),
    debtToEquity: ratio(liabilities, equityValue),
    equityShare: assets > 0 ? (equityValue / assets) * 100 : null,
    // равенство баланса: активы против пассивов
    difference: assets - passive,
    assetParts: compositionOf(assetsRoot),
    financingParts: compositionOf(passiveRoot),
  }
}

/** Показатели по всем срезам: для графика динамики. */
export const readBalanceSeries = (periods = []) =>
  periods
    .filter((period) => period?.as_of)
    .map((period) => ({ asOf: period.as_of, ...readBalancePeriod(period.data || []) }))
