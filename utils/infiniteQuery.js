import { ucodeRequest } from "@/lib/api/ucode/base";

const defaultGetItems = (page) => page?.data?.data ?? [];

const defaultSetItems = (page, items) => ({
  ...page,
  data: { ...page?.data, data: items },
});

const defaultGetKey = (item) => item?.guid;

const toDay = (value) =>
  typeof value === "string" ? value.slice(0, 10) : value;

const compareDay = (a, b) => {
  const x = toDay(a);
  const y = toDay(b);
  if (x === y) return 0;
  return x > y ? 1 : -1;
};

const isEmptyValue = (value) =>
  value === null || value === undefined || value === "";

const detectDirection = (values, compare) => {
  let asc = true;
  let desc = true;
  for (let i = 1; i < values.length; i++) {
    const diff = compare(values[i - 1], values[i]);
    if (diff > 0) asc = false;
    if (diff < 0) desc = false;
  }
  if (asc && desc) return "desc";
  if (desc) return "desc";
  if (asc) return "asc";
  return null;
};

// Ключ вида [method, filters] — контракт useUcodeRequestInfinite. Списки со
// своими ключами (например ['list_operations_by_query', dealId, 'income'])
// точечно не патчим: их фильтры лежат не в ключе, а в queryFn.
const isFilterQueryKey = (key) =>
  Array.isArray(key) &&
  key.length === 2 &&
  !!key[1] &&
  typeof key[1] === "object" &&
  !Array.isArray(key[1]);

