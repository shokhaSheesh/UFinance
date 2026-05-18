// hooks/useShipmentActions.js
import { useCallback, useState } from 'react'

/**
 * Encapsulates shipment modal open/close/edit/copy/delete logic.
 */
export function useShipmentActions({ setOperationToDelete, setIsShipmentDeleting, setIsDeleteModalOpen }) {
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment,  setSelectedShipment]  = useState(null)
  const [isShipmentEditing, setIsShipmentEditing] = useState(false)
  const [isShipmentCopying, setIsShipmentCopying] = useState(false)

  const handleEditShipment = useCallback((shipment) => {
    setSelectedShipment(shipment)
    setIsShipmentEditing(true)
    setIsShipmentCopying(false)
    setShowShipmentModal(true)
  }, [])

  const handleCopyShipment = useCallback((shipment) => {
    setSelectedShipment(shipment)
    setIsShipmentEditing(false)
    setIsShipmentCopying(true)
    setShowShipmentModal(true)
  }, [])

  const handleDeleteShipment = useCallback((shipment) => {
    setOperationToDelete(shipment)
    setIsShipmentDeleting(true)
    setIsDeleteModalOpen(true)
  }, [setOperationToDelete, setIsShipmentDeleting, setIsDeleteModalOpen])

  const closeShipmentModal = useCallback(() => {
    setShowShipmentModal(false)
    setSelectedShipment(null)
  }, [])

  return {
    showShipmentModal,
    selectedShipment,
    isShipmentEditing,
    isShipmentCopying,
    handleEditShipment,
    handleCopyShipment,
    handleDeleteShipment,
    closeShipmentModal,
  }
}