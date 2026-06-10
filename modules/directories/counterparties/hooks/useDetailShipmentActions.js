import { useState } from 'react'

export function useDetailShipmentActions() {
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleEdit = (shipment) => {
    setSelectedShipment(shipment)
    setIsEditing(true)
    setIsCopying(false)
    setShowShipmentModal(true)
  }

  const handleCopy = (shipment) => {
    setSelectedShipment(shipment)
    setIsEditing(false)
    setIsCopying(true)
    setShowShipmentModal(true)
  }

  const closeModal = () => {
    setShowShipmentModal(false)
  }

  return {
    showShipmentModal,
    selectedShipment,
    isEditing,
    isCopying,
    handleEdit,
    handleCopy,
    closeModal,
  }
}
