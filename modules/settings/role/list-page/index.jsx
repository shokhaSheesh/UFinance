'use client'

import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import DeleteRoleModal from './components/DeleteRoleModal'
import RoleModal from './components/RoleModal'
import RolesHeader from './components/RolesHeader'
import RolesTable from './components/RolesTable'
import { useRolesData } from './hooks/useRolesData'

const RoleListPage = observer(() => {
  const tc = useTranslations('Settings.common')

  const rolePermissions = appStore?.permission?.settings?.users || {
    read: true,
    add: true,
    edit: true,
    delete: true,
  }

  const { roles, rolesLoading, refetchRoles, deleteRole, isDeleting } = useRolesData(tc)

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)

  const handleAdd = () => {
    setEditingRole(null)
    setRoleModalOpen(true)
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    setRoleModalOpen(true)
  }

  const handleDelete = (role) => {
    setRoleToDelete(role)
    setDeleteModalOpen(true)
  }

  const handleCloseRoleModal = () => {
    setRoleModalOpen(false)
    setEditingRole(null)
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setRoleToDelete(null)
  }

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole({ guid: roleToDelete?.guid })
      setDeleteModalOpen(false)
      setRoleToDelete(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <RolesHeader canAdd={rolePermissions?.add} onAdd={handleAdd} />

      <RolesTable
        roles={roles}
        isLoading={rolesLoading}
        canEdit={rolePermissions?.edit}
        canDelete={rolePermissions?.delete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleModal
        key={`${roleModalOpen}-${editingRole?.guid || 'new'}`}
        open={roleModalOpen}
        onClose={handleCloseRoleModal}
        initialRole={editingRole}
        onSuccess={() => refetchRoles?.()}
      />

      <DeleteRoleModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDelete}
        loading={isDeleting}
        role={roleToDelete}
      />
    </div>
  )
})

export default RoleListPage
