'use client'

import { appStore } from '@/store/app.store'
import { Plus } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import DeleteReasonModal from './components/DeleteReasonModal'
import ReasonModal from './components/ReasonModal'
import ReasonsTable from './components/ReasonsTable'
import { useDeleteReason, useReasonsData } from './hooks/useReasonsData'

// Справочник причин отсутствия (non_participation_reasons)
const ReasonsListPage = observer(() => {
  const tr = useTranslations('Settings.reasons')

  const reasonPermissions = appStore?.permission?.settings?.general || {
    read: true,
    add: true,
    edit: true,
    delete: true,
  }

  const { reasons, isLoading } = useReasonsData()
  const { remove, isDeleting } = useDeleteReason()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingReason, setEditingReason] = useState(null)
  const [reasonToDelete, setReasonToDelete] = useState(null)

  const handleAdd = () => {
    setEditingReason(null)
    setModalOpen(true)
  }

  const handleEdit = (reason) => {
    setEditingReason(reason)
    setModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!reasonToDelete) return
    await remove(reasonToDelete?.guid)
    setReasonToDelete(null)
  }

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center h-16 sticky top-0 bg-white z-20 justify-between gap-5 px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-semibold text-gray-ucode-800">{tr('pageTitle')}</h1>
        {reasonPermissions?.add && (
          <button onClick={handleAdd} className="primary-btn">
            <Plus size={16} />
            {tr('add')}
          </button>
        )}
      </div>

      <ReasonsTable
        reasons={reasons}
        isLoading={isLoading}
        canAdd={reasonPermissions?.add}
        canEdit={reasonPermissions?.edit}
        canDelete={reasonPermissions?.delete}
        onCreate={handleAdd}
        onEdit={handleEdit}
        onDelete={setReasonToDelete}
      />

      <ReasonModal
        key={`${modalOpen}-${editingReason?.guid || 'new'}`}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingReason(null)
        }}
        initialReason={editingReason}
      />

      <DeleteReasonModal
        open={!!reasonToDelete}
        onClose={() => setReasonToDelete(null)}
        onConfirm={confirmDelete}
        reason={reasonToDelete}
        loading={isDeleting}
      />
    </div>
  )
})

export default ReasonsListPage
