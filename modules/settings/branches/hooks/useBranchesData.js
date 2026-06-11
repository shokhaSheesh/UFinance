import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { apiClient } from '@/lib/api/ucode/base'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

export function useBranchesData() {
  const [warningModalOpen, setWarningModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState(null)

  const {
    data: branchesData,
    isLoading: branchesLoading,
    refetch: refetchBranches,
  } = useUcodeRequestQuery({
    method: 'get_my_branches',
    data: { page: 1, limit: 50, search: '' },
  })

  const branches = branchesData?.data?.data ?? []

  const { mutateAsync: mutateBranch, isPending: mutateLoading } = useMutation({
    mutationKey: ['delete_branch'],
    mutationFn: (data) => apiClient.invokeFunction(data),
    onError: (error) => {
      const errorMessage = error?.data?.error || error?.message || ''
      if (errorMessage.includes('has operations') || errorMessage.includes('транзакции')) {
        setDeleteModalOpen(false)
        setWarningModalOpen(true)
      } else {
        setDeleteModalOpen(false)
        setBranchToDelete(null)
      }
    },
  })

  function handleDeleteBranch(branch) {
    setBranchToDelete(branch)
    setDeleteModalOpen(true)
  }

  async function confirmDeleteBranch() {
    if (!branchToDelete) return
    try {
      await mutateBranch({ method: 'delete_branch', data: { guid: branchToDelete?.guid } })
      setDeleteModalOpen(false)
      setBranchToDelete(null)
      refetchBranches()
    } catch (error) {
      const errorMessage = error?.details?.data?.error || error?.message || ''
      if (errorMessage.includes('has operations') || errorMessage.includes('транзакции')) {
        setDeleteModalOpen(false)
        setWarningModalOpen(true)
      } else {
        setDeleteModalOpen(false)
        setBranchToDelete(null)
      }
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false)
    setBranchToDelete(null)
  }

  function closeWarningModal() {
    setWarningModalOpen(false)
    setBranchToDelete(null)
  }

  return {
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
  }
}

export default useBranchesData
