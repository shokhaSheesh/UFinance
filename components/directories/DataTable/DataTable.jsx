"use client"

import { cn } from '@/lib/utils'
import { useState } from 'react'
import styles from './DataTable.module.scss'

export function DataTable({ columns, data, onRowClick, selectedRows = [], onSelectRow }) {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const allSelected = data.length > 0 && selectedRows.length === data.length
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr className={styles.tableHeaderRow}>
              {onSelectRow && (
                <th className={cn(styles.tableHeaderCell, styles.tableHeaderCellCheckbox)}>
                  <div className={styles.checkboxWrapper}>
                    <div className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          if (allSelected) {
                            onSelectRow([])
                          } else {
                            onSelectRow(data.map(row => row.id))
                          }
                        }}
                        className={styles.checkboxInput}
                      />
                      <div className={cn(
                        styles.checkbox,
                        allSelected || someSelected ? styles.checked : styles.unchecked
                      )}>
                        {allSelected && (
                          <svg className={styles.checkboxIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {someSelected && !allSelected && (
                          <div className={styles.checkboxPartial}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    styles.tableHeaderCell,
                    column.sortable && styles.sortable
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={styles.tableHeaderContent}>
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <svg className={styles.sortIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {sortDirection === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {sortedData.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  styles.tableRow,
                  onRowClick && styles.clickable
                )}
                onClick={() => onRowClick?.(row)}
              >
                {onSelectRow && (
                  <td className={cn(styles.tableCell, styles.tableCellCheckbox)} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.checkboxWrapper}>
                      <div className={styles.checkboxContainer}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => {
                            if (selectedRows.includes(row.id)) {
                              onSelectRow(selectedRows.filter(id => id !== row.id))
                            } else {
                              onSelectRow([...selectedRows, row.id])
                            }
                          }}
                          className={styles.checkboxInput}
                        />
                        <div className={cn(
                          styles.checkbox,
                          selectedRows.includes(row.id) ? styles.checked : styles.unchecked
                        )}>
                          {selectedRows.includes(row.id) && (
                            <svg className={styles.checkboxIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={styles.tableCell}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
