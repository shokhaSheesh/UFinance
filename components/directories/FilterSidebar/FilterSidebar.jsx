'use client'

import { FilterDrawer, FilterSection } from '@/components/shared/Filters/FilterDrawer'
import { cn } from '@/lib/utils'
import styles from './FilterSidebar.module.scss'

/**
 * Историческое имя панели фильтров.
 *
 * Раньше это была постоянная колонка слева на 240px, которая сжимала таблицу:
 * при открытии и закрытии фильтров менялась ширина колонок и «прыгали» суммы.
 * Теперь тот же набор пропсов рисует выезжающую справа панель-оверлей
 * (FilterDrawer), геометрию таблицы она не трогает.
 *
 * Компонент оставлен как тонкая обёртка, чтобы не переписывать разом все
 * тринадцать страниц: API (isOpen / onClose / clearCount / onClear) совпадает.
 * Новый код стоит импортировать FilterDrawer напрямую.
 *
 * ВАЖНО: закрытая панель больше не показывает узкую полоску с шевроном —
 * открывать её должна кнопка «Фильтры» в шапке страницы
 * (components/shared/Filters/FilterButton.jsx).
 */
export function FilterSidebar({ isOpen, onClose, children, clearCount, onClear }) {
  return (
    <FilterDrawer isOpen={isOpen} onClose={onClose} clearCount={clearCount} onClear={onClear}>
      {children}
    </FilterDrawer>
  )
}

export { FilterSection }

export function FilterCheckbox({ checked, onChange, label }) {
  return (
    <label className={styles.checkboxLabel}>
      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className={styles.checkboxInput}
        />
        <div className={cn(styles.checkbox, checked ? styles.checked : styles.unchecked)}>
          {checked && (
            <svg className={styles.checkboxIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className={styles.checkboxText}>{label}</span>
    </label>
  )
}
