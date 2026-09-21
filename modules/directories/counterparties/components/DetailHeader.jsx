import NewDateRangeComponent from '@/components/directories/NewDateRangeComponent'
import Segmented from '@/components/shared/Segmented/Segmented'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import RowActionsTrigger from '@/components/shared/RowActions/RowActionsTrigger'
import counterpartiesStore from '@/store/counterparties.store'
import { formatDate } from '@/utils/formatDate'
import { ArrowLeft, FileDown, Loader2, PenLine, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

/** Инициалы контрагента — как в строках списка контрагентов. */
const initials = (name) =>
  (name || '')
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

/**
 * Шапка карточки контрагента: ссылка к списку, инициалы, название, полное
 * имя и ИНН; справа — акт сверки и меню. Под ней — период и метод учёта
 * (переключателем, а не выпадающим списком).
 */
const DetailHeader = ({
  t, tc, counterpartyInfo,
  backHref = '/directories/counterparties', backLabel,
  filters, setFilters,
  canEdit, canDelete,
  onEdit, onDelete,
  onDownloadPdf, isDownloadingPdf
}) => {
  const tl = useTranslations('Directories.counterparty.list')
  const name = counterpartyInfo?.name || tc('noName')

  return (
    <div className="shrink-0 px-6 pt-4">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {backLabel || t('backToList')}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-base font-semibold text-slate-700">
            {initials(name) || '—'}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-semibold text-slate-900">{name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {counterpartyInfo?.fullName && counterpartyInfo.fullName !== name && (
                <span className="truncate text-slate-500">{counterpartyInfo.fullName}</span>
              )}
              {counterpartyInfo?.inn && (
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-slate-600">
                  {t('info.inn')} <span className="tabular-nums">{counterpartyInfo.inn}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => { if (!isDownloadingPdf) onDownloadPdf?.() }}
            disabled={isDownloadingPdf}
            className="secondary-btn h-9 gap-2"
          >
            {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {t('actions.downloadPdf')}
          </button>
          {/* меню доступно всегда: скачать акт сверки может любой, кто видит карточку */}
          <Popover>
            <PopoverTrigger asChild>
              <RowActionsTrigger />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 rounded-md overflow-hidden p-0 border border-gray-50! ring ring-neutral-100 bg-white shadow-md mt-1">
              <div className="flex flex-col">
                <span
                  className={`flex items-center px-4 py-3 text-sm text-slate-900 transition-colors hover:bg-slate-100 ${isDownloadingPdf ? 'opacity-60 cursor-progress' : 'cursor-pointer'}`}
                  onClick={() => { if (!isDownloadingPdf) onDownloadPdf?.() }}
                >
                  {isDownloadingPdf
                    ? <Loader2 size={18} className="mr-3 text-slate-700 animate-spin" />
                    : <FileDown size={18} className="mr-3 text-slate-700" />}
                  {t('actions.downloadPdf')}
                </span>
                {canEdit && (
                  <span className="flex items-center px-4 py-3 text-sm text-slate-900 cursor-pointer transition-colors hover:bg-slate-100" onClick={onEdit}>
                    <PenLine size={18} className="mr-3 text-slate-700 cursor-pointer" />
                    {tc('edit')}
                  </span>
                )}
                {canDelete && (
                  <span className="flex items-center px-4 py-3 text-sm text-red-500 cursor-pointer transition-colors hover:bg-red-50" onClick={onDelete}>
                    <Trash2 size={18} className="mr-3 text-red-500" />
                    {tc('delete')}
                  </span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Период и метод учёта — от них зависят все суммы на странице */}
      <div className="mt-4 mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="w-[260px]">
          <NewDateRangeComponent
            value={filters.dateRange}
            onChange={(range) => {
              const startDate = range?.start ? formatDate(new Date(range.start)) : ''
              const endDate = range?.end ? formatDate(new Date(range.end)) : ''
              setFilters((prev) => ({ ...prev, operationDateStart: startDate, operationDateEnd: endDate, dateRange: range }))
            }}
            present={counterpartiesStore.singePageDateRangeType}
            onSetPresent={present => counterpartiesStore.setState('singePageDateRangeType', present)}
            onClear={() => counterpartiesStore.setState('singePageDateRangeType', '')}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{tl('methodLabel')}</span>
          <Segmented
            ariaLabel={tl('methodLabel')}
            value={filters?.calculationMethod || 'Cashflow'}
            onChange={(selected) => setFilters(prev => ({ ...prev, calculationMethod: selected }))}
            options={[
              { value: 'Cashflow', label: tl('calculationShort.cashflow') },
              { value: 'Cash', label: tl('calculationShort.cash') },
              { value: 'Calculation', label: tl('calculationShort.calculation') },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default DetailHeader
