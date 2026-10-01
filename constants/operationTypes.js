import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, PackageCheck, Scale, Truck } from '@/components/icons'
import * as MobileIcons from '@/components/mobile/icons'

/**
 * Вид типов операций — один на весь продукт: таблица операций, окна и
 * меню на компьютере, ленты и формы на телефоне.
 *
 * Цвет значит только деньги: зелёный — пришли, красный — ушли.
 * Перемещение, начисление, отгрузка и поставка — серые, их различает форма
 * значка. Синий остаётся у выбранного типа в переключателе (это действие).
 *   tone  — подложка и цвет значка (кружок с иконкой)
 *   text  — цвет подписи или суммы этого типа
 *   solid — заливка выбранного переключателя типа
 *   dot   — точка-маркер в легендах и фильтрах
 */
const NEUTRAL = {
  tone: 'bg-slate-100 text-slate-500',
  text: 'text-slate-500',
  solid: 'bg-[#0e73f6] text-white',
  dot: 'bg-slate-400',
}

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
  Перемещение: { icon: ArrowLeftRight, ...NEUTRAL },
  Начисление: { icon: Scale, ...NEUTRAL },
  Отгрузка: { icon: Truck, ...NEUTRAL },
  Поставка: { icon: PackageCheck, ...NEUTRAL },
}

/** Вид типа по `tip`; неизвестный тип рисуется как начисление. */
export const operationLook = (tip) => OPERATION_TYPES[tip] || OPERATION_TYPES['Начисление']

// Значки телефона — из набора Phosphor (components/mobile/icons); цвета те же
const MOBILE_ICONS = {
  Поступление: MobileIcons.ArrowDownLeft,
  Выплата: MobileIcons.ArrowUpRight,
  Перемещение: MobileIcons.ArrowLeftRight,
  Начисление: MobileIcons.Scale,
  Отгрузка: MobileIcons.Truck,
  Поставка: MobileIcons.Package,
}

export const MOBILE_OPERATION_TYPES = Object.fromEntries(
  Object.entries(OPERATION_TYPES).map(([tip, look]) => [tip, { ...look, icon: MOBILE_ICONS[tip] || look.icon }])
)

/** Вид типа по `tip` на телефоне; неизвестный тип — как начисление. */
export const mobileOperationLook = (tip) => MOBILE_OPERATION_TYPES[tip] || MOBILE_OPERATION_TYPES['Начисление']
