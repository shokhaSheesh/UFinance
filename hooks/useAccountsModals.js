import { useState } from 'react'

export function useAccountsModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [editingLegalEntity, setEditingLegalEntity] = useState(null)
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(null)

  const closeAllModals = () => {
    setIsCreateModalOpen(false)
    setIsCreateGroupModalOpen(false)
    setIsMenuOpen(false)
    setEditingAccount(null)
    setEditingGroup(null)
    setEditingLegalEntity(null)
    setDeletingGroup(null)
    setDeletingAccount(null)
  }

  const openCreateAccountModal = () => {
    setIsCreateModalOpen(true)
    setIsMenuOpen(false)
  }

  const openCreateGroupModal = () => {
    setIsCreateGroupModalOpen(true)
    setIsMenuOpen(false)
  }

  const openEditAccountModal = (account) => {
    setEditingAccount(account)
  }

  const openEditGroupModal = (group) => {
    setIsCreateGroupModalOpen(true)
    setEditingGroup(group)
  }

  const openDeleteGroupModal = (group) => {
    setDeletingGroup(group)
  }

  const openDeleteAccountModal = (account) => {
    setDeletingAccount(account)
  }

  const openEditLegalEntityModal = (legalEntity) => {
    setEditingLegalEntity(legalEntity)
  }

  const closeCreateAccountModal = () => {
    setIsCreateModalOpen(false)
  }

  const closeCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false)
    setEditingGroup(null)
  }

  const closeDeleteAccountModal = () => {
    setDeletingAccount(null)
  }

  const closeDeleteGroupModal = () => {
    setDeletingGroup(null)
  }

  const closeEditLegalEntityModal = () => {
    setEditingLegalEntity(null)
  }

  return {
    isCreateModalOpen,
    isCreateGroupModalOpen,
    isMenuOpen,
    editingAccount,
    editingGroup,
    editingLegalEntity,
    deletingGroup,
    deletingAccount,
    setIsMenuOpen,
    closeAllModals,
    openCreateAccountModal,
    openCreateGroupModal,
    openEditAccountModal,
    openEditGroupModal,
    openDeleteGroupModal,
    openDeleteAccountModal,
    openEditLegalEntityModal,
    closeCreateAccountModal,
    closeCreateGroupModal,
    closeDeleteAccountModal,
    closeDeleteGroupModal,
    closeEditLegalEntityModal,
  }
}
