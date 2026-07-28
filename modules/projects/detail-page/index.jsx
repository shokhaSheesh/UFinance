'use client'

import CreateShipment from '@/components/deals/details/CreatingShipment'
import OperationModal from '@/components/operations/OperationModal/OperationModal'
import { DeleteConfirmModal } from '@/components/operations/OperationsTable/DeleteConfirmModal'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import ScreenLoader from '@/components/shared/ScreenLoader'
import { GlobalCurrency } from '@/constants/globalCurrency'
import FixedContent from '@/layouts/FixedContent'
import useMounted from '@/hooks/useMounted'
import { STATUS_COLORS } from '@/lib/api/ucode/projects'
import { useDetailShipmentActions } from '@/modules/directories/counterparties/hooks/useDetailShipmentActions'
import { observer } from 'mobx-react-lite'
import moment from 'moment'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import ProjectDetailHeader from '../components/ProjectDetailHeader'
import ProjectOperations from '../components/ProjectOperations'
import ProjectOpsFooter from '../components/ProjectOpsFooter'
import ProjectSummaryCards from '../components/ProjectSummaryCards'
import {
  useDeleteProject,
  useProject,
  useProjectGroups,
  useUpdateProject,
  useUpdateProjectStatus,
} from '../hooks/useProjectsData'
import { useProjectOperationActions } from '../hooks/useProjectOperationActions'
import { useProjectOperations } from '../hooks/useProjectOperations'
import { useProjectPnl } from '../hooks/useProjectPnl'

const isShipmentOp = (op) => op?.tip === 'Отгрузка' || op?.tip === 'Поставка'
const tabForTip = (tip) =>
  tip === 'Поступление' ? 'income' : tip === 'Выплата' ? 'payment' : tip === 'Перемещение' ? 'transfer' : 'accrual'