async function applyFreshPages({
  queryClient,
  queryKey,
  method,
  data,
  cached,
  indexes,
  getItems,
  setItems,
  getKey,
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  const pageParamAt = (i) => cached?.pageParams?.[i] ?? i + 1;

  await queryClient.cancelQueries({ queryKey, exact: true });

  const freshPages = await Promise.all(
    indexes.map((i) =>
      ucodeRequest({ method, data: { ...data, page: pageParamAt(i) } })
    )
  );

  queryClient.setQueryData(queryKey, (old) => {
    if (!old?.pages) return old;

    const nextPages = old.pages.slice();
    indexes.forEach((pageIndex, i) => {
      if (pageIndex < nextPages.length) nextPages[pageIndex] = freshPages[i];
    });

    const seen = new Set();
    const dedupedPages = nextPages.map((page) => {
      const items = getItems(page);
      const unique = items.filter((item) => {
        const key = getKey(item);
        if (key === undefined || key === null) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return unique.length === items.length ? page : setItems(page, unique);
    });

    return { ...old, pages: dedupedPages };
  });

  return true;
}

const buildRange = (from, to) => {
  const indexes = [];
  for (let i = from; i <= to; i++) indexes.push(i);
  return indexes;
};

export async function refetchInfinitePagesAfter({
  queryClient,
  queryKey,
  method,
  data = {},
  isTarget,
  lookahead = 1,
  getItems = defaultGetItems,
  setItems = defaultSetItems,
  getKey = defaultGetKey,
}) {
  const cached = queryClient.getQueryData(queryKey);
  const pages = cached?.pages;
  if (!Array.isArray(pages) || pages.length === 0) return false;

  const targetIndex = pages.findIndex((page) => getItems(page).some(isTarget));
  if (targetIndex === -1) return false;

  const to = Math.min(pages.length - 1, targetIndex + lookahead);

  return applyFreshPages({
    queryClient,
    queryKey,
    method,
    data,
    cached,
    indexes: buildRange(targetIndex, to),
    getItems,
    setItems,
    getKey,
  });
}

/**
 * Диапазон страниц, на которые может попасть элемент со значением `value`.
 * Страницы отсортированы, поэтому хватает границ каждой страницы:
 * `start` — первая страница, чей последний элемент уже «не раньше» value,
 * `end` — последняя страница, чей первый элемент ещё «не позже» value.
 * Если end < start, значит место вставки приходится на стык двух страниц —
 * тогда диапазон разворачивается и покрывает обе.
 */
const findInsertRange = ({
  pages,
  getItems,
  getSortValue,
  isTarget,
  compare,
  value,
}) => {
  const bounds = [];
  const flat = [];

  for (const page of pages) {
    const values = getItems(page)
      .filter((item) => !isTarget(item))
      .map(getSortValue)
      .filter((v) => !isEmptyValue(v));
    if (!values.length) return null;
    bounds.push({ first: values[0], last: values[values.length - 1] });
    flat.push(...values);
  }

  const direction = detectDirection(flat, compare);
  if (!direction) return null;

  // сравнение «в порядке сортировки»: <= 0 значит a идёт раньше b
  const cmp = (a, b) => (direction === "desc" ? compare(b, a) : compare(a, b));

  const start = bounds.findIndex((b) => cmp(b.last, value) >= 0);
  if (start === -1) return null;

  let end = -1;
  for (let i = bounds.length - 1; i >= 0; i--) {
    if (cmp(bounds[i].first, value) <= 0) {
      end = i;
      break;
    }
  }

  return { from: Math.max(0, Math.min(start, end)), to: Math.max(start, end) };
};

export async function refetchInfinitePagesForUpdate({
  queryClient,
  queryKey,
  method,
  data = {},
  isTarget,
  getSortValue,
  newSortValue,
  compare = compareDay,
  lookahead = 1,
  getItems = defaultGetItems,
  setItems = defaultSetItems,
  getKey = defaultGetKey,
}) {
  const cached = queryClient.getQueryData(queryKey);
  const pages = cached?.pages;
  if (!Array.isArray(pages) || pages.length === 0) return false;

  const targetIndex = pages.findIndex((page) => getItems(page).some(isTarget));
  if (targetIndex === -1) return false;

  let from = targetIndex;
  let to = targetIndex;

  const targetItem = getItems(pages[targetIndex]).find(isTarget);
  const oldSortValue = getSortValue?.(targetItem);
  const moved =
    typeof getSortValue === "function" &&
    !isEmptyValue(newSortValue) &&
    !isEmptyValue(oldSortValue) &&
    compare(oldSortValue, newSortValue) !== 0;

  if (moved) {
    const range = findInsertRange({
      pages,
      getItems,
      getSortValue,
      isTarget,
      compare,
      value: newSortValue,
    });
    // элемент уехал за пределы загруженных страниц или порядок не распознан
    if (!range) return false;
    from = Math.min(from, range.from);
    to = Math.max(to, range.to);
  }

  return applyFreshPages({
    queryClient,
    queryKey,
    method,
    data,
    cached,
    indexes: buildRange(from, Math.min(pages.length - 1, to + lookahead)),
    getItems,
    setItems,
    getKey,
  });
}

/**
 * То же, но для всех активных infinite-запросов с данным префиксом ключа —
 * вызывающему коду не нужно знать текущие фильтры списка.
 * Ключ строится как [method, data] (см. useUcodeRequestInfinite).
 */
export async function refetchInfiniteQueriesForUpdate({
  queryClient,
  queryKeyPrefix,
  ...options
}) {
  const all = queryClient
    .getQueryCache()
    .findAll({ queryKey: queryKeyPrefix, type: "active" });

  const queries = all.filter((q) => isFilterQueryKey(q.queryKey));
  // остальные списки с тем же методом (детали сделки, закупки) обновляем
  // обычной инвалидацией — их queryFn сам знает свои фильтры
  all
    .filter((q) => !isFilterQueryKey(q.queryKey))
    .forEach((q) =>
      queryClient.invalidateQueries({ queryKey: q.queryKey, exact: true })
    );

  // если точечно патчить нечего, но «чужие» списки мы инвалидировали —
  // считаем задачу выполненной, чтобы вызывающий код не делал полный refetch
  if (!queries.length) return all.length > 0;

  const results = await Promise.all(
    queries.map((query) =>
      refetchInfinitePagesForUpdate({
        queryClient,
        queryKey: query.queryKey,
        method: query.queryKey[0],
        data: query.queryKey[1],
        ...options,
      })
    )
  );

  // остальные (неактивные фильтры) просто помечаем устаревшими — без запросов
  queryClient.invalidateQueries({
    queryKey: queryKeyPrefix,
    type: "inactive",
    refetchType: "none",
  });

  return results.every(Boolean);
}
