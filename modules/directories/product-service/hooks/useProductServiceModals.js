import { useUcodeDefaultApiMutation } from '@/hooks/useDashboard'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useProductServiceModals(t) {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteProductService } = useUcodeDefaultApiMutation({ mutationKey: 'DELETE_PRODUCT_SERVICE' })

  const [isCreateSingleOpen, setIsCreateSingleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [errorGroup, setErrorGroup] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [isCopying, setIsCopying] = useState(false)
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

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
      await deleteProductService({
        urlMethod: 'DELETE',
        urlParams: isGroup
          ? `/items/group_product_and_service/${itemToDelete.guid}?from-ofs=true`
          : `/items/product_and_service/${itemToDelete.guid}?from-ofs=true`,
        data: { guid: itemToDelete.guid }
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

  const handleBulkDelete = async (selectedItems, setSelectedItems) => {
    setIsBulkDeleting(true)
    try {
      const guids = Array.from(selectedItems)
      await deleteProductService({
        urlMethod: 'DELETE',
        urlParams: `/object/operations`,
        data: { ids: guids }
      })
      invalidateQueries()
      setSelectedItems(new Set())
      setIsBulkDeleteModalOpen(false)
      showSuccessNotification(t('bulkSuccessDeleted'))
    } catch (error) {
      console.error('Bulk delete error:', error)
      showErrorNotification(t('bulkDeleteError'))
    } finally {
      setIsBulkDeleting(false)
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
    isBulkDeleteModalOpen, setIsBulkDeleteModalOpen,
    isBulkDeleting,
    handleCreateSingle,
    handleCreateGroup,
    handleDeleteConfirm,
    handleBulkDelete,
  }
}
