import { useState } from 'react'

export function useWarehousesModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [deletingWarehouse, setDeletingWarehouse] = useState(null)

  const handleEdit = (warehouse) => setEditingWarehouse(warehouse)
  const handleDelete = (warehouse) => setDeletingWarehouse(warehouse)

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingWarehouse,
    setEditingWarehouse,
    deletingWarehouse,
    setDeletingWarehouse,
    handleEdit,
    handleDelete,
  }
}
