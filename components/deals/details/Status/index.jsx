import { useUcodeDefaultApiMutation, useUcodeDefaultApiQuery } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronUp, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './style.module.scss'

const DEFAULT_COLORS = [
  '#F79009', // orange
  '#2E90FA', // blue  
  '#12B76A', // green
  '#F04438', // red
  '#7A5AF8', // purple
  '#EE46BC', // pink
  '#667085', // gray
  '#15B79E', // teal
]

const STATUS_API_URL = '/items/sales_status?from-ofs=true'

export default function DealStatus({
  statuses: propsStatuses = [],
  currentStatus = null,
  onStatusChange,
  onStatusEdit,
  onStatusDelete,
  onStatusCreate
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null) // { index, x, y }
  const [editingStatus, setEditingStatus] = useState(null) // { index, name, color }
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState(DEFAULT_COLORS[0])
  const [showNewForm, setShowNewForm] = useState(false)
  const dropdownRef = useRef(null)
  const contextRef = useRef(null)
  const queryClient = useQueryClient()

  // Fetch statuses
  const { data: fetchedData, isLoading: isLoadingStatuses } = useUcodeDefaultApiQuery({
    queryKey: 'sales_status',
    urlMethod: 'GET',
    urlParams: STATUS_API_URL,
    data: {}
  })

  // Mutations
  const { mutateAsync: mutateStatus, isLoading: isPendingStatus } = useUcodeDefaultApiMutation({
    mutationKey: 'sales_status_mutation'
  })

  const statuses = useMemo(() => {
    return fetchedData?.data?.data?.response || propsStatuses || []
  }, [fetchedData, propsStatuses])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setContextMenu(null)
        setEditingStatus(null)
        setShowNewForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu])

  const t = useTranslations('Directories.details.status')

  const activeStatus = statuses.find(status => status.name === currentStatus?.[0])
  const activeColor = activeStatus?.color || '#F79009'
  const activeName = activeStatus?.name || t('defaultStatus')

  const handleSelect = (status) => {
    onStatusChange?.(status)
    setIsOpen(false)
    setContextMenu(null)
  }

  const handleContextMenu = (e, index) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ index })
  }

  const handleEdit = (status, index) => {
    setEditingStatus({ index, guid: status.guid, name: status.name, color: status.color })
    setContextMenu(null)
  }

  const handleDelete = async (status) => {
    try {
      await mutateStatus({
        urlMethod: 'DELETE',
        urlParams: `/items/sales_status/${status.guid}?from-ofs=true`,
      })
      queryClient.invalidateQueries({ queryKey: ['sales_status'] })
      onStatusDelete?.(status)
      setContextMenu(null)
    } catch (error) {
      console.error('Failed to delete status:', error)
    }
  }

  const handleSaveEdit = async () => {
    if (editingStatus) {
      try {
        const payload = {
          guid: editingStatus.guid,
          name: editingStatus.name,
          color: editingStatus.color,
        }
        await mutateStatus({
          urlMethod: 'PUT',
          urlParams: `/items/sales_status/${editingStatus.guid}?from-ofs=true`,
          data: payload
        })
        queryClient.invalidateQueries({ queryKey: ['sales_status'] })
        onStatusEdit?.({
          ...statuses[editingStatus.index],
          ...payload
        })
        setEditingStatus(null)

      } catch (error) {
        console.error('Failed to update status:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingStatus(null)
  }

  const handleSaveNew = async () => {
    if (newStatusName.trim()) {
      try {
        const payload = {
          name: newStatusName.trim(),
          color: newStatusColor
        }
        await mutateStatus({
          urlMethod: 'POST',
          urlParams: STATUS_API_URL,
          data: payload
        })
        queryClient.invalidateQueries({ queryKey: ['sales_status'] })
        onStatusCreate?.(payload)
        setNewStatusName('')
        setNewStatusColor(DEFAULT_COLORS[0])
        setShowNewForm(false)
      } catch (error) {
        console.error('Failed to create status:', error)
      }
    }
  }

  const handleCancelNew = () => {
    setNewStatusName('')
    setNewStatusColor(DEFAULT_COLORS[0])
    setShowNewForm(false)
  }

  return (
    <div className={styles.statusWrapper} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        className={styles.statusTrigger}
        style={{ backgroundColor: `${activeColor}15`, color: activeColor }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.statusDot} style={{ backgroundColor: activeColor }} />
        <span className={styles.statusName}>{activeName}</span>
        <ChevronUp
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {isLoadingStatuses ? (
            <div className='flex items-center justify-center p-6'>
              <Loader2 className='animate-spin text-primary' size={24} />
            </div>
          ) : (
            <div className={styles.statusList}>
              {statuses.map((status, index) => {
                const isActive = status.name === currentStatus?.[0]
                const isEditing = editingStatus?.index === index

                if (isEditing) {
                  return (
                    <div key={status.guid || index} className={styles.editRow}>
                      <input
                        className={styles.editInput}
                        value={editingStatus.name}
                        onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                        autoFocus
                      />
                      <div className={styles.colorPicker}>
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            className={`${styles.colorOption} ${editingStatus.color === color ? styles.colorActive : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingStatus({ ...editingStatus, color })}
                          />
                        ))}
                      </div>
                      <div className={styles.editActions}>
                        <button className={styles.cancelBtn} onClick={handleCancelEdit}>{t('cancel')}</button>
                        <button className={styles.saveBtn} onClick={handleSaveEdit}>{t('save')}</button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={status.guid || index} className={styles.statusItem}>
                    <div className={styles.statusItemLeft} onClick={() => handleSelect(status)}>
                      {isPendingStatus && <Loader2 size={14} className='animate-spin' />}
                      <span className={styles.statusDot} style={{ backgroundColor: status.color || '#667085' }} />
                      <span className={styles.statusItemName}>{status.name}</span>
                    </div>
                    <div className={styles.statusItemRight}>
                      {isActive && <Check size={16} className={styles.checkIcon} />}
                      <button
                        className={styles.moreBtn}
                        onClick={(e) => handleContextMenu(e, index)}
                      >
                        ⋯
                      </button>
                    </div>

                    {/* Context Menu */}
                    {contextMenu?.index === index && (
                      <div className={styles.contextMenu} ref={contextRef}>
                        <button className={styles.contextItem} onClick={() => handleEdit(status, index)}>
                          <Pencil size={14} />
                          <span>{t('edit')}</span>
                        </button>
                        <button className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => handleDelete(status)}>
                          <Trash2 size={14} />
                          <span>{t('delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* New Status Form */}
          {showNewForm ? (
            <div className={styles.newStatusForm}>
              <input
                className={styles.editInput}
                placeholder={t('statusNamePlaceholder')}
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                autoFocus
              />
              <div className={styles.colorPicker}>
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`${styles.colorOption} ${newStatusColor === color ? styles.colorActive : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewStatusColor(color)}
                  />
                ))}
              </div>
              <div className={styles.editActions}>
                <button className={styles.cancelBtn} onClick={handleCancelNew}>{t('cancel')}</button>
                <button className={styles.saveBtn} onClick={handleSaveNew}>{t('save')}</button>
              </div>
            </div>
          ) : (
            <button className={styles.addStatusBtn} onClick={() => setShowNewForm(true)}>
                + {t('addStatus')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
