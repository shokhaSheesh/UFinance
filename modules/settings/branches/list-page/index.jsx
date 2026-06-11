'use client'

import { observer } from 'mobx-react-lite'
import BranchModal from '../components/BranchModal'
import BranchesHeader from '../components/BranchesHeader'
import BranchesTable from '../components/BranchesTable'
import DeleteBranchModal, { WarningModal } from '../components/DeleteBranchModal'
import { useBranchModal } from '../hooks/useBranchModal'
import { useBranchesData } from '../hooks/useBranchesData'

const BranchesListPage = observer(() => {
  const {
    branches,
    branchesLoading,
    refetchBranches,
    mutateLoading,
    deleteModalOpen,
    branchToDelete,
    warningModalOpen,
    handleDeleteBranch,
    confirmDeleteBranch,
    closeDeleteModal,
    closeWarningModal,
  } = useBranchesData()

  const { branchModalOpen, editingBranch, openCreate, openEdit, closeModal } = useBranchModal()

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <BranchesHeader onCreateClick={openCreate} />

      <BranchesTable
        branches={branches}
        isLoading={branchesLoading}
        onEdit={openEdit}
        onDelete={handleDeleteBranch}
        onCreateClick={openCreate}
      />

      <BranchModal
        key={`${branchModalOpen}-${editingBranch?.id ?? 'new'}`}
        open={branchModalOpen}
        onClose={closeModal}
        onSubmit={() => refetchBranches()}
        initial={editingBranch}
      />

      <DeleteBranchModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBranch}
        loading={mutateLoading}
        branch={branchToDelete}
      />

      <WarningModal open={warningModalOpen} onClose={closeWarningModal} />
    </div>
  )
})

export default BranchesListPage
