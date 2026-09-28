'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import { cn } from '@/lib/utils'
import { Check, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

/**
 * Поля мобильной формы.
 *
 * На телефоне выпадающий список неудобен: он открывается поверх поля, в него
 * сложно попасть пальцем и в нём не видно поиска. Поэтому значение
 * выбирается панелью снизу во весь экран — с поиском и крупными строками,
 * а само поле показывает только подпись и выбранное значение.
 */

/** Строка формы: подпись сверху, значение снизу, разделитель под строкой. */
export function MFieldRow({ label, required, error, children, onClick, className }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-slate-100 py-3 text-left last:border-b-0',
        onClick && 'active:bg-slate-50',
        className
      )}
    >
      <span className="text-xs text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </Tag>
  )
}

/** Поле, открывающее панель выбора. */
export function MSelectField({
  label,
  required,
  placeholder,
  value,
  error,
  options = [],
  loading = false,
  searchable = true,
  search,
  onSearch,
  onChange,
  renderValue,
}) {
  const t = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  // Ищем на месте, когда список пришёл целиком; иначе поиск уходит на сервер
  const visible = useMemo(() => {
    if (onSearch || !query.trim()) return options
    const needle = query.trim().toLowerCase()
    return options.filter((option) => String(option.label || '').toLowerCase().includes(needle))
  }, [options, query, onSearch])

  return (
    <>
      <MFieldRow label={label} required={required} error={error} onClick={() => setOpen(true)}>
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[15px]',
              selected ? 'font-medium text-slate-900' : 'text-slate-400'
            )}
          >
            {selected ? renderValue?.(selected) || selected.label : placeholder}
          </span>
          <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden="true" />
        </span>
      </MFieldRow>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={label} className="h-[80vh]">
        {searchable && (
          <div className="mb-2 flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3.5">
            <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
            <input
              value={onSearch ? search : query}
              onChange={(event) => (onSearch ? onSearch(event.target.value) : setQuery(event.target.value))}
              placeholder={t('search')}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {(onSearch ? search : query) && (
              <button
                type="button"
                onClick={() => (onSearch ? onSearch('') : setQuery(''))}
                className="shrink-0 text-slate-400"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">{t('noData')}</p>
        )}

        <div className="flex flex-col">
          {visible.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value, option)
                  setOpen(false)
                }}
                className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', active ? 'font-semibold text-[#0e73f6]' : 'text-slate-900')}>
                    {option.label}
                  </span>
                  {option.sub && <span className="mt-0.5 block truncate text-xs text-slate-500">{option.sub}</span>}
                </span>
                {active && <Check size={17} className="shrink-0 text-[#0e73f6]" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}

/** Крупное поле суммы — первое, что заполняют на телефоне. */
export function MAmountField({ value, onChange, currency, error, autoFocus }) {
  const t = useTranslations('Operations')
  return (
    <div className="rounded-[20px] bg-white px-4 py-4">
      <div className="text-xs text-slate-500">{t('columns.amount')}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-[30px] leading-tight font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
        />
        <span className="shrink-0 text-base font-semibold text-slate-400">{currency}</span>
      </div>
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  )
}

/** Дата: родное поле телефона, но в оформлении строки формы. */
export function MDateField({ label, required, value, onChange, error }) {
  return (
    <MFieldRow label={label} required={required} error={error}>
      <input
        type="date"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none"
      />
    </MFieldRow>
  )
}

/** Переключатель: подтвердить оплату, подтвердить начисление. */
export function MSwitch({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
      <span
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-[#0e73f6]' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </span>
    </button>
  )
}

/** Многострочное поле: назначение платежа, комментарий. */
export function MTextField({ label, required, value, onChange, placeholder, error, rows = 3 }) {
  return (
    <MFieldRow label={label} required={required} error={error}>
      <textarea
        rows={rows}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
      />
    </MFieldRow>
  )
}
