import { useDeleteCounterparties, useDeleteCounterpartiesGroups } from '@/hooks/useDashboard'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useCounterpartiesModals({ setSearchQuery, setDebouncedSearchQuery }) {
  const queryClient = useQueryClient()
  const deleteMutation = useDeleteCounterparties()
  const deleteGroupMutation = useDeleteCounterpartiesGroups()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCounterparty, setEditingCounterparty] = useState(null)
  const [deletingCounterparty, setDeletingCounterparty] = useState(null)
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

  const handleDeleteConfirm = async () => {
    if (!deletingCounterparty?.guid) return
    try {
      await deleteMutation.mutateAsync([deletingCounterparty.guid])
      setDeletingCounterparty(null)
      resetSearch()
      invalidateQueries()
    } catch (error) {
      console.error('Error deleting counterparty:', error)
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
    setDeletingCounterparty,
    setEditingGroup,
    setDeletingGroup,
    handleDeleteConfirm,
    handleGroupDeleteConfirm,
    isDeleting: deleteMutation.isPending,
    isGroupDeleting: deleteGroupMutation.isPending,
  }
}
