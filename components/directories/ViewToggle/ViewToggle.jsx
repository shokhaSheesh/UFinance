"use client"

import { cn } from '@/lib/utils'
import styles from './ViewToggle.module.scss'

export function ViewToggle({ view, onViewChange }) {
  return (
    <div className={styles.container}>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          styles.button,
          view === 'list' ? styles.active : styles.inactive
        )}
        title="Список"
      >
        <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          styles.button,
          view === 'grid' ? styles.active : styles.inactive
        )}
        title="Сетка"
      >
        <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </button>
    </div>
  )
}
