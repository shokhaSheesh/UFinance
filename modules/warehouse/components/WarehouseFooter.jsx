import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const PagerButton = ({ disabled, onClick, label, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 cursor-pointer transition-colors enabled:hover:border-slate-300 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
)

/**
 * Подвал таблицы остатков — только постраничная навигация. Итоги
 * (позиций, остатки, суммы) переехали в карточки над таблицей.
 */
const WarehouseFooter = ({ t, page, totalPages, total, limit, onPageChange }) => {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex shrink-0 items-center justify-end gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
      <PagerButton disabled={page <= 1} onClick={() => onPageChange(1)} label="«">
        <ChevronsLeft size={16} />
      </PagerButton>
      <PagerButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="‹">
        <ChevronLeft size={16} />
      </PagerButton>
      <span className="min-w-max px-2 tabular-nums">{t('footer.pageInfo', { from, to, total })}</span>
      <PagerButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="›">
        <ChevronRight size={16} />
      </PagerButton>
      <PagerButton disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} label="»">
        <ChevronsRight size={16} />
      </PagerButton>
    </div>
  )
}

export default WarehouseFooter
