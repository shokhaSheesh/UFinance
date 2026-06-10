"use client"

import CreateShipment from '@/components/deals/details/CreatingShipment'
import CreateCounterpartyModal from '@/components/directories/CreateCounterpartyModal/CreateCounterpartyModal'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { DeleteConfirmModal } from '@/components/operations/OperationsTable/DeleteConfirmModal'
import ScreenLoader from '@/components/shared/ScreenLoader'
import FixedContent from '@/layouts/FixedContent'
import { useQueryClient } from '@tanstack/react-query'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'

import DetailFooter from '../components/DetailFooter'
import DetailHeader from '../components/DetailHeader'
import DetailOperationsSection from '../components/DetailOperationsSection'
import DetailStatsGrid from '../components/DetailStatsGrid'
import { useCounterpartyDetail } from '../hooks/useCounterpartyDetail'
import { useDetailOperationActions } from '../hooks/useDetailOperationActions'
import { useDetailShipmentActions } from '../hooks/useDetailShipmentActions'

const CounterpartyDetailPage = observer(() => {
  const t = useTranslations('Directories.counterparty.detail')
  const tc = useTranslations('Common')
  const params = useParams()
  const counterpartyGuid = params?.id
  const queryClient = useQueryClient()

  const detail = useCounterpartyDetail(counterpartyGuid, tc)
  const ops = useDetailOperationActions(counterpartyGuid)
  const shipment = useDetailShipmentActions()

  const [isEditCounterpartyModalOpen, setIsEditCounterpartyModalOpen] = useState(false)

  const handleEditOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      shipment.handleEdit(operation)
      return
    }
    ops.handleEdit(operation)
  }

  const handleCopyOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      shipment.handleCopy(operation)
      return
    }
    ops.handleCopy(operation)
  }

  const handleDeleteOperation = (operation) => {
    if (operation.tip === 'Отгрузка') {
      ops.handleDelete(operation)
      return
    }
    ops.handleDelete(operation)
  }

  return (
    <FixedContent className="right-0 bottom-0 overflow-y-auto">
      {detail.isLoading && <ScreenLoader />}

      {!detail.counterparty && !detail.isLoading && (
        <div className="fixed h-[calc(100vh-60px)] top-[60px] left-[80px] right-0 bottom-0 overflow-y-auto">
          <div className="flex-1 h-full flex flex-col">
            <div className="p-8 text-center text-gray-500">{t('notFound')}</div>
          </div>
        </div>
      )}

      {detail.isDeletingCounterparty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="text-white font-medium">{t('actions.deleting')}</span>
          </div>
        </div>
      )}

      <div className="flex-1 h-full flex flex-col">
        <DetailHeader
          t={t} tc={tc}
          counterpartyInfo={detail.counterpartyInfo}
          filters={detail.filters} setFilters={detail.setFilters}
          canEdit={detail.canEdit} canDelete={detail.canDelete}
          onEdit={() => setIsEditCounterpartyModalOpen(true)}
          onDelete={detail.handleDeleteCounterparty}
        />

        <DetailStatsGrid
          t={t} tc={tc}
          counterpartyInfo={detail.counterpartyInfo}
          stats={detail.stats}
          filters={detail.filters}
          onEdit={() => setIsEditCounterpartyModalOpen(true)}
        />

        <DetailOperationsSection
          t={t} tc={tc}
          operationsList={detail.operationsList}
          operations={detail.operations}
          isLoading={detail.isLoading}
          counterpartyInfo={detail.counterpartyInfo}
          filters={detail.filters}
          setFilters={detail.setFilters}
          selectedOperations={ops.selectedOperations}
          onCreateOperation={() => ops.openCreate('income')}
          onEditOperation={handleEditOperation}
          onDeleteOperation={handleDeleteOperation}
          onCopyOperation={handleCopyOperation}
        />

        <DetailFooter t={t} summary={detail.summary} stats={detail.stats} />
      </div>

      {/* Modals */}
      {ops.isCreateOpen && (
        <OperationModal
          operation={ops.creatingOperation}
          initialTab={ops.createModalType}
          isClosing={ops.isCreateClosing}
          isOpening={ops.isCreateOpening}
          chart_of_accounts_id={detail.counterparty?.chart_of_accounts_id}
          chart_of_accounts_id_2={detail.counterparty?.chart_of_accounts_id_2}
          onClose={ops.handleCloseCreate}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })}
          preselectedCounterparty={counterpartyGuid}
          disableCounterpartySelect={true}
        />
      )}

      {ops.editingOperation && (
        <OperationModal
          operation={ops.editingOperation}
          initialTab={ops.editingOperation?.tip === 'Поступление' ? 'income' : ops.editingOperation?.tip === 'Выплата' ? 'payment' : ops.editingOperation?.tip === 'Перемещение' ? 'transfer' : 'accrual'}
          isClosing={ops.isEditClosing}
          isOpening={ops.isEditOpening}
          chart_of_accounts_id={detail.counterparty?.chart_of_accounts_id}
          chart_of_accounts_id_2={detail.counterparty?.chart_of_accounts_id_2}
          onClose={ops.handleCloseEdit}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })}
          preselectedCounterparty={counterpartyGuid}
          disableCounterpartySelect={true}
        />
      )}

      {ops.deletingOperation && (
        <DeleteConfirmModal
          isOpen={!!ops.deletingOperation}
          operation={ops.deletingOperation}
          onConfirm={ops.handleDeleteConfirm}
          onCancel={() => ops.setDeletingOperation(null)}
          isDeleting={ops.isDeletePending}
        />
      )}

      {shipment.showShipmentModal && (
        <CreateShipment
          open={shipment.showShipmentModal}
          onClose={shipment.closeModal}
          initialData={shipment.selectedShipment}
          isEditing={shipment.isEditing}
          isCopying={shipment.isCopying}
          dealName={shipment.selectedShipment?.selling_deal_name}
          dealGuid={shipment.selectedShipment?.selling_deal_id}
          kontragentId={detail.counterparty?.guid}
        />
      )}

      <CreateCounterpartyModal
        isOpen={isEditCounterpartyModalOpen}
        onClose={() => setIsEditCounterpartyModalOpen(false)}
        onSuccess={() => {
          setIsEditCounterpartyModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['counterpartyById', counterpartyGuid] })
        }}
        counterpartyData={detail.counterparty}
      />
    </FixedContent>
  )
})

export default CounterpartyDetailPage
