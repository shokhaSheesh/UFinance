"use client";

import RowActions from '@/components/shared/RowActions/RowActions'
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  deviation,
  deviationPercent,
  formatDeviation,
  formatMoney,
  formatPercent,
  parseInputNumber,
  planExecution,
  toInputValue,
} from "@/modules/plans/utils/format";
import { buildPeriodColumns } from "@/modules/plans/utils/periods";
import {
  BUDGET_ROW_CLASSES as R,
  BUDGET_TOKENS as T,
  COLUMN_DEFS,
} from "@/modules/plans/utils/tokens";

/* ------------------------------------------------------------------ */
/* Агрегация                                                          */
/* ------------------------------------------------------------------ */

const emptyCell = () => ({ plan: 0, fact: 0, profit: null });

/**
 * Складывает две ячейки. `profit` приходит с бэка со своим знаком; если его нет
 * ни у одного слагаемого, оставляем null — «Откл.» посчитается по плану и факту.
 */
const addCells = (a, b) => ({
  plan: (a?.plan || 0) + (b?.plan || 0),
  fact: (a?.fact || 0) + (b?.fact || 0),
  profit:
    a?.profit == null && b?.profit == null
      ? null
      : (a?.profit || 0) + (b?.profit || 0),
});

/**
 * Считает значения по всем месяцам для каждой строки дерева.
 * Возвращает map: rowId → { 'YYYY-MM': { plan, fact, profit } }
 */
const buildMonthlyValues = (rows, months, planOverrides) => {
  const byRow = {};

  /** Собственные значения узла (без потомков) с учётом локальной правки плана. */
  const ownValues = (node) => {
    const values = {};
    months.forEach((m) => {
      const base = node.values?.[m] || emptyCell();
      const override = planOverrides?.[`${node.id}|${m}`];
      const plan = override != null ? override : base.plan || 0;
      const fact = base.fact || 0;
      values[m] = {
        plan,
        fact,
        // profit берём с бэка как есть; после локальной правки плана
        // пересчитываем в том же направлении, что и в ответе API
        profit:
          override != null
            ? (node.profitSign ?? 1) * (fact - plan)
            : base.profit ?? null,
      };
    });
    return values;
  };

  const walk = (node) => {
    if (node.kind === "computed" || node.kind === "ratio") {
      byRow[node.id] = null; // считается позже, после всех обычных строк
      return;
    }
    if (!node.children?.length) {
      byRow[node.id] = ownValues(node);
      return;
    }
    node.children.forEach(walk);
    // Группа = собственные значения (у данных из API это «остаток» узла,
    // у мока — их нет) плюс сумма потомков
    const own = ownValues(node);
    const values = {};
    months.forEach((m) => {
      values[m] = node.children.reduce(
        (acc, child) => addCells(acc, byRow[child.id]?.[m] || emptyCell()),
        own[m]
      );
    });
    byRow[node.id] = values;
  };

  rows.forEach(walk);

  // Вычисляемые строки — во втором проходе, они могут ссылаться на любые id
  const resolve = (id, m) => byRow[id]?.[m] || emptyCell();
  const computeWalk = (node) => {
    if (
      (node.kind === "computed" || node.kind === "ratio") &&
      typeof node.compute === "function"
    ) {
      const values = {};
      months.forEach((m) => {
        values[m] = node.compute(resolve, m) || emptyCell();
      });
      byRow[node.id] = values;
    }
    node.children?.forEach(computeWalk);
  };
  rows.forEach(computeWalk);

  return byRow;
};

/** Суммирует месячные значения строки по месяцам колонки. */
const sumMonths = (values, months) => {
  if (!values) return emptyCell();
  return months.reduce(
    (acc, m) => addCells(acc, values[m] || emptyCell()),
    emptyCell()
  );
};

/** Среднее по месяцам — для процентных строк, которые нельзя складывать. */
const avgMonths = (values, months) => {
  if (!values || !months.length) return emptyCell();
  const sum = sumMonths(values, months);
  return {
    plan: sum.plan / months.length,
    fact: sum.fact / months.length,
    profit: sum.profit == null ? null : sum.profit / months.length,
  };
};

