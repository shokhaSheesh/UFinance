'use client'

import BottomSheet from '@/components/mobile/BottomSheet'
import CalendarSheet from '@/components/mobile/CalendarSheet'
import { cn } from '@/lib/utils'
import { CalendarDays, Check, ChevronDown, ChevronRight, Eye, EyeOff, Loader2, Search, X } from 'lucide-react'
import moment from 'moment'
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
        'flex w-full flex-col gap-0.5 rounded-2xl bg-white px-4 py-3 text-left',
        error && 'ring-1 ring-red-300',
        onClick && 'active:bg-slate-50',
        className
      )}
    >
      <span className="text-[11px] text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="pt-0.5 text-[11px] text-red-600">{error}</span>}
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
  avatars = false,
  variant = 'row',
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
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex max-w-[62%] shrink-0 items-center gap-1.5 rounded-full bg-slate-100 py-2 pr-2.5 pl-3 text-left active:bg-slate-200"
        >
          <span className="min-w-0 truncate text-[14px] font-semibold text-slate-900">
            {selected ? renderValue?.(selected) || selected.label : placeholder}
          </span>
          <ChevronDown size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      ) : (
      <MFieldRow label={label} required={required} error={error} onClick={() => setOpen(true)}>
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[16px]',
              selected ? 'font-semibold text-slate-900' : 'text-slate-400'
            )}
          >
            {selected ? renderValue?.(selected) || selected.label : placeholder}
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        </span>
      </MFieldRow>
      )}

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
                {avatars && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[14px] font-bold text-slate-500">
                    {String(option.label || '?').trim().slice(0, 1).toUpperCase()}
                  </span>
                )}
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
    <div className="rounded-[24px] bg-white px-4 py-5 text-center">
      <div className="text-[11px] font-semibold tracking-[0.06em] text-slate-400 uppercase">{t('columns.amount')}</div>
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0"
          className="min-w-0 max-w-full bg-transparent text-center text-[38px] leading-none font-bold tracking-[-0.02em] tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
          style={{ width: `${Math.max(String(value || '0').length, 1)}ch` }}
        />
        <span className="shrink-0 text-lg font-semibold text-slate-400">{currency}</span>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  )
}

/** Дата: строка формы, которая открывает календарь панелью снизу. */
export function MDateField({ label, required, value, onChange, error }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <MFieldRow label={label} required={required} error={error} onClick={() => setOpen(true)}>
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-slate-900">
            {value ? moment(value).format('D MMMM YYYY') : '—'}
          </span>
          <CalendarDays size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        </span>
      </MFieldRow>

      <CalendarSheet open={open} onClose={() => setOpen(false)} value={value} onChange={onChange} title={label} />
    </>
  )
}

/** Переключатель: подтвердить оплату, подтвердить начисление. */
export function MSwitch({ label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left"
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

/** Пароль: то же поле, но со значком «показать». */
export function MPasswordField({ label, value, onChange, placeholder, error, autoComplete = 'off' }) {
  const [visible, setVisible] = useState(false)

  return (
    <MFieldRow label={label} error={error}>
      <span className="flex items-center gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="shrink-0 text-slate-400 active:text-slate-600"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </MFieldRow>
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
        className="w-full resize-none bg-transparent text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
      />
    </MFieldRow>
  )
}

/**
 * Выбор нескольких значений: юрлица, статьи, сделки в фильтрах.
 *
 * Строка показывает, сколько выбрано, а сам выбор — в панели снизу с
 * поиском и галочками. Выбор применяется кнопкой «Готово», а не каждым
 * касанием: иначе на каждую галочку уходил бы новый запрос.
 */
export function MMultiSelectField({ label, placeholder, value = [], options = [], loading = false, onChange }) {
  const t = useTranslations('Common')
  const tf = useTranslations('filters')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState(value)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => String(option.label || '').toLowerCase().includes(needle))
  }, [options, query])

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label)

  const openSheet = () => {
    setDraft(value)
    setQuery('')
    setOpen(true)
  }

  const toggle = (optionValue) =>
    setDraft((prev) => (prev.includes(optionValue) ? prev.filter((item) => item !== optionValue) : [...prev, optionValue]))

  return (
    <>
      <MFieldRow label={label} onClick={openSheet}>
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-[16px]',
              value.length ? 'font-semibold text-slate-900' : 'text-slate-400'
            )}
          >
            {value.length === 0
              ? placeholder || tf('all')
              : value.length === 1
                ? selectedLabels[0] || tf('selectedCount', { count: 1 })
                : tf('selectedCount', { count: value.length })}
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
        </span>
      </MFieldRow>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        className="h-[80vh]"
        footer={
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setDraft([])}
              className="h-12 flex-1 rounded-full bg-slate-100 text-[15px] font-semibold text-slate-700"
            >
              {tf('reset')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
              className="h-12 flex-1 rounded-full bg-[#0e73f6] text-[15px] font-semibold text-white"
            >
              {draft.length ? tf('doneWithCount', { count: draft.length }) : tf('done')}
            </button>
          </div>
        }
      >
        <div className="mb-2 flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-3.5">
          <Search size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="shrink-0 text-slate-400">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" aria-hidden="true" />
          </div>
        )}
        {!loading && visible.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{t('noData')}</p>}

        <div className="flex flex-col">
          {visible.map((option) => {
            const active = draft.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex items-center gap-3 border-b border-slate-100 py-3.5 text-left last:border-b-0 active:bg-slate-50"
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
                    active ? 'border-[#0e73f6] bg-[#0e73f6] text-white' : 'border-slate-300'
                  )}
                >
                  {active && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-sm', active ? 'font-semibold text-slate-900' : 'text-slate-800')}>
                    {option.label}
                  </span>
                  {option.sub && <span className="mt-0.5 block truncate text-xs text-slate-500">{option.sub}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}
