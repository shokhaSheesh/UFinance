import { useState } from 'react'

export function useDetailShipmentActions() {
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  // Поставка (закупка) или Отгрузка (продажа) — от этого зависят методы модалки
  const [isPurchase, setIsPurchase] = useState(false)

  const handleEdit = (shipment) => {
    setSelectedShipment(shipment)
    setIsPurchase(shipment?.tip === 'Поставка')
    setIsEditing(true)
    setIsCopying(false)
    setShowShipmentModal(true)
  }

  const handleCopy = (shipment) => {
    setSelectedShipment(shipment)
    setIsPurchase(shipment?.tip === 'Поставка')
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
    isPurchase,
    handleEdit,
    handleCopy,
    closeModal,
  }
}
