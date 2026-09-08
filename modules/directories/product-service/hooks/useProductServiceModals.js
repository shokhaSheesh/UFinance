import { useUcodeRequestMutation } from '@/hooks/useDashboard'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import { showErrorNotification, showSuccessNotification } from '@/lib/utils/notifications'
import { authStore } from '@/store/auth.store'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function useProductServiceModals(t) {
  const queryClient = useQueryClient()
  const tErrors = useTranslations('Errors')
  const { mutateAsync: deleteProductServiceFn } = useUcodeRequestMutation()

  const [isCreateSingleOpen, setIsCreateSingleOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [errorGroup, setErrorGroup] = useState(null)
  const [usedItem, setUsedItem] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [isCopying, setIsCopying] = useState(false)

  /**
   * Запрос на удаление: товар, который уже используется в операциях или
   * сделках (used === true), удалить нельзя — вместо подтверждения
   * показываем пояснение.
   */
  const requestDelete = (item) => {
    if (!item?.isGroup && (item?.used || item?.raw?.used)) {
      setUsedItem(item)
      return
    }
    setItemToDelete(item)
  }

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
      const result = await deleteProductServiceFn({
        // У группы свой метод удаления, товар/услуга удаляется другим
        method: isGroup ? 'delete_product_and_service_group' : 'delete_product_and_service',
        data: {
          guid: itemToDelete.guid,
          branch_id: authStore.branch_id,
        }
      })
      // Бэк отвечает 200 с телом-ошибкой, поэтому проверяем и успешный ответ
      if (isObjectInUseError(result)) {
        showErrorNotification(tErrors('cannotDelete.productService'))
        return
      }
      invalidateQueries()
      if (isGroup) queryClient.invalidateQueries({ queryKey: ['product-services-grouped'] })
      setItemToDelete(null)
      showSuccessNotification(t('successDeleted'))
    } catch (error) {
      console.error('Delete error:', error)
      showErrorNotification(
        isObjectInUseError(error)
          ? tErrors('cannotDelete.productService')
          : t('deleteError')
      )
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
    usedItem, setUsedItem,
    editGroup, setEditGroup,
    itemToEdit, setItemToEdit,
    isCopying, setIsCopying,
    handleCreateSingle,
    handleCreateGroup,
    handleDeleteConfirm,
    requestDelete,
  }
}
