'use client'

import CustomModal from '@/components/shared/CustomModal'
import Input from '@/components/shared/Input'
import { queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Loader, Pencil, Plus, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '../../../../lib/api/ucode/base'
import { appStore } from '../../../../store/app.store'

/* ═══════════════════════════════════════════════════════ */
/*  RoleModal - Create/Edit                              */
/* ═══════════════════════════════════════════════════════ */

function RoleModal({ open, onClose, initialRole, onSuccess }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: initialRole?.name || '',
      description: initialRole?.description || '',
    },
  })

  const { mutateAsync: saveRole, isPending: isSaving } = useMutation({
    mutationKey: ['role_control'],
    mutationFn: ({ method, data }) => apiClient.invokeFunction({ method, data, type: 'role' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_roles'] })
      onSuccess?.()
      onClose()
      reset()
    },
  })

  const onSubmit = async (data) => {
    const method = initialRole ? 'update_role' : 'create_role'
    const payload = {
      method,
      data: initialRole
        ? {
          guid: initialRole.guid,
          name: data.name,
          description: data.description,
        }
        : {
          name: data.name,
          description: data.description,
        },
    }
    await saveRole(payload)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <CustomModal isOpen={open} onClose={handleClose} className="w-[480px] max-w-[95vw] p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-6">
        {initialRole ? tr('edit') : tr('add')}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Role Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tr('name')}</label>
          <Input
            placeholder={tr('namePlaceholder')}
            error={!!errors.name}
            {...register('name', { required: tr('errors.nameRequired') })}
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tr('description')}</label>
          <Input
            placeholder={tr('descriptionPlaceholder')}
            error={!!errors.description}
            {...register('description')}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 mt-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {isSaving && <Loader size={14} className="animate-spin" />}
            {isSaving ? tc('saving') : initialRole ? tc('save') : tc('create')}
          </button>
        </div>
      </form>
    </CustomModal>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  DeleteRoleModal                                       */
/* ═══════════════════════════════════════════════════════ */

function DeleteRoleModal({ open, onClose, onConfirm, role, loading }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')
  return (
    <CustomModal isOpen={open} onClose={onClose} className="w-[480px] max-w-[95vw] p-0 overflow-hidden">
      <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-gray-200 pr-14">
        <h3 className="text-lg font-bold text-slate-900">{tc('delete')}</h3>
      </div>

      <div className="px-7 py-6">
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {tr('delete.confirm') || 'Вы уверены, что хотите удалить роль?'}
        </p>
        {role && (
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2.5">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 font-medium min-w-[120px]">{tr('name')}:</span>
              <span className="text-slate-900 font-medium">{role.name || '—'}</span>
            </div>
            {role.description && (
              <div className="flex gap-2 text-sm">
                <span className="text-slate-500 font-medium min-w-[120px]">{tr('description')}:</span>
                <span className="text-slate-900 font-medium">{role.description}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2.5 px-7 pb-6">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {tc('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
        >
          {loading && <Loader size={14} className="animate-spin" />}
          {tc('delete')}
        </button>
      </div>
    </CustomModal>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  RolePage                                              */
/* ═══════════════════════════════════════════════════════ */

const RolesPage = observer(() => {
  const router = useRouter()
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')
  const rolePermissions = appStore.permission?.settings?.users || { read: true, add: true, edit: true, delete: true }
  const { data: rolesData, isLoading: rolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['get_roles_list'],
    queryFn: () => apiClient.invokeFunction({
      method: 'get_roles',
      data: { page: 1, limit: 50 },
      type: "role"
    }),
    refetchOnMount: true,
  })
  const roles = rolesData?.data?.data?.items || []

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)

  const { mutateAsync: deleteRole, isPending: isDeleting } = useMutation({
    mutationKey: ['delete_role'],
    mutationFn: (data) => apiClient.invokeFunction({ method: 'delete_role', data, type: 'role' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get_roles_list'] })
      setDeleteModalOpen(false)
      setRoleToDelete(null)
    }
  })

  const handleEdit = (role) => {
    setEditingRole(role)
    setRoleModalOpen(true)
  }

  const handleDelete = (role) => {
    setRoleToDelete(role)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole({
        guid: roleToDelete.guid,
      })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="flex items-center h-16 sticky top-0 bg-white z-20  justify-start gap-5 px-6 py-4 border-b border-gray-100 shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">{tr('pageTitle')}</h1>
        {rolePermissions.add && (
          <button
            onClick={() => {
              setEditingRole(null)
              setRoleModalOpen(true)
            }}
            className="primary-btn flex items-center gap-1.5"
          >
            <Plus size={16} />
            {tr('add')}
          </button>
        )}
      </div>

      {/* Table container — only tbody scrolls */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tr('name')}</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tr('description')}</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">{tc('noData')}</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">{tc('createdAt') || 'Дата создания'}</th>
              <th className="w-24 px-3 py-2"></th>
            </tr>
          </thead>
        </table>

        {/* Scrollable tbody section */}
        <div className="flex-1 overflow-y-auto">
          {rolesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader size={32} className="animate-spin text-primary" />
            </div>
          ) : (
              <table className="w-full table-fixed">
                <tbody className="divide-y divide-gray-50 ">
                  {roles.map((role, index) => (
                    <tr key={role.guid || role.id} onClick={() => router.push(`/pages/settings/role/${role.guid}?role_name=${role.name}`)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-3 py-2 text-sm text-gray-400 w-12">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-gray-900">{role.name}</span>
                      </div>
                    </td>
                      <td className="px-3 py-2 text-sm text-gray-500 truncate">{role.description || '—'}</td>
                      <td className="px-3 py-2 w-36">
                      <span className="text-sm text-gray-700">{role.users_count || 0}</span>
                    </td>
                      <td className="px-3 py-2 text-sm text-gray-500 w-36">{formatDate(role.created_at)}</td>
                      <td className="px-3 py-2 w-24">
                        {(rolePermissions.edit || rolePermissions.delete) && (
                          <div
                            className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rolePermissions.edit && (
                              <button
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => handleEdit(role)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {rolePermissions.delete && (
                              <button
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                onClick={() => handleDelete(role)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                    </td>
                  </tr>
                ))}

                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-sm text-gray-400">
                        {tr('noData') || 'Нет ролей'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          )}
        </div>
      </div> 

      {/* Create / Edit Modal */}
      <RoleModal
        key={`${roleModalOpen}-${editingRole?.guid || 'new'}`}
        open={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false)
          setEditingRole(null)
        }}
        initialRole={editingRole}
        onSuccess={() => refetchRoles()}
      />

      {/* Delete Modal */}
      <DeleteRoleModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setRoleToDelete(null)
        }}
        onConfirm={confirmDelete}
        loading={isDeleting}
        role={roleToDelete}
      />
    </div>
  )
})

export default RolesPage