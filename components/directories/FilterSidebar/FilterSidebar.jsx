"use client"

import { cn } from '@/app/lib/utils'
import { ChevronsLeft, ChevronsRightIcon, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import styles from './FilterSidebar.module.scss'

export function FilterSidebar({ isOpen, onClose, children, clearCount, onClear }) {
  const t = useTranslations()

  return (
    <div className={cn("flex flex-col bg-neutral-100 border-r transition-all duration-300 overflow-hidden relative h-full shrink-0")} style={{ width: isOpen ? '240px' : "30px", padding: isOpen ? "" : "3px 0px" }}>
      <div
        className={cn("absolute top-3 w-full left-0 flex justify-center cursor-pointer transition-opacity duration-200", isOpen ? "opacity-0 pointer-events-none" : "opacity-100 delay-150")}
        onClick={onClose}
      >
        <ChevronsRightIcon className='text-primary' size={24} />
      </div>

      {/* Open State Content */}
      <div className={cn("flex flex-col h-full shrink-0 transition-opacity duration-200", isOpen ? "opacity-100 delay-150 " : "opacity-0 pointer-events-none")}>
        <div className="flex items-center p-3 justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-black text-xl font-semibold">{t('filter')}</h2>

            {clearCount > 0 && onClear && (
              <button
                onClick={onClear}
                className="flex cursor-pointer p-2  rounded-full items-center gap-2 ml-3"
              >
                <span className="">
                  {clearCount}
                </span>
                <Trash2 size={16} color='gray' className="text-red-500" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full shrink-0 cursor-pointer hover:bg-neutral-100 transition-colors"
          >
            <ChevronsLeft size={24} className='text-primary' />
          </button>
        </div>
        <div className="flex-1 px-3 pb-3 overflow-y-auto overflow-x-visible!">
          {children}
        </div>

      </div>
    </div>
  )
}

export function FilterSection({ title, children, className }) {
  return (
    <div className={cn("my-2 flex flex-col gap-2", className)}>
      <h3 className="text-gray-ucode-500 text-sm">{title}</h3>
      {children}
    </div>
  )
}

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
