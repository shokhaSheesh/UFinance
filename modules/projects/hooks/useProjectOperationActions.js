import { useDeleteOperation } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * Управление модалками операций внутри проекта: создание/редактирование/копирование/удаление.
 * Повторяет паттерн со страницы контрагента, но инвалидирует список операций проекта.
 */
export function useProjectOperationActions() {
  const queryClient = useQueryClient()
  const deleteOperationMutation = useDeleteOperation()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creatingOperation, setCreatingOperation] = useState({ isNew: true })
  const [createModalType, setCreateModalType] = useState('income')
  const [isCreateClosing, setIsCreateClosing] = useState(false)
  const [isCreateOpening, setIsCreateOpening] = useState(false)

  const [editingOperation, setEditingOperation] = useState(null)
  const [isEditClosing, setIsEditClosing] = useState(false)
  const [isEditOpening, setIsEditOpening] = useState(false)

  const [deletingOperation, setDeletingOperation] = useState(null)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['list_operations_by_query'] })

  const openCreate = (modalType = 'income') => {
    setCreatingOperation({ isNew: true })
    setCreateModalType(modalType)
    setIsCreateOpen(true)
    setIsCreateClosing(false)
    setIsCreateOpening(true)
    setTimeout(() => setIsCreateOpening(false), 50)
  }

  const handleEdit = (operation) => {
    setEditingOperation(operation)
    setIsEditClosing(false)
    setIsEditOpening(true)
    setTimeout(() => setIsEditOpening(false), 50)
  }

  const handleCopy = (operation) => {
    setCreatingOperation({ ...operation, id: 'new', isNew: true, isCopy: true })

    let modalType = 'payment'
    if (operation.tip === 'Перемещение') modalType = 'transfer'
    else if (operation.tip === 'Выплата') modalType = 'payment'
    else if (operation.tip === 'Поступление') modalType = 'income'
    else if (operation.tip === 'Начисление') modalType = 'accrual'

    setCreateModalType(modalType)
    setIsCreateOpen(true)
    setIsCreateClosing(false)
    setIsCreateOpening(true)
    setTimeout(() => setIsCreateOpening(false), 50)
  }

  const handleDelete = (operation) => setDeletingOperation(operation)

  const handleCloseCreate = () => {
    setIsCreateClosing(true)
    setTimeout(() => {
      setIsCreateOpen(false)
      setIsCreateClosing(false)
      setIsCreateOpening(false)
      setCreatingOperation({ isNew: true })
      setCreateModalType('income')
    }, 300)
  }

  const handleCloseEdit = () => {
    setIsEditClosing(true)
    setTimeout(() => {
      setEditingOperation(null)
      setIsEditClosing(false)
      setIsEditOpening(false)
    }, 300)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOperation) return
    try {
      const guid = deletingOperation.rawData?.guid || deletingOperation.guid
      if (!guid) throw new Error('GUID операции не найден')
      await deleteOperationMutation.mutateAsync([guid])
      invalidate()
      setDeletingOperation(null)
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }

  return {
    isCreateOpen,
    createModalType,
    creatingOperation,
    editingOperation,
    deletingOperation,
    isCreateClosing,
    isCreateOpening,
    isEditClosing,
    isEditOpening,
    openCreate,
    handleEdit,
    handleCopy,
    handleDelete,
    handleCloseCreate,
    handleCloseEdit,
    handleDeleteConfirm,
    setDeletingOperation,
    isDeletePending: deleteOperationMutation.isPending,
    invalidate,
  }
}
