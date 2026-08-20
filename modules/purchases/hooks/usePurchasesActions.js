import { useCallback } from 'react'

export function usePurchasesActions({
  router,
  dealPermission,
  setDealToDelete,
  setDealToEdit,
  setDealToCopy,
  setIsCreateModalOpen,
}) {
  const handleRowClick = useCallback((deal, e) => {
    const isInteractive =
      e.target.closest('button') ||
      e.target.closest('label') ||
      e.target.closest('input[type="checkbox"]')
    if (isInteractive) return
    router.push(`/purchases/${deal.guid}`)
  }, [router])

  const handleDeleteClick = useCallback((deal, e) => {
    e.stopPropagation()
    setDealToDelete(deal)
  }, [setDealToDelete])

  // Закупка всегда правится обычной формой сделки: форма ученика — только для продаж
  const handleEditClick = useCallback((deal, e) => {
    e.stopPropagation()
    setDealToEdit(deal)
    setIsCreateModalOpen(true)
  }, [setDealToEdit, setIsCreateModalOpen])

  const handleCopyClick = useCallback((deal, e) => {
    e.stopPropagation()
    setDealToCopy(deal)
    setIsCreateModalOpen(true)
  }, [setDealToCopy, setIsCreateModalOpen])

  return { handleRowClick, handleDeleteClick, handleEditClick, handleCopyClick }
}
