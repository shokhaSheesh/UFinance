import { ucodeRequest } from "@/lib/api/ucode/base";

const defaultGetItems = (page) => page?.data?.data ?? [];

const defaultSetItems = (page, items) => ({
  ...page,
  data: { ...page?.data, data: items },
});

const defaultGetKey = (item) => item?.guid;

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
  const indexes = [];
  for (let i = targetIndex; i <= to; i++) indexes.push(i);

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
