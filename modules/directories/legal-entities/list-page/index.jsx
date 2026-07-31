"use client"

import CreateLegalEntityModal from '@/components/directories/CreateLegalEntityModal/CreateLegalEntityModal'
import DeleteLegalEntityConfirmModal from '@/components/directories/DeleteLegalEntityConfirmModal/DeleteLegalEntityConfirmModal'
import FixedContent from '@/layouts/FixedContent'
import { isObjectInUseError } from '@/lib/api/ucode/errors'
import { showErrorNotification } from '@/lib/utils/notifications'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import LegalEntitiesFooter from '../components/LegalEntitiesFooter'
import LegalEntitiesHeader from '../components/LegalEntitiesHeader'
import LegalEntitiesTable from '../components/LegalEntitiesTable'
import { useLegalEntitiesData } from '../hooks/useLegalEntitiesData'
import { useLegalEntitiesModals } from '../hooks/useLegalEntitiesModals'

const LegalEntitiesListPage = observer(() => {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  const tErrors = useTranslations('Errors')

  const legelEntityPermissions = appStore.permission.directories.legalentities

  const data = useLegalEntitiesData(tc)
  const modals = useLegalEntitiesModals()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDeleteConfirm = async () => {
    if (modals.deletingLegalEntity?.guid) {
      try {
        const result = await data.deleteMutation.mutateAsync([modals.deletingLegalEntity.guid])
        // Бэк отвечает 200 с телом-ошибкой, поэтому проверяем и успешный ответ
        if (isObjectInUseError(result)) {
          showErrorNotification(tErrors('cannotDelete.legalEntity'))
          return
        }
        modals.setDeletingLegalEntity(null)
        data.invalidateQueries()
      } catch (error) {
        console.error('Error deleting legal entity:', error)
        if (isObjectInUseError(error)) {
          showErrorNotification(tErrors('cannotDelete.legalEntity'))
        }
      }
    }
  }

  return (
    <FixedContent className="overflow-auto">
      <div className="w-full h-full">
        <LegalEntitiesHeader
          t={t} tc={tc}
          canAdd={legelEntityPermissions.add}
          onCreateClick={() => modals.setIsCreateModalOpen(true)}
          searchQuery={data.searchQuery}
          setSearchQuery={data.setSearchQuery}
        />

        <LegalEntitiesTable
          t={t}
          entities={data.entities}
          isLoading={data.isLoading}
          searchQuery={data.searchQuery}
          onEdit={modals.handleEdit}
          onDelete={modals.handleDelete}
        />

        <LegalEntitiesFooter
          t={t}
          isLoading={data.isLoading}
          count={data.legalEntitiesItems.length}
        />
      </div>

      {modals.isCreateModalOpen && (
        <CreateLegalEntityModal
          isOpen={modals.isCreateModalOpen}
          onClose={() => {
            modals.setIsCreateModalOpen(false)
            data.invalidateQueries()
          }}
        />
      )}

      {modals.editingLegalEntity && (
        <CreateLegalEntityModal
          isOpen={!!modals.editingLegalEntity}
          onClose={() => {
            modals.setEditingLegalEntity(null)
            data.invalidateQueries()
          }}
          legalEntity={modals.editingLegalEntity}
        />
      )}

      {modals.deletingLegalEntity && (
        <DeleteLegalEntityConfirmModal
          isOpen={!!modals.deletingLegalEntity}
          legalEntity={modals.deletingLegalEntity}
          onConfirm={handleDeleteConfirm}
          onCancel={() => modals.setDeletingLegalEntity(null)}
          isDeleting={data.deleteMutation.isPending}
        />
      )}
    </FixedContent>
  )
})

export default LegalEntitiesListPage
