import { useCallback } from 'react'

export function usePurchasesActions({
  router,
  dealPermission,
  setDealToDelete,
  setDealToEdit,
  setDealToCopy,
  setIsCreateModalOpen,
  setShowCreateStudentModal,
  setCanUpdateForms,
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

  const handleEditClick = useCallback((deal, e) => {
    e.stopPropagation()
    setDealToEdit(deal)
    if (deal?.contract_file) {
      setShowCreateStudentModal(true)
      return
    }
    setIsCreateModalOpen(true)
  }, [setDealToEdit, setShowCreateStudentModal, setIsCreateModalOpen])

  const handleCopyClick = useCallback((deal, e) => {
    e.stopPropagation()
    setDealToCopy(deal)
    setIsCreateModalOpen(true)
  }, [setDealToCopy, setIsCreateModalOpen])

  const handleUpdate = useCallback((deal, e) => {
    e?.stopPropagation()
    setDealToEdit(deal)
    setShowCreateStudentModal(true)
    setCanUpdateForms(true)
  }, [setDealToEdit, setShowCreateStudentModal, setCanUpdateForms])

  return { handleRowClick, handleDeleteClick, handleEditClick, handleCopyClick, handleUpdate }
}
