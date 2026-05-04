"use client"

import Input from '@/components/shared/Input'
import { useTranslations } from 'next-intl'
import styles from './SearchBar.module.scss'

export function SearchBar({ value, onChange, placeholder }) {
  const t = useTranslations()
  return (
    <div className={styles.container}>
      <svg
        className={styles.icon}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('search')}
        className={styles.input}
      />
    </div>
  )
}
