"use client"

import { cn } from '@/lib/utils'
import styles from './PageLoader.module.scss'

export function PageLoader({ isLoading }) {
  if (!isLoading) return null

  return (
    <div className={cn(styles.overlay, !isLoading && styles.hidden)}>
      <div className={styles.container}>
        {/* Animated Spinner */}
        <div className={styles.spinner}>
          <div className={styles.spinnerOuter}></div>
          <div className={styles.spinnerInner}></div>
        </div>
        <p className={styles.text}>Загрузка...</p>
      </div>
    </div>
  )
}
