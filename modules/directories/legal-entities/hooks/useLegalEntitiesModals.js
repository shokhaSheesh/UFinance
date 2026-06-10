import { useState } from 'react'

export function useLegalEntitiesModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingLegalEntity, setEditingLegalEntity] = useState(null)
  const [deletingLegalEntity, setDeletingLegalEntity] = useState(null)

  const handleEdit = (legalEntity) => setEditingLegalEntity(legalEntity?.rawData)
  const handleDelete = (legalEntity) => setDeletingLegalEntity(legalEntity?.rawData)

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingLegalEntity,
    setEditingLegalEntity,
    deletingLegalEntity,
    setDeletingLegalEntity,
    handleEdit,
    handleDelete,
  }
}