export default observer(function ProjectDetailPage() {
  const t = useTranslations('Projects')
  const td = useTranslations('Projects.detail')
  const to = useTranslations('Projects.operationsTable')
  const ts = useTranslations('Projects.status')
  const tc = useTranslations('Common')
  const mounted = useMounted()
  const params = useParams()
  const router = useRouter()

  const guid = params?.id

  const [analysisMethod, setAnalysisMethod] = useState('accrual')
  const [planSource, setPlanSource] = useState('operations')
  const [dateRange, setDateRange] = useState(() => ({
    start: moment().startOf('year').toDate(),
    end: moment().toDate(),
  }))
  const [dateRangeType, setDateRangeType] = useState('year')
  const [editOpen, setEditOpen] = useState(false)

  const { project, isLoading } = useProject(guid)
  const { groups } = useProjectGroups()
  const updateProjectMut = useUpdateProject()
  const deleteProjectMut = useDeleteProject()
  const statusMut = useUpdateProjectStatus()

  // Операции проекта
  const projectOps = useProjectOperations(guid)
  const ops = useProjectOperationActions()
  const shipment = useDetailShipmentActions()

  // P&L проекта: доходы/расходы из отчёта, прибыль/рентабельность — из итогов
  const pnl = useProjectPnl(guid, { isCalculation: analysisMethod, dateRange })

  // Карточки: факт из P&L (плана нет — показываем то же значение, как в PlanFact)
  const plan = useMemo(
    () => ({
      profit: { fact: pnl.profit, plan: pnl.profit },
      profitability: { fact: pnl.profitability, plan: pnl.profitability },
      income: { fact: pnl.income, plan: pnl.income },
      expenses: { fact: pnl.expenses, plan: pnl.expenses },
    }),
    [pnl.profit, pnl.profitability, pnl.income, pnl.expenses]
  )
  const symbol = GlobalCurrency?.name || pnl.currency || '₽'

  const methodOptions = useMemo(
    () => [
      { value: 'cash', label: t('methods.cash') },
      { value: 'accrual', label: t('methods.accrual') },
    ],
    [t]
  )
  const planSourceOptions = useMemo(
    () => [{ value: 'operations', label: td('planSourceOperations') }],
    [td]
  )

  const onEditOperation = (operation) => {
    if (isShipmentOp(operation)) shipment.handleEdit(operation)
    else ops.handleEdit(operation)
  }
  const onCopyOperation = (operation) => {
    if (isShipmentOp(operation)) shipment.handleCopy(operation)
    else ops.handleCopy(operation)
  }

  if (!mounted) return null

  if (isLoading && !project) {
    return (
      <FixedContent className="bg-white">
        <ScreenLoader className="left-0!" />
      </FixedContent>
    )
  }

  if (!project) {
    return (
      <FixedContent className="items-center justify-center bg-white">
        <p className="text-neutral-500 text-sm">{t('empty')}</p>
      </FixedContent>
    )
  }

  const submitEdit = async (payload) => {
    await updateProjectMut.mutateAsync({
      guid: project.id,
      name: payload.name,
      project_groups_id: payload.groupId ?? '',
      description: payload.comment ?? '',
    })
  }

  const invalidateOps = () => ops.invalidate()

  return (
    <FixedContent className="flex-col bg-white overflow-y-auto">
      <ProjectDetailHeader
        td={td}
        ts={ts}
        tc={tc}
        project={project}
        groupName={project.groupName}
        statusColor={STATUS_COLORS[project.status]}
        analysisMethod={analysisMethod}
        methodOptions={methodOptions}
        planSource={planSource}
        planSourceOptions={planSourceOptions}
        dateRange={dateRange}
        dateRangeType={dateRangeType}
        onMethodChange={setAnalysisMethod}
        onPlanSourceChange={setPlanSource}
        onDateRangeChange={setDateRange}
        onDateRangeTypeChange={setDateRangeType}
        onEdit={() => setEditOpen(true)}
        onToggleStatus={() => statusMut.mutate({ guid: project.id })}
        onDelete={() => deleteProjectMut.mutate(project.id, { onSuccess: () => router.push('/projects') })}
      />

      <ProjectSummaryCards
        td={td}
        plan={plan}
        chartData={pnl.chartData}
        symbol={symbol}
        loading={pnl.isLoading || pnl.isFetching}
      />

      <ProjectOperations
        td={td}
        to={to}
        tc={tc}
        operations={projectOps.operations}
        operationsList={projectOps.operationsList}
        isLoading={projectOps.isLoading}
        filters={projectOps.filters}
        setFilters={projectOps.setFilters}
        onCreateOperation={() => ops.openCreate('income')}
        onEditOperation={onEditOperation}
        onDeleteOperation={ops.handleDelete}
        onCopyOperation={onCopyOperation}
        fetchNextPage={projectOps.fetchNextPage}
        hasNextPage={projectOps.hasNextPage}
        isFetchingNextPage={projectOps.isFetchingNextPage}
      />

      <ProjectOpsFooter td={td} summary={projectOps.summary} stats={projectOps.stats} />

      {/* Редактирование проекта */}
      {editOpen && (
        <CreateProjectModal
          isOpen
          project={project}
          groups={groups}
          onClose={() => setEditOpen(false)}
          onSubmit={submitEdit}
          onGroupCreated={() => null}
        />
      )}

      {/* Создание операции */}
      {ops.isCreateOpen && (
        <OperationModal
          operation={ops.creatingOperation}
          initialTab={ops.createModalType}
          isClosing={ops.isCreateClosing}
          isOpening={ops.isCreateOpening}
          onClose={ops.handleCloseCreate}
          onSuccess={invalidateOps}
        />
      )}

      {/* Редактирование операции */}
      {ops.editingOperation && (
        <OperationModal
          operation={ops.editingOperation}
          initialTab={tabForTip(ops.editingOperation?.tip)}
          isClosing={ops.isEditClosing}
          isOpening={ops.isEditOpening}
          onClose={ops.handleCloseEdit}
          onSuccess={invalidateOps}
        />
      )}

      {/* Удаление операции */}
      {ops.deletingOperation && (
        <DeleteConfirmModal
          isOpen={!!ops.deletingOperation}
          operation={ops.deletingOperation}
          onConfirm={ops.handleDeleteConfirm}
          onCancel={() => ops.setDeletingOperation(null)}
          isDeleting={ops.isDeletePending}
        />
      )}

      {/* Отгрузка / Поставка */}
      {shipment.showShipmentModal && (
        <CreateShipment
          open={shipment.showShipmentModal}
          onClose={shipment.closeModal}
          initialData={shipment.selectedShipment}
          isEditing={shipment.isEditing}
          isCopying={shipment.isCopying}
          onSuccess={invalidateOps}
          {...(shipment.isPurchase
            ? {
                isPurchase: true,
                dealName: shipment.selectedShipment?.purchase_transaction_name,
                dealGuid: shipment.selectedShipment?.purchase_transactions_id,
                dealIdField: 'purchase_transactions_id',
                createMethod: 'create_supply_transaction',
                updateMethod: 'update_supply_transaction',
                getMethod: 'get_supply_transaction',
                operationType: ['Поставка'],
                allowedTypes: ['Расходы', 'Актив', 'Обязательства'],
                invalidateKeys: ['list_operations_by_query'],
              }
            : {
                dealName: shipment.selectedShipment?.selling_deal_name,
                dealGuid: shipment.selectedShipment?.selling_deal_id,
              })}
        />
      )}
    </FixedContent>
  )
})
