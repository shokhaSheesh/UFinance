"use client"

import styles from './products.module.scss'

export default function TovaryPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.icon}>📦</h1>
        <h2 className={styles.title}>Товары и услуги</h2>
        <p className={styles.subtitle}>Скоро</p>
      </div>
    </div>
  )
}
