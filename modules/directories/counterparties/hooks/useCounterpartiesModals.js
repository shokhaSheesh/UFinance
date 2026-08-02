import { useDeleteCounterparties, useDeleteCounterpartiesGroups } from '@/hooks/useDashboard'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import { showErrorNotification } from '@/lib/utils/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function useCounterpartiesModals({ setSearchQuery, setDebouncedSearchQuery }) {
  const queryClient = useQueryClient()
  const tErrors = useTranslations('Errors')
  const deleteMutation = useDeleteCounterparties()
  const deleteGroupMutation = useDeleteCounterpartiesGroups()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCounterparty, setEditingCounterparty] = useState(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState(null)
  // Причина, по которой бэк отказал в удалении — показываем её в самом окне
  const [deleteError, setDeleteError] = useState('')
  const [editingGroup, setEditingGroup] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [preselectedGroupId, setPreselectedGroupId] = useState(null)

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['get_counterparties'] })
    queryClient.invalidateQueries({ queryKey: ['get_counterpaties_total'] })
  }

  const resetSearch = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
  }

  const openCreate = (groupId = null) => {
    setPreselectedGroupId(groupId)
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    setEditingCounterparty(null)
    setPreselectedGroupId(null)
    invalidateQueries()
  }

  const showDeleteBlocked = () => {
    const message = tErrors('cannotDelete.counterparty')
    setDeleteError(message)
    showErrorNotification(message)
  }

  const openDeleteCounterparty = (counterparty) => {
    setDeleteError('')
    setDeletingCounterparty(counterparty)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCounterparty?.guid) return
    setDeleteError('')
    try {
      const result = await deleteMutation.mutateAsync([deletingCounterparty.guid])
      // Бэк отвечает 200 с телом-ошибкой, поэтому проверяем и успешный ответ
      if (isObjectInUseError(result)) {
        showDeleteBlocked()
        return
      }
      setDeletingCounterparty(null)
      resetSearch()
      invalidateQueries()
    } catch (error) {
      console.error('Error deleting counterparty:', error)
      if (isObjectInUseError(error)) showDeleteBlocked()
    }
  }

  const handleGroupDeleteConfirm = async () => {
    if (!deletingGroup?.guid) return
    try {
      await deleteGroupMutation.mutateAsync([deletingGroup.guid])
      setDeletingGroup(null)
      resetSearch()
      invalidateQueries()
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  return {
    isCreateOpen,
    editingCounterparty,
    deletingCounterparty,
    editingGroup,
    deletingGroup,
    preselectedGroupId,
    openCreate,
    closeCreate,
    setEditingCounterparty,
    setDeletingCounterparty: openDeleteCounterparty,
    deleteError,
    setEditingGroup,
    setDeletingGroup,
    handleDeleteConfirm,
    handleGroupDeleteConfirm,
    isDeleting: deleteMutation.isPending,
    isGroupDeleting: deleteGroupMutation.isPending,
  }
}
