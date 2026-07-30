import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useProductServiceModals(t) {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteProductServiceFn } = useUcodeRequestMutation()

  const [isCreateSingleOpen, setIsCreateSingleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [errorGroup, setErrorGroup] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [isCopying, setIsCopying] = useState(false)

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['get_product_services_list'] })
    queryClient.invalidateQueries({ queryKey: ['list_products_and_services'] })
  }

  const handleCreateSingle = () => {
    setItemToEdit(null)
    setIsCopying(false)
    setIsCreateSingleOpen(true)
    setIsMenuOpen(false)
  }

  const handleCreateGroup = () => {
    setIsCreateGroupOpen(true)
    setIsMenuOpen(false)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.guid) return
    if (itemToDelete.isGroup && itemToDelete.items && itemToDelete.items.length > 0) {
      setErrorGroup(itemToDelete)
      setItemToDelete(null)
      return
    }
    setIsDeletingItem(true)
    try {
      const isGroup = itemToDelete.isGroup
      await deleteProductServiceFn({
        method: 'delete_product_and_service',
        data: {
          guid: itemToDelete.guid,
          branch_id: authStore.branch_id,
        }
      })
      invalidateQueries()
      if (isGroup) queryClient.invalidateQueries({ queryKey: ['product-services-grouped'] })
      setItemToDelete(null)
      showSuccessNotification(t('successDeleted'))
    } catch (error) {
      console.error('Delete error:', error)
      showErrorNotification(t('deleteError'))
    } finally {
      setIsDeletingItem(false)
    }
  }

  return {
    isCreateSingleOpen, setIsCreateSingleOpen,
    isCreateGroupOpen, setIsCreateGroupOpen,
    isMenuOpen, setIsMenuOpen,
    itemToDelete, setItemToDelete,
    isDeletingItem,
    errorGroup, setErrorGroup,
    editGroup, setEditGroup,
    itemToEdit, setItemToEdit,
    isCopying, setIsCopying,
    handleCreateSingle,
    handleCreateGroup,
    handleDeleteConfirm,
  }
}
