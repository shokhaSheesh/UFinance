/**
 * Пока открывается страница раздела — каркас на месте контента: меню и шапка
 * остаются, а вместо пустоты видно, что страница грузится (заголовок,
 * карточки итогов, строки таблицы).
 */
export default function PagesLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="fixed left-[var(--sidebar-w)] right-[var(--ai-w,0px)] top-[60px] bottom-0 overflow-hidden bg-canvas px-6"
    >
      <div className="flex h-16 items-center justify-between">
        <div className="h-6 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-[108px] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex h-14 items-center border-b border-slate-200 px-4">
          <div className="h-9 w-80 animate-pulse rounded-lg bg-slate-100" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-[52px] items-center gap-6 border-b border-slate-100 px-4">
            <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3.5 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <span className="sr-only">Загрузка…</span>
    </div>
  )
}
