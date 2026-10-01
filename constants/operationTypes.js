import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, PackageCheck, Scale, Truck } from 'lucide-react'

/**
 * Вид типов операций — один на весь продукт: таблица операций, окна и
 * меню на компьютере, ленты и формы на телефоне.
 *
 * Цвет помогает отличить тип с одного взгляда, поэтому у каждого типа свой
 * оттенок, а не серый у всех, кроме поступления и выплаты. Оттенки
 * спокойные: светлая подложка и насыщенный значок — как в банковских
 * приложениях, без кислотных заливок.
 *   tone  — подложка и цвет значка (кружок с иконкой)
 *   text  — цвет подписи или суммы этого типа
 *   solid — заливка выбранного переключателя типа
 *   dot   — точка-маркер в легендах и фильтрах
 */
export const OPERATION_TYPES = {
  Поступление: {
    icon: ArrowDownLeft,
    tone: 'bg-emerald-50 text-emerald-600',
    text: 'text-emerald-600',
    solid: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
  },
  Выплата: {
    icon: ArrowUpRight,
    tone: 'bg-red-50 text-red-600',
    text: 'text-red-600',
    solid: 'bg-red-600 text-white',
    dot: 'bg-red-500',
  },
  Перемещение: {
    icon: ArrowLeftRight,
    tone: 'bg-[#e8f1ff] text-[#0e73f6]',
    text: 'text-[#0e73f6]',
    solid: 'bg-[#0e73f6] text-white',
    dot: 'bg-[#0e73f6]',
  },
  Начисление: {
    icon: Scale,
    tone: 'bg-violet-50 text-violet-600',
    text: 'text-violet-600',
    solid: 'bg-violet-600 text-white',
    dot: 'bg-violet-500',
  },
  Отгрузка: {
    icon: Truck,
    tone: 'bg-amber-50 text-amber-600',
    text: 'text-amber-600',
    solid: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
  },
  Поставка: {
    icon: PackageCheck,
    tone: 'bg-teal-50 text-teal-600',
    text: 'text-teal-600',
    solid: 'bg-teal-600 text-white',
    dot: 'bg-teal-500',
  },
}

/** Вид типа по `tip`; неизвестный тип рисуется как начисление. */
export const operationLook = (tip) => OPERATION_TYPES[tip] || OPERATION_TYPES['Начисление']

/**
 * Вид типов на телефоне — спокойнее, чем на компьютере.
 *
 * Цвет на телефоне значит только деньги: зелёный — пришли, красный — ушли.
 * Перемещение, начисление, отгрузка и поставка — серые, их различает форма
 * значка. Синий остаётся у выбранного типа в форме (это действие), а не у
 * значков в лентах. Компьютер пока на OPERATION_TYPES — если на телефоне
 * приживётся, перенесём и туда.
 */
const NEUTRAL = {
  tone: 'bg-slate-100 text-slate-500',
  text: 'text-slate-500',
  solid: 'bg-[#0e73f6] text-white',
  dot: 'bg-slate-400',
}

export const MOBILE_OPERATION_TYPES = Object.fromEntries(
  Object.entries(OPERATION_TYPES).map(([tip, look]) => [
    tip,
    tip === 'Поступление' || tip === 'Выплата' ? look : { ...look, ...NEUTRAL },
  ])
)

/** Вид типа по `tip` на телефоне; неизвестный тип — как начисление. */
export const mobileOperationLook = (tip) => MOBILE_OPERATION_TYPES[tip] || MOBILE_OPERATION_TYPES['Начисление']
