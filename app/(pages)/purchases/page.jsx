"use client"

import styles from './purchases.module.scss'

export default function ZakupkiPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.icon}>🛒</h1>
        <h2 className={styles.title}>Закупки</h2>
        <p className={styles.subtitle}>Скоро</p>
      </div>
    </div>
  )
}
