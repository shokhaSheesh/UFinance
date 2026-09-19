'use client'

import Input from '@/components/shared/Input'
import TableCard from '@/components/shared/Table/TableCard'
import TableToolbar from '@/components/shared/Table/TableToolbar'
import { Search } from 'lucide-react'
import CreateWarehouseModal from '@/components/warehouse/CreateWarehouseModal/CreateWarehouseModal'
import DeleteWarehouseConfirmModal from '@/components/warehouse/DeleteWarehouseConfirmModal/DeleteWarehouseConfirmModal'
import FixedContent from '@/layouts/FixedContent'
import { appStore } from '@/store/app.store'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import TransferDocModal from '../components/TransferDocModal'
import TransferListModal from '../components/TransferListModal'
import TransferModal from '../components/TransferModal'
import WarehousesHeader from '../components/WarehousesHeader'
import WarehousesTable from '../components/WarehousesTable'
import { useWarehousesData } from './hooks/useWarehousesData'
import { useWarehousesModals } from './hooks/useWarehousesModals'

export default observer(function WarehousesListPage() {
  const t = useTranslations('Warehouse')
  const tc = useTranslations('Common')

  const { searchQuery, setSearchQuery, warehouses, isLoading, deleteMutation } = useWarehousesData()
  const modals = useWarehousesModals()
  const warehousePermission = appStore.permission.warehouse

  // Перемещения между складами: история → документ, и отдельная форма создания.
  // Со списка склад-отправитель не предзаполняем — его выбирают в форме.
  const [isTransferListOpen, setIsTransferListOpen] = useState(false)
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleDeleteConfirm = async () => {
    if (!modals.deletingWarehouse?.guid) return
    try {
      await deleteMutation.mutateAsync(modals.deletingWarehouse.guid)
      modals.setDeletingWarehouse(null)
    } catch {
      // error toast already shown by the mutation; keep the modal open
    }
  }

  return (
    <FixedContent className="flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
      <WarehousesHeader
        t={t}
        canAdd={!!warehousePermission?.add}
        onCreateClick={() => modals.setIsCreateModalOpen(true)}
        onOpenTransfers={() => setIsTransferListOpen(true)}
      />

      <TableCard>
        <TableToolbar
          search={
            <div className="w-full max-w-[420px]">
              <Input
                type="text"
                placeholder={t('searchWarehousesPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          }
        />

      <WarehousesTable
        t={t}
        tc={tc}
        warehouses={warehouses}
        isLoading={isLoading}
        canEdit={!!warehousePermission?.edit}
        canDelete={!!warehousePermission?.delete}
        onEdit={modals.handleEdit}
        onDelete={modals.handleDelete}
      />
      </TableCard>
      </div>

      {(modals.isCreateModalOpen || modals.editingWarehouse) && (
        <CreateWarehouseModal
          isOpen={modals.isCreateModalOpen || !!modals.editingWarehouse}
          onClose={() => {
            modals.setIsCreateModalOpen(false)
            modals.setEditingWarehouse(null)
          }}
          warehouse={modals.editingWarehouse}
        />
      )}

      {modals.deletingWarehouse && (
        <DeleteWarehouseConfirmModal
          isOpen={!!modals.deletingWarehouse}
          warehouse={modals.deletingWarehouse}
          onConfirm={handleDeleteConfirm}
          onCancel={() => modals.setDeletingWarehouse(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      <TransferListModal
        open={isTransferListOpen && !isTransferFormOpen}
        onClose={() => setIsTransferListOpen(false)}
        canAdd={!!warehousePermission?.add}
        onCreate={() => setIsTransferFormOpen(true)}
        onSelect={setSelectedTransfer}
        t={t}
      />

      <TransferDocModal
        open={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        item={selectedTransfer}
        t={t}
      />

      <TransferModal
        open={isTransferFormOpen}
        onClose={() => setIsTransferFormOpen(false)}
        t={t}
      />
    </FixedContent>
  )
})
