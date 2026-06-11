'use client'

import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import AddUserModal from './components/AddUserModal'
import BranchDetailHeader from './components/BranchDetailHeader'
import BranchUsersTable from './components/BranchUsersTable'
import DeleteUserModal from './components/DeleteUserModal'
import { useBranchDetailData } from './hooks/useBranchDetailData'
import { useBranchUsersData } from './hooks/useBranchUsersData'

const BranchDetailPage = () => {
  const { id } = useParams()
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')
  const params = useSearchParams()
  const branchName = params?.get('name')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)

  const {
    rolesData,
    setRoleSearch,
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,
  } = useBranchDetailData({ branchId: id, tb })

  const {
    usersList,
    isLoading,
    companyUsers,
    usersLoading,
    emailSearch,
    setEmailSearch,
  } = useBranchUsersData({ branchId: id, editingUser })

  const handleCreate = () => {
    setEditingUser(null)
    setSelectedUser(null)
    setEmailSearch('')
    setRoleSearch('')
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setEmailSearch(user?.user_email || '')
    setSelectedUser({
      guid: user?.user_id,
      email: user?.user_email,
      name: user?.user_name,
      phone: user?.user_phone,
      role_id: user?.roles_id,
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setSelectedUser(null)
  }

  const handleSubmit = (data, resetForm) => {
    if (editingUser) {
      updateUserMutation.mutate(
        {
          guid: editingUser?.guid,
          role_id: data?.role_id,
        },
        {
          onSuccess: () => {
            handleCloseModal()
            resetForm?.()
          },
        }
      )
    } else {
      const payload = {
        branches_id: id,
        name: data?.name,
        email: selectedUser?.email || data?.email || '',
        phone: data?.phone,
        role_id: data?.role_id,
      }
      if (selectedUser) {
        payload.user_id = selectedUser?.guid
      }
      createUserMutation.mutate(payload, {
        onSuccess: () => {
          handleCloseModal()
          resetForm?.()
        },
      })
    }
  }

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete?.guid, {
        onSuccess: () => setUserToDelete(null),
      })
    }
  }

  const isPending =
    createUserMutation?.isPending ||
    updateUserMutation?.isPending ||
    deleteUserMutation?.isPending

  return (
    <div className="flex-1 bg-white">
      <BranchDetailHeader
        branchName={branchName}
        onCreate={handleCreate}
        tb={tb}
        tc={tc}
      />

      <BranchUsersTable
        usersList={usersList}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={setUserToDelete}
        tb={tb}
      />

      <AddUserModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editingUser={editingUser}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        emailSearch={emailSearch}
        setEmailSearch={setEmailSearch}
        companyUsers={companyUsers}
        usersLoading={usersLoading}
        rolesData={rolesData}
        setRoleSearch={setRoleSearch}
        onSubmit={handleSubmit}
        isPending={isPending}
        tb={tb}
        tc={tc}
      />

      <DeleteUserModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        isPending={deleteUserMutation?.isPending}
        tb={tb}
        tc={tc}
      />
    </div>
  )
}

export default BranchDetailPage
