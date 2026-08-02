'use client'

import { useCallback, useMemo, useState } from 'react'

/** '2026-01' + '2026-12' → "Янв '26 – дек '26" */
export const formatPeriodLabel = (period, monthLabels) => {
  if (!period?.start || !period?.end) return '—'
  const [sy, sm] = period.start.split('-')
  const [ey, em] = period.end.split('-')
  const from = `${monthLabels[parseInt(sm, 10)]} '${sy.slice(2)}`
  const to = `${monthLabels[parseInt(em, 10)].toLowerCase()} '${ey.slice(2)}`
  return `${from} – ${to}`
}

/**
 * Состояние страницы-списка бюджетов: поиск, сортировка и модалка
 * создания/редактирования. Данные и CRUD приходят снаружи (API-хуки).
 *
 * @param {Array}    budgets      нормализованные бюджеты из list_budgets
 * @param {object}   monthLabels  { 1: 'Янв', ... } для подписи периода
 * @param {Function} onCreate     (form) → Promise
 * @param {Function} onUpdate     ({ guid, ...form }) → Promise
 * @param {Function} onDelete     (guid) → Promise
 */
export const useBudgetList = ({ budgets = [], monthLabels, onCreate, onUpdate, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const rows = useMemo(
    () =>
      budgets.map((b) => ({
        ...b,
        period: formatPeriodLabel(b.periodValue, monthLabels),
      })),
    [budgets, monthLabels]
  )

  const filteredData = useMemo(() => {
    let data = [...rows]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.legalEntity && item.legalEntity.toLowerCase().includes(query)) ||
          (item.project && item.project.toLowerCase().includes(query)) ||
          (item.modifiedBy && item.modifiedBy.toLowerCase().includes(query))
      )
    }

    data.sort((a, b) => {
      const aValue = a[sortConfig.key] || ''
      const bValue = b[sortConfig.key] || ''
      if (sortConfig.direction === 'asc') return aValue > bValue ? 1 : -1
      return aValue < bValue ? 1 : -1
    })

    return data
  }, [rows, searchQuery, sortConfig])

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const openCreate = useCallback(() => {
    setEditing(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item) => {
    setEditing({
      id: item.id,
      name: item.name,
      period: item.periodValue,
      legalEntity: item.legalEntityKey || null,
      project: item.projectValue || null,
      currency: item.currencyId || null,
      comment: item.comment || ''
    })
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  const submit = useCallback(
    (form) => (editing ? onUpdate?.({ guid: editing.id, ...form }) : onCreate?.(form)),
    [editing, onCreate, onUpdate]
  )

  const remove = useCallback((id) => onDelete?.(id), [onDelete])

  return {
    filteredData,
    searchQuery,
    setSearchQuery,
    selectedAccount,
    setSelectedAccount,
    sortConfig,
    handleSort,
    modalOpen,
    editing,
    openCreate,
    openEdit,
    closeModal,
    submit,
    remove
  }
}
