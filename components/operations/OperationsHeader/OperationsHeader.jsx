"use client"

import styles from './OperationsHeader.module.scss'

export function OperationsHeader({ 
  isFilterOpen, 
  onFilterToggle, 
  onCreateClick, 
  selectedCount = 0,
  searchQuery = '',
  onSearchChange
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerInner}>
        
      </div>
    </div>
  )
}