/**
 * Сумма локальных правок плана в поддереве узла. Итоги периода приходят из API
 * уже свёрнутыми, поэтому до перезапроса дерева сдвигаем их на эту дельту.
 * Правка «Итого» перекрывает месячные правки того же узла — на бэке она их
 * тоже заменяет.
 */
const planDeltaFor = (node, months, planOverrides, totalOverrides) => {
  let delta = 0;
  const walk = (n) => {
    const total = totalOverrides?.[n.id];
    if (total != null) {
      delta += total - (n.periodOwnPlan || 0);
    } else {
      months.forEach((m) => {
        const override = planOverrides?.[`${n.id}|${m}`];
        if (override != null) delta += override - (n.values?.[m]?.plan || 0);
      });
    }
    n.children?.forEach(walk);
  };
  walk(node);
  return delta;
};

/**
 * Значения строки за весь период — поля `plan` и `totalValue` из API как есть.
 * Пока дерево не перезапрошено, план сдвигаем на локальные правки, а «Откл.»
 * пересчитываем в том же направлении, что и в ответе API.
 */
const periodMetrics = (node, months, planOverrides, totalOverrides) => {
  const base = node.periodTotals;
  const delta = planDeltaFor(node, months, planOverrides, totalOverrides);
  if (!delta) return base;
  const plan = base.plan + delta;
  return {
    plan,
    fact: base.fact,
    profit: (node.profitSign ?? 1) * (base.fact - plan),
  };
};

/**
 * Агрегация значения строки по колонке.
 * Остатки на начало/конец не суммируются: берётся первый / последний месяц —
 * как в ПланФакт. Итог за весь период берём из полей `plan` строки, а не
 * складываем по месяцам: у процентных строк сложение бессмысленно, а у
 * остальных бэк уже отдал готовый roll-up.
 */
const aggregateNode = (node, byRow, col, planOverrides, totalOverrides) => {
  const months = col.months;
  if (node?.kind === "ratio" && typeof node.aggregate === "function") {
    const resolve = (id) => sumMonths(byRow[id], months);
    return node.aggregate(resolve) || { plan: null, fact: null };
  }
  const values = byRow[node.id];
  if (node?.aggregation === "first") return values?.[months[0]] || emptyCell();
  if (node?.aggregation === "last")
    return values?.[months[months.length - 1]] || emptyCell();
  if (col.kind === "total" && node?.periodTotals)
    return periodMetrics(node, months, planOverrides, totalOverrides);
  if (months.length === 1) return values?.[months[0]] || emptyCell();
  if (node?.aggregation === "percent") return avgMonths(values, months);
  return sumMonths(values, months);
};

/* ------------------------------------------------------------------ */
/* Атомы разметки                                                     */
/* ------------------------------------------------------------------ */

/**
 * Иконка «свернуть / развернуть» — 1 в 1 с ПланФакт: квадрат 13×13
 * со скруглением 2.5px, обводка и штрихи #999, толщина 1px.
 * Используется и в статьях, и в шапке (год / квартал).
 */
const ExpanderIcon = ({ expanded }) => (
  <svg
    width={T.expanderWidth}
    height={14}
    viewBox="0 0 15 14"
    fill="none"
    className="shrink-0"
    aria-hidden="true"
  >
    <rect
      x={1.42}
      y={0.5}
      width={13}
      height={13}
      rx={2.5}
      stroke={T.iconStroke}
    />
    <path d="M10.9223 6.87934H4.92535" stroke={T.iconStroke} />
    {!expanded && <path d="M7.92383 3.88V9.87868" stroke={T.iconStroke} />}
  </svg>
);

