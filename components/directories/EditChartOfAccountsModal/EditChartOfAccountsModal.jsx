"use client"

import { TreeSelect } from '@/components/common/TreeSelect/TreeSelect'
import CustomDialog, { DialogBody, DialogFooter, DialogHeader, FormRow } from '@/components/shared/CustomDialog'
import { useChartOfAccountsV2, useUpdateChartOfAccounts } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import styles from '../CreateChartOfAccountsModal/CreateChartOfAccountsModal.module.scss'

export default function EditChartOfAccountsModal({ isOpen, onClose, category }) {
  const updateMutation = useUpdateChartOfAccounts()
  const [activeTab, setActiveTab] = useState('income')
  const [formData, setFormData] = useState({
    nazvanie: '',
    chart_of_accounts_id_2: '',
    komentariy: '',
    tip_operatsii: []
  })
  const [errors, setErrors] = useState({})
  const [, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Get all chart of accounts for parent selection
  const { data: allAccountsData } = useChartOfAccountsV2({ data: {} })
  const allAccounts = allAccountsData?.data?.data?.response || []

  // Map tab keys to API tip values
  const tipToTabMap = {
    'Доходы': 'income',
    'Расходы': 'expense',
    'Актив': 'assets',
    'Обязательства': 'liabilities',
    'Капитал': 'capital'
  }

  const tabToTipMap = {
    'income': 'Доходы',
    'expense': 'Расходы',
    'assets': 'Актив',
    'liabilities': 'Обязательства',
    'capital': 'Капитал'
  }

  const tabs = [
    { key: 'income', label: 'Доходы' },
    { key: 'expense', label: 'Расходы' },
    { key: 'assets', label: 'Активы' },
    { key: 'liabilities', label: 'Обязательства' },
    { key: 'capital', label: 'Капитал' }
  ]

  // Build tree structure for TreeSelect - filter by active tab and show only items from that category
  // Exclude the current category being edited and its children
  const treeData = useMemo(() => {
    const currentTip = tabToTipMap[activeTab]
    if (!currentTip || allAccounts.length === 0) return []

    // Build child map once for all items
    const childMap = new Map()
    allAccounts.forEach(item => {
      if (item.chart_of_accounts_id_2) {
        if (!childMap.has(item.chart_of_accounts_id_2)) {
          childMap.set(item.chart_of_accounts_id_2, [])
        }
        childMap.get(item.chart_of_accounts_id_2).push(item)
      }
    })

    // Helper to check if item or any of its descendants match the filter
    const hasMatchingDescendants = (item) => {
      const children = childMap.get(item.guid) || []
      
      // If item has children, check if any child matches (groups should be included if they have matching children)
      if (children.length > 0) {
        return children.some(child => hasMatchingDescendants(child))
      }
      
      // If no children (leaf node), check if item itself matches the filter
      if (item.tip && Array.isArray(item.tip) && item.tip.length > 0) {
        return item.tip.includes(currentTip)
      }
      
      return false
    }

    // Filter accounts by current tab tip, excluding the current category and its descendants
    const excludeGuids = new Set()
    if (category?.guid) {
      excludeGuids.add(category.guid)
      // Find all descendants
      const findDescendants = (parentGuid) => {
        allAccounts.forEach(item => {
          if (item.chart_of_accounts_id_2 === parentGuid) {
            excludeGuids.add(item.guid)
            findDescendants(item.guid)
          }
        })
      }
      findDescendants(category.guid)
    }

    const filteredAccounts = allAccounts.filter(item => {
      if (excludeGuids.has(item.guid)) return false
      return hasMatchingDescendants(item)
    })

    if (filteredAccounts.length === 0) return []

    // Create a map of all filtered items by guid for quick lookup
    const itemsMap = new Map()
    filteredAccounts.forEach(item => {
      itemsMap.set(item.guid, item)
    })

    // Build child items map: parentGuid -> [children]
    const childItemsMap = new Map()
    const allChildGuids = new Set()

    filteredAccounts.forEach(item => {
      if (item.chart_of_accounts_id_2) {
        const parentGuid = item.chart_of_accounts_id_2
        if (itemsMap.has(parentGuid)) {
          if (!childItemsMap.has(parentGuid)) {
            childItemsMap.set(parentGuid, [])
          }
          childItemsMap.get(parentGuid).push(item)
          allChildGuids.add(item.guid)
        }
      }
    })

    const rootItems = []
    filteredAccounts.forEach(item => {
      if (allChildGuids.has(item.guid)) {
        return
      }

      if (!item.chart_of_accounts_id_2) {
        rootItems.push(item)
      } else {
        const parentGuid = item.chart_of_accounts_id_2
        const parentInFiltered = itemsMap.has(parentGuid)
        
        if (!parentInFiltered) {
          rootItems.push(item)
        }
      }
    })

    const buildTree = (item) => {
      const children = childItemsMap.get(item.guid) || []
      return {
        value: item.guid,
        title: item.nazvanie,
        selectable: true, // All items are selectable
        children: children.length > 0 ? children.map(buildTree) : undefined
      }
    }

    return rootItems.map(buildTree)
  }, [allAccounts, activeTab, category])

  // React 19 pattern: adjust state during render when props change
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevCategory, setPrevCategory] = useState(null)
  const [prevIsOpen, setPrevIsOpen] = useState(false)

  if (isOpen && category && (!prevIsOpen || prevCategory !== category)) {
    setPrevIsOpen(true)
    setPrevCategory(category)
    setIsClosing(false)
    setIsVisible(true)

    const categoryTip = category.tip && category.tip.length > 0 ? category.tip[0] : 'Доходы'
    const tab = tipToTabMap[categoryTip] || 'income'
    setActiveTab(tab)

    setFormData({
      nazvanie: category.name || '',
      chart_of_accounts_id_2: category.chart_of_accounts_id_2 || '',
      komentariy: category.komentariy || '',
      tip_operatsii: category.tip_operatsii || [],
    })
    setErrors({})
  }

  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
    setPrevCategory(null)
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 250)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nazvanie.trim()) {
      newErrors.nazvanie = 'Укажите название статьи'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !category?.guid) return

    try {
      const submitData = {
        guid: category.guid,
        nazvanie: formData.nazvanie.trim(),
        tip: [tabToTipMap[activeTab]],
        ...(formData.chart_of_accounts_id_2 && { chart_of_accounts_id_2: formData.chart_of_accounts_id_2 }),
        ...(formData.komentariy && { komentariy: formData.komentariy }),
        ...(formData.tip_operatsii && formData.tip_operatsii.length > 0 && { tip_operatsii: formData.tip_operatsii }),
      }

      await updateMutation.mutateAsync(submitData)
      handleClose()
    } catch (error) {
      console.error('Error updating chart of accounts:', error)
      setErrors({ submit: error.message || 'Не удалось обновить учетную статью' })
    }
  }

  if (!isOpen && !isVisible) return null

  return (
    <CustomDialog open={isOpen || isVisible} onClose={handleClose} contentClass="w-[640px]">
      <DialogHeader title="Редактирование учетной статьи" onClose={handleClose} />

      <DialogBody className="flex flex-col gap-4">
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                styles.tab,
                index === 0 && styles.first,
                index === tabs.length - 1 && styles.last,
                index > 0 && styles.notFirst,
                activeTab === tab.key ? styles.active : styles.inactive
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <FormRow label="Название" required error={errors.nazvanie}>
          <input
            type="text"
            value={formData.nazvanie}
            onChange={(e) => setFormData({ ...formData, nazvanie: e.target.value })}
            placeholder="Укажите название статьи"
            className={cn(styles.input, errors.nazvanie && styles.inputError)}
          />
        </FormRow>

        <FormRow label="Относится к">
          <TreeSelect
            data={treeData}
            value={formData.chart_of_accounts_id_2}
            onChange={(value) => setFormData({ ...formData, chart_of_accounts_id_2: value })}
            placeholder="Выберите родительскую статью"
          />
        </FormRow>

        <FormRow label="Комментарий" align="start">
          <textarea
            value={formData.komentariy}
            onChange={(e) => setFormData({ ...formData, komentariy: e.target.value })}
            placeholder="Пояснение к статье"
            className={styles.textarea}
            rows={4}
          />
        </FormRow>

        {errors.submit && (
          <div className="text-sm text-red-600">{errors.submit}</div>
        )}
      </DialogBody>

      <DialogFooter>
        <button
          type="button"
          onClick={handleClose}
          className="secondary-btn h-9"
          disabled={updateMutation.isPending}
        >
          Отменить
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="primary-btn"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}
