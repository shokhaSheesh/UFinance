import { useUcodeRequestQuery } from '@/hooks/useDashboard'
import { useEffect, useRef, useState } from 'react'
import useDebounce from './useDebounce'

export function useBranchModal() {
  const [branchModalOpen, setBranchModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)

  function openCreate() {
    setEditingBranch(null)
    setBranchModalOpen(true)
  }

  function openEdit(branch) {
    setEditingBranch({
      branch_id: branch?.guid,
      name: branch?.name,
    })
    setBranchModalOpen(true)
  }

  function closeModal() {
    setBranchModalOpen(false)
    setEditingBranch(null)
  }

  return {
    branchModalOpen,
    editingBranch,
    openCreate,
    openEdit,
    closeModal,
  }
}

export function useEmailUserSearch() {
  const [emailSearch, setEmailSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const debouncedEmail = useDebounce(emailSearch)

  const { data: usersData, isFetching: usersLoading } = useUcodeRequestQuery({
    method: 'get_company_users',
    data: { page: 1, limit: 20, search: debouncedEmail },
    skip: debouncedEmail.length < 2,
  })

  const usersList = usersData?.data?.data?.response ?? []

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return {
    emailSearch,
    setEmailSearch,
    selectedUser,
    setSelectedUser,
    dropdownOpen,
    setDropdownOpen,
    dropdownRef,
    usersList,
    usersLoading,
  }
}

export default useBranchModal