// overflow-hidden обязателен: длинные значения (например «Вып. плана, %» при
// почти нулевом факте) иначе наползают на соседние колонки
const CellShell = ({ children, bold, className = "", isLast, onClick }) => (
  <div
    onClick={onClick}
    className={`flex shrink-0 items-center justify-end overflow-hidden tabular-nums ${className}`}
    style={{
      width: T.cellWidth,
      height: "100%",
      padding: `0 ${T.cellPadRight}px 0 0`,
      fontSize: T.fontSize,
      lineHeight: T.lineHeight,
      fontWeight: bold ? 600 : 400,
      color: T.text,
      borderRight: isLast ? "none" : `1px solid ${T.border}`,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Таблица                                                            */
/* ------------------------------------------------------------------ */

/**
 * Сводная таблица бюджета — 1 в 1 с ПланФакт.
 *
 * @param {object}   props
 * @param {string}   props.entityTitle     заголовок первой колонки (юрлицо/бюджет)
 * @param {string}   props.entitySubtitle  проект под заголовком
 * @param {Array}    props.rows            дерево статей
 * @param {string}   props.start           'YYYY-MM'
 * @param {string}   props.end             'YYYY-MM'
 * @param {string}   props.grouping        months | quarters | years
 * @param {object}   props.visibleCols     { fact, planExec, deviation, deviationPct }
 * @param {Function} props.t               переводчик секции страницы
 * @param {boolean}  props.editable        разрешить правку плановых ячеек
 * @param {boolean}  props.totalEditable   разрешить правку плана в колонке «Итого»
 * @param {Function} props.onPlanChange    ({ rowId, month, amount }) → запись плана в API
 *                                         (без `month` — сумма на весь период)
 * @param {boolean}  props.loading         идёт загрузка дерева
 * @param {string}   props.emptyLabel      текст, когда строк нет
 */
const BudgetPivotTable = ({
  entityTitle,
  entitySubtitle,
  rows,
  start,
  end,
  grouping,
  visibleCols,
  t,
  editable = true,
  totalEditable = false,
  hiddenRowIds = [],
  onPlanChange,
  loading = false,
  emptyLabel,
}) => {
  const [collapsedPeriods, setCollapsedPeriods] = useState({});
  const [expandedRows, setExpandedRows] = useState(() => {
    const init = {};
    const walk = (n) => {
      if (n.children?.length) init[n.id] = n.defaultExpanded !== false;
      n.children?.forEach(walk);
    };
    rows.forEach(walk);
    return init;
  });
  const [planOverrides, setPlanOverrides] = useState({});
  // правки плана в колонке «Итого» — они не привязаны к месяцу: rowId → сумма
  const [totalOverrides, setTotalOverrides] = useState({});
  const [editing, setEditing] = useState(null); // `${rowId}|${columnId}`

  // Пришло свежее дерево — локальные правки больше не нужны, в нём уже
  // пересчитанные бэкендом значения (сброс во время рендера, а не в эффекте)
  const [renderedRows, setRenderedRows] = useState(rows);
  if (renderedRows !== rows) {
    setRenderedRows(rows);
    setPlanOverrides({});
    setTotalOverrides({});
  }

  const labels = useMemo(
    () => ({
      total: t("periodTotal"),
      monthShort: (m, y) => `${t(`monthsShort.${m}`)}' ${String(y).slice(2)}`,
      monthFull: (m) => t(`months.${m}`),
      quarter: (q, y) =>
        grouping === "years"
          ? t("quarter", { q })
          : `${q} ${t("quarterShort")}' ${String(y).slice(2)}`,
      year: (y) => String(y),
    }),
    [t, grouping]
  );

  const columns = useMemo(
    () =>
      buildPeriodColumns({
        start,
        end,
        grouping,
        collapsed: collapsedPeriods,
        labels,
      }),
    [start, end, grouping, collapsedPeriods, labels]
  );

  const months = useMemo(() => columns[0]?.months || [], [columns]);
  const byRow = useMemo(
    () => buildMonthlyValues(rows, months, planOverrides),
    [rows, months, planOverrides]
  );

  const activeCols = useMemo(
    () =>
      COLUMN_DEFS.filter(
        (c) =>
          c.alwaysOn ||
          (visibleCols[c.key] && (!c.dependsOn || visibleCols[c.dependsOn]))
      ),
    [visibleCols]
  );
  const groupWidth = activeCols.length * T.cellWidth;

  const togglePeriod = useCallback((id) => {
    setCollapsedPeriods((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleRow = useCallback((id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /**
   * Собственная плановая сумма статьи по колонке — `plan.by` из API,
   * без подстатей. Показывается второй строкой под свёрнутым итогом и
   * подставляется в инпут при редактировании. У «Итого» это `plan.by`
   * за весь период, а не сумма месяцев.
   */
  const ownPlanFor = useCallback(
    (node, col) => {
      const months = col.months;
      const get = (m) =>
        planOverrides[`${node.id}|${m}`] ?? node.values?.[m]?.plan ?? 0;
      if (node.aggregation === "first") return get(months[0]);
      if (node.aggregation === "last") return get(months[months.length - 1]);
      if (col.kind === "total" && node.periodTotals) {
        if (node.aggregation === "percent") return null; // проценты не суммируются
        return totalOverrides[node.id] ?? node.periodOwnPlan ?? 0;
      }
      if (months.length === 1) return get(months[0]);
      if (node.aggregation === "percent") return null;
      return months.reduce((sum, m) => sum + get(m), 0);
    },
    [planOverrides, totalOverrides]
  );

  /** Правка плана: локально — сразу, на бэк — через onPlanChange. */
  const setPlanValue = useCallback(
    (rowId, month, amount) => {
      setPlanOverrides((prev) => ({ ...prev, [`${rowId}|${month}`]: amount }));
      onPlanChange?.({ rowId, month, amount });
    },
    [onPlanChange]
  );

  /**
   * Правка плана в колонке «Итого» — сумма пишется сразу на весь период
   * бюджета, поэтому месяц не передаём. Локальные месячные правки этой же
   * строки больше не нужны: бэк заменит их своим распределением.
   */
  const setTotalPlanValue = useCallback(
    (rowId, amount) => {
      setTotalOverrides((prev) => ({ ...prev, [rowId]: amount }));
      onPlanChange?.({ rowId, amount });
    },
    [onPlanChange]
  );

  const clearColumn = useCallback(
    (column) => {
      // чистим все планируемые статьи, в том числе те, у которых есть подстатьи
      const targets = [];
      const walk = (n) => {
        if (
          n.kind !== "computed" &&
          n.kind !== "ratio" &&
          !n.isPercent &&
          n.editable !== false
        ) {
          targets.push(n);
        }
        n.children?.forEach(walk);
      };
      rows.forEach(walk);

      setPlanOverrides((prev) => {
        const next = { ...prev };
        targets.forEach((n) => {
          column.months.forEach((m) => {
            next[`${n.id}|${m}`] = 0;
          });
        });
        return next;
      });

      // на бэк отправляем только реально непустые ячейки
      targets.forEach((n) => {
        column.months.forEach((m) => {
          const current =
            planOverrides[`${n.id}|${m}`] ?? n.values?.[m]?.plan ?? 0;
          if (current !== 0)
            onPlanChange?.({ rowId: n.id, month: m, amount: 0 });
        });
      });
    },
    [rows, planOverrides, onPlanChange]
  );

  /* -------------------------------------------------------------- */
  /* Рендер шапки                                                   */
  /* -------------------------------------------------------------- */

  /** Кнопка свёртки года / квартала — стоит сразу после подписи периода. */
  const CollapseBtn = ({ id, collapsed }) => (
    <button
      type="button"
      onClick={() => togglePeriod(id)}
      className="ml-1 inline-flex shrink-0 items-center"
      aria-label={collapsed ? t("actions.expand") : t("actions.collapse")}
    >
      <ExpanderIcon expanded={!collapsed} />
    </button>
  );

  /** Одна подпись периода в верхней части шапки (год / квартал / сам период). */
  const HeadLine = ({ label, node, collapsed = false }) => (
    <div
      className="flex items-center justify-end"
      style={{
        height: T.headLineHeight,
        fontSize: T.fontSize,
        fontWeight: 700,
        color: T.textHeading,
      }}
    >
      <span className="capitalize">{label}</span>
      {node && <CollapseBtn id={node.id} collapsed={collapsed} />}
    </div>
  );

  const renderHead = () => (
    <div
      className="sticky top-0 flex items-stretch bg-white"
      style={{ zIndex: 30, borderBottom: `1px solid ${T.border}` }}
    >
      {/* Первая колонка */}
      <div
        className="sticky left-0 flex shrink-0 flex-col justify-center bg-white"
        style={{
          zIndex: 31,
          width: T.titleColWidth,
          minWidth: T.titleColWidth,
          height: T.headerFirstRowHeight + T.headerSecondRowHeight,
          padding: `16px ${T.titlePadX}px`,
          borderRight: `1px solid ${T.border}`,
        }}
      >
        <div
          className="truncate"
          style={{
            fontSize: T.entityFontSize,
            lineHeight: "19px",
            fontWeight: 700,
            color: T.textHeading,
          }}
        >
          {entityTitle}
        </div>
        {entitySubtitle && (
          <div
            className="truncate"
            style={{
              marginTop: 6,
              fontSize: T.fontSize,
              lineHeight: "14px",
              color: T.textHeading,
            }}
          >
            {entitySubtitle}
          </div>
        )}
      </div>

      {/* Группы периодов */}
      <div className="flex items-stretch">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex shrink-0 flex-col"
            style={{
              width: groupWidth,
              borderLeft: `${T.sectionBorderWidth}px solid ${T.borderStrong}`,
            }}
          >
            {/* Верхняя часть: год / квартал / сам период — снизу вверх, по правому краю */}
            <div
              className="flex flex-col items-end justify-center"
              style={{
                height: T.headerFirstRowHeight,
                padding: `0 ${T.cellPadRight}px 0 0`,
              }}
            >
              {col.head.year && (
                <HeadLine label={col.head.year.label} node={col.head.year} />
              )}
              {col.head.quarter && (
                <HeadLine
                  label={col.head.quarter.label}
                  node={col.head.quarter}
                />
              )}
              <HeadLine
                label={col.head.self}
                node={col.head.collapsedNode}
                collapsed
              />
            </div>

            {/* Нижняя часть: план/факт/… */}
            <div
              className={`flex items-stretch ${R.headerSub}`}
              style={{
                height: T.headerSecondRowHeight,
                borderTop: `${T.groupBorderWidth}px solid ${T.borderStrong}`,
              }}
            >
              {activeCols.map((c, ci) => (
                <div
                  key={c.key}
                  className="flex shrink-0 items-center justify-end gap-1"
                  style={{
                    width: T.cellWidth,
                    padding: `0 ${T.cellPadRight}px 0 0`,
                    fontSize: T.fontSize,
                    lineHeight: T.headSubLineHeight,
                    fontWeight: 400,
                    color: T.textMuted,
                    borderRight:
                      ci === activeCols.length - 1
                        ? "none"
                        : `1px solid ${T.border}`,
                  }}
                >
                  <span className="whitespace-nowrap">
                    {t(`columns.${c.key}`)}
                  </span>
                  {c.key === "plan" && editable && col.kind === "month" && (
                    <RowActions
                      actions={[
                        { key: 'delete', icon: Trash2, label: t("actions.clearColumn"), onClick: () => clearColumn(col), danger: true },
                      ]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* -------------------------------------------------------------- */
  /* Рендер строк                                                   */
  /* -------------------------------------------------------------- */

  const renderCellContent = (colKey, metrics) => {
    const { plan, fact } = metrics;
    if (colKey === "plan") return formatMoney(plan);
    if (colKey === "fact") return formatMoney(fact);
    if (colKey === "planExec")
      return formatPercent(planExecution(plan, fact), t("na"));
    if (colKey === "deviation") return formatDeviation(deviation(metrics));
    if (colKey === "deviationPct")
      return formatPercent(deviationPercent(metrics), t("na"));
    return null;
  };

  /**
   * Знак значения расчётной колонки для окраски: плюс — зелёный, минус —
   * красный, ноль — обычный цвет. Округляем так же, как при выводе, чтобы
   * «0%» не оказался зелёным из-за сотых долей.
   */
  const signOf = (colKey, metrics) => {
    const { plan, fact } = metrics;
    let value = null;
    if (colKey === "planExec") value = planExecution(plan, fact);
    else if (colKey === "deviation") value = deviation(metrics);
    else if (colKey === "deviationPct") value = deviationPercent(metrics);
    if (value == null || !Number.isFinite(value)) return 0;
    return Math.sign(Math.round(value));
  };

  const renderRatioContent = (colKey, metrics) => {
    const { plan, fact } = metrics;
    if (colKey === "plan") return formatPercent(plan, t("na"));
    if (colKey === "fact") return formatPercent(fact, t("na"));
    if (colKey === "planExec")
      return formatPercent(planExecution(plan, fact), t("na"));
    if (colKey === "deviation")
      return formatPercent(
        fact == null || plan == null ? null : deviation(metrics),
        t("na")
      );
    if (colKey === "deviationPct")
      return formatPercent(deviationPercent(metrics), t("na"));
    return null;
  };

  const renderRow = (node, depth) => {
    if (hiddenRowIds.includes(node.id)) return null;
    const hasChildren = !!node.children?.length;
    const isExpanded = expandedRows[node.id] ?? node.defaultExpanded !== false;
    const isRatio = node.kind === "ratio" || !!node.isPercent;
    const bold = node.bold ?? depth === 0;
    // Расчётные строки (прибыль / рентабельность / остатки) в ПланФакт
    // отличаются от обычных только жирным начертанием — без фона и рамок
    const isResultRow =
      isRatio ||
      node.kind === "computed" ||
      node.apiType === "result" ||
      node.apiType === "total";
    // Статью с подстатьями тоже можно планировать: план пишется на неё саму,
    // а в ячейке показывается сумма с детьми
    const rowEditable = editable && !isResultRow && node.editable !== false;
    const rowClass = isResultRow ? R.result : depth === 0 ? R.section : R.leaf;

    return (
      <div key={node.id}>
        <div
          className="flex items-stretch"
          style={{ height: T.rowHeight, borderBottom: `1px solid ${T.border}` }}
        >
          {/* Название статьи */}
          <div
            className={`sticky left-0 flex shrink-0 items-center ${rowClass}`}
            style={{
              zIndex: 10,
              width: T.titleColWidth,
              minWidth: T.titleColWidth,
              paddingLeft: T.indentBase + depth * T.indentStep,
              paddingRight: T.titlePadX,
              borderRight: `1px solid ${T.border}`,
              fontSize: T.fontSize,
              lineHeight: T.lineHeight,
              fontWeight: bold ? 600 : 400,
              color: bold ? T.textHeading : T.text,
            }}
          >
            {/* Строки без подстатей в ПланФакт не отбиваются пустым местом
                под иконку — текст начинается сразу от отступа уровня */}
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleRow(node.id)}
                className="inline-flex shrink-0 items-center"
                style={{ marginRight: T.expanderGap }}
                aria-label={
                  isExpanded ? t("actions.collapse") : t("actions.expand")
                }
              >
                <ExpanderIcon expanded={isExpanded} />
              </button>
            )}
            <span className="truncate" title={node.label}>
              {node.label}
            </span>
          </div>

          {/* Значения */}
          <div className="flex items-stretch">
            {columns.map((col) => {
              const metrics = aggregateNode(
                node,
                byRow,
                col,
                planOverrides,
                totalOverrides
              );

              return (
                <div
                  key={col.id}
                  className={`flex shrink-0 items-stretch ${rowClass}`}
                  style={{
                    width: groupWidth,
                    borderLeft: `${T.sectionBorderWidth}px solid ${T.borderStrong}`,
                  }}
                >
                  {activeCols.map((c, i) => {
                    const isLastCell = i === activeCols.length - 1;
                    const isTotalCell = col.kind === "total";
                    const isEditableCell =
                      rowEditable &&
                      c.key === "plan" &&
                      (col.kind === "month" || (isTotalCell && totalEditable));
                    // Ключ колонки, а не месяца: «Итого» и свёрнутые периоды
                    // начинаются с того же месяца, что и обычная месячная
                    // колонка, и на общем ключе инпут монтировался бы дважды —
                    // autoFocus последнего сбрасывал blur предыдущего.
                    const editKey = `${node.id}|${col.id}`;
                    // Редактируем собственную сумму статьи (`plan.by`), а не
                    // свёрнутую с подстатьями — её и пишет create_budget_plan
                    const ownPlan = ownPlanFor(node, col) ?? 0;
                    const isEditing = isEditableCell && editing === editKey;

                    if (isEditing) {
                      return (
                        <div
                          key={c.key}
                          className="flex shrink-0 items-center"
                          style={{
                            width: T.cellWidth,
                            background: T.accentWash,
                            boxShadow: `inset 0 0 0 1px ${T.accent}`,
                            borderRight: isLastCell
                              ? "none"
                              : `1px solid ${T.border}`,
                          }}
                        >
                          {/* Инпут в ПланФакт без своей рамки: рамку рисует ячейка */}
                          <input
                            autoFocus
                            defaultValue={toInputValue(ownPlan)}
                            onBlur={(e) => {
                              const parsed =
                                parseInputNumber(e.target.value) ?? 0;
                              if (parsed !== ownPlan) {
                                if (isTotalCell)
                                  setTotalPlanValue(node.id, parsed);
                                else
                                  setPlanValue(node.id, col.months[0], parsed);
                              }
                              setEditing(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="w-full bg-transparent text-right tabular-nums outline-none"
                            style={{
                              padding: `6px ${T.cellPadRight}px`,
                              fontSize: T.fontSize,
                              lineHeight: T.lineHeight,
                              fontWeight: 400,
                              color: T.text,
                            }}
                          />
                        </div>
                      );
                    }

                    // «Вып. плана, %», «Откл.» и «Откл., %» красим по знаку
                    const sign =
                      c.key === "plan" || c.key === "fact"
                        ? 0
                        : signOf(c.key, metrics);
                    const color =
                      sign > 0 ? T.positive : sign < 0 ? T.negative : undefined;

                    // У статьи с подстатьями показываем её собственный план
                    // (`plan.by`) второй строкой под свёрнутой суммой
                    const showOwnPlan =
                      c.key === "plan" &&
                      hasChildren &&
                      !isRatio &&
                      ownPlan !== 0 &&
                      ownPlan !== metrics.plan;

                    // Значение не влезает в колонку — обрезаем и показываем
                    // полное в подсказке, чтобы не наползало на соседние
                    const cellText = isRatio
                      ? renderRatioContent(c.key, metrics)
                      : renderCellContent(c.key, metrics);

                    return (
                      <CellShell
                        key={c.key}
                        bold={bold}
                        isLast={isLastCell}
                        className={isEditableCell ? R.editable : ""}
                        onClick={
                          isEditableCell ? () => setEditing(editKey) : undefined
                        }
                      >
                        <span className="flex min-w-0 flex-col items-end">
                          <span
                            className="max-w-full truncate"
                            title={
                              typeof cellText === "string"
                                ? cellText
                                : undefined
                            }
                            style={{
                              lineHeight: "16px",
                              ...(color ? { color } : {}),
                            }}
                          >
                            {cellText}
                          </span>
                          {showOwnPlan && (
                            <span
                              className="max-w-full truncate"
                              style={{
                                fontSize: 10.5,
                                lineHeight: "13px",
                                fontWeight: 400,
                                color: T.textMuted,
                                opacity: 0.6,
                              }}
                              title={t("columns.plan")}
                            >
                              {formatMoney(ownPlan)}
                            </span>
                          )}
                        </span>
                      </CellShell>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {hasChildren &&
          isExpanded &&
          node.children.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div
        className="flex flex-1 items-center justify-center bg-white"
        style={{ color: T.textMuted, fontSize: T.fontSize }}
      >
        {emptyLabel}
      </div>
    );
  }

  // overflow-hidden/border-radius на обёртке ломает sticky-шапку и первую
  // колонку, поэтому таблица остаётся во всю ширину без «карточки».
  // Горизонтальная прокрутка — наше отличие от ПланФакт: там ширина периодов
  // просто обрезается, здесь колонки доступны скроллом при закреплённой
  // первой колонке и шапке.
  return (
    <div
      className="flex-1 overflow-auto bg-white"
      style={{ borderTop: `1px solid ${T.border}` }}
    >
      <div className="min-w-max">
        {renderHead()}
        {rows.map((node) => renderRow(node, 0))}
      </div>
    </div>
  );
};

export default BudgetPivotTable;
