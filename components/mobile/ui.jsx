'use client'

import Money from '@/components/shared/Money'
import { cn } from '@/lib/utils'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Набор частей мобильного приложения.
 *
 * Телефонные экраны собраны не из настольных блоков: на большом экране
 * содержимое лежит в таблицах с рамками и мелким шрифтом, а здесь — мягкие
 * белые карточки на сером поле, крупные строки со значком слева и суммой
 * справа, разделы с надписью-эпиграфом. Цвета и шрифт — общие с вебом,
 * строение — своё.
 */

/** Круглый значок раздела или операции. */
export function TileIcon({ icon: Icon, tone = 'neutral', className }) {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-500',
    brand: 'bg-[#e8f1ff] text-[#0e73f6]',
    in: 'bg-emerald-50 text-emerald-600',
    out: 'bg-red-50 text-red-600',
  }[tone]

  return (
    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', toneClass, className)}>
      <Icon size={19} aria-hidden="true" />
    </span>
  )
}

/**
 * Шапка экрана: стрелка и действие в одной строке, под ними крупный
 * заголовок. Так делают банковские приложения: заголовок читается с
 * расстояния и не жмётся между кнопками.
 */
export function MScreenHeader({ title, subtitle, onBack, action, className }) {
  return (
    <div className={cn('pt-1 pb-3', className)}>
      {(onBack || action) && (
        <div className="flex h-10 items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 active:bg-slate-200"
            >
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-[-0.02em] text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>}
    </div>
  )
}

/** Небольшая кнопка-«таблетка» над списком: тип, период, метод. */
export function FilterPill({ label, value, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-semibold',
        active ? 'bg-[#0e73f6] text-white' : 'bg-white text-slate-600'
      )}
    >
      {label}
      {value && <span className={cn('font-bold', active ? 'text-white' : 'text-slate-900')}>{value}</span>}
      <ChevronDown size={14} aria-hidden="true" className={active ? 'text-white/80' : 'text-slate-400'} />
    </button>
  )
}

/** Белая карточка: либо с отступами, либо как список строк (`list`). */
export function MCard({ list = false, className, children, ...props }) {
  return (
    <div
      className={cn('rounded-[24px] bg-white', list ? 'px-4' : 'p-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/** Строка списка внутри карточки: значок, название, подпись, значение справа. */
export function MRow({ icon, tone, title, subtitle, value, valueSub, chevron = false, onClick, className }) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b border-slate-100 py-4 text-left last:border-b-0',
        onClick && 'active:bg-slate-50',
        className
      )}
    >
      {icon && <TileIcon icon={icon} tone={tone} />}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>}
      </div>

      {value !== undefined && (
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm font-semibold text-slate-900 tabular-nums">{value}</span>
          {valueSub && <span className="mt-0.5 text-[11px] text-slate-400">{valueSub}</span>}
        </div>
      )}

      {chevron && <ChevronRight size={17} className="shrink-0 text-slate-300" aria-hidden="true" />}
    </Tag>
  )
}

/** Надпись над разделом и ссылка справа: «СЧЕТА · Все». */
export function SectionHead({ title, action, onAction, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-1 pt-6 pb-2.5', className)}>
      {onAction ? (
        <button type="button" onClick={onAction} className="flex items-center gap-1 text-left">
          <span className="text-[15px] font-bold text-slate-900">{title}</span>
          <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
        </button>
      ) : (
        <span className="text-[15px] font-bold text-slate-900">{title}</span>
      )}
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-[13px] font-semibold text-[#0e73f6]">
          {action}
        </button>
      )}
    </div>
  )
}

/**
 * Главная карточка с остатком: синяя, во всю ширину.
 * Единственное цветное пятно на экране — по ней сразу понятно, где деньги.
 */
export function HeroCard({ label, amount, currency, note, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0e73f6] via-[#0b5fd4] to-[#0a49a8] px-5 py-6 text-left text-white active:opacity-95"
    >
      <span className="pointer-events-none absolute -right-2 bottom--2 text-[64px] leading-none font-extrabold text-white/10 select-none">
        UF
      </span>

      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-white/80 uppercase">{label}</span>
        {badge}
      </div>

      <div className="mt-2 text-[32px] leading-none font-bold tracking-[-0.02em]">
        <Money value={amount} currency={currency} />
      </div>

      {note && <div className="mt-3 max-w-[70%] text-xs leading-relaxed text-white/80">{note}</div>}
    </button>
  )
}

/** Чип с изменением за период — поверх синей карточки. */
export function DeltaChip({ children, positive = true }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold',
        positive ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
      )}
    >
      {children}
    </span>
  )
}

/** Круглые кнопки под главной карточкой: создать операцию, открыть отчёты. */
export function QuickActions({ actions = [] }) {
  return (
    <div className="mt-5 flex items-start justify-between gap-1.5">
      {actions.map(({ key, label, icon: Icon, onClick }) => (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 flex-col items-center gap-2"
        >
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[#0e73f6] shadow-[0_2px_10px_rgba(15,23,42,0.06)] active:bg-slate-100">
            <Icon size={21} aria-hidden="true" />
          </span>
          <span className="w-full truncate text-center text-[11px] font-medium text-slate-500">{label}</span>
        </button>
      ))}
    </div>
  )
}

/** Две небольшие карточки в ряд: доходы и расходы, долги нам и наши. */
export function StatTile({ label, value, currency, note, tone = 'neutral', onClick }) {
  const valueClass = {
    neutral: 'text-slate-900',
    in: 'text-emerald-600',
    out: 'text-red-600',
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col gap-1 rounded-[20px] bg-white px-4 py-3.5 text-left active:bg-slate-50"
    >
      <span className="truncate text-xs text-slate-500">{label}</span>
      <span className={cn('truncate text-[17px] font-bold tabular-nums', valueClass)}>
        <Money value={value} currency={currency} />
      </span>
      {note && <span className="truncate text-[11px] text-slate-400">{note}</span>}
    </button>
  )
}

/** Пустое место экрана: значок, строка и объяснение. */
export function MEmpty({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
      {Icon && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      <span className="text-sm font-semibold text-slate-700">{title}</span>
      {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      {action}
    </div>
  )
}

/** Серые прямоугольники на время загрузки — вместо пустого экрана. */
export function MSkeleton({ rows = 4, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-[20px] bg-white/70" />
      ))}
    </div>
  )
}
