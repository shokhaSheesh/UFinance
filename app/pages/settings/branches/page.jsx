'use client'

import CustomModal from '@/components/shared/CustomModal'
import Input from '@/components/shared/Input'
import { Skeleton } from '@/components/ui/skeleton'
import { useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import { useMutation } from '@tanstack/react-query'
import { Loader, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Controller, useForm } from 'react-hook-form'
import { apiClient } from '../../../../lib/api/ucode/base'
import { queryClient } from '../../../../lib/queryClient'
import { authStore } from '../../../../store/auth.store'

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatPhone998(raw) {
  let digits = raw.replace(/\D/g, '')
  if (!digits.startsWith('998')) digits = '998' + digits.replace(/^998/, '')
  digits = digits.slice(0, 12)
  let result = '+998'
  const rest = digits.slice(3)
  if (rest.length > 0) result += ' ' + rest.slice(0, 2)
  if (rest.length > 2) result += ' ' + rest.slice(2, 5)
  if (rest.length > 5) result += ' ' + rest.slice(5, 7)
  if (rest.length > 7) result += ' ' + rest.slice(7, 9)
  return result
}

/* ═══════════════════════════════════════════════════════ */
/*  BranchModal                                           */
/* ═══════════════════════════════════════════════════════ */

function BranchModal({ open, onClose, onSubmit, initial }) {
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initial?.branchName || initial?.name || '',
      username: '',
      email: '',
      phone: '+998',
    },
  })
  const { mutateAsync: createBranchUser, isPending: isCreating } = useUcodeRequestMutation({
    mutationSetting: {
      onSuccess: (response) => {
        if (initial && initial?.branch_id === authStore.selectBranch?.guid) {
          authStore.setSelectBranch(response?.data?.data?.branch)
        }
      },
    },
  })

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



  async function onFormSubmit(data) {
    if (!initial) {
      await createBranchUser({
        method: 'create_branch',
        data: {
          branch_name: data.name,
          branch_user_id: selectedUser ? selectedUser.guid : null,
          branch_user_email: data.email,
          branch_user_name: data.username,
          branch_user_phone: String(data.phone).replace(/\s/g, ''),
        },
      })
    } else {
      await createBranchUser({
        method: 'update_branch',
        data: {
          guid: initial.branch_id,
          branch_name: data.name,
        },
      })

    }
    queryClient.invalidateQueries({ queryKey: ['get_my_branches'] })
    onSubmit(data)
    onClose()
  }

  return (
    <CustomModal isOpen={open} onClose={onClose} className="w-[480px] max-w-[95vw] p-7">
      <h2 className="text-lg font-bold text-slate-900 mb-6">
        {initial ? tb('edit') : tb('create')}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
        {/* Branch name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-500">{tb('name')}</label>
          <Input
            placeholder={tb('namePlaceholder')}
            error={!!errors.name}
            {...register('name', { required: tb('errors.nameRequired') })}
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        {!initial?.name && <>
          {/* Email with user search */}
          <div className="flex flex-col gap-1.5" ref={dropdownRef}>
            <label className="text-sm font-medium text-slate-500">{tb('email')}</label>
            <div className="relative">
              {(() => {
                const { ref, name } = register('email', {
                  required: tb('errors.emailRequired'),
                  pattern: { value: EMAIL_RE, message: tb('errors.emailInvalid') },
                })
                return (
                  <Input
                    ref={ref}
                    name={name}
                    type="email"
                    placeholder={tb('emailPlaceholder')}
                    error={!!errors.email}
                    value={emailSearch}
                    readOnly={!!initial?.email}
                    onChange={e => {
                      setEmailSearch(e.target.value)
                      setValue('email', e.target.value)
                      setSelectedUser(null)
                      setDropdownOpen(true)
                    }}
                    onFocus={() => emailSearch.length >= 2 && setDropdownOpen(true)}
                  />
                )
              })()}
              {usersLoading && emailSearch.length >= 2 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader size={14} className="animate-spin text-slate-400" />
                </span>
              )}
              {dropdownOpen && usersList.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
                  {usersList.map(user => (
                    <li
                      key={user.guid}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setSelectedUser(user)
                        setEmailSearch(user.email || '')
                        setValue('email', user.email || '', { shouldValidate: true })
                        setValue('username', user.name || user.username || '')
                        setValue('phone', user.phone ? formatPhone998(user.phone) : '+998')
                        setDropdownOpen(false)
                      }}
                      className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex flex-col"
                    >
                      <span className="font-medium">{user.name || user.username || '—'}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-500">{tb('username')}</label>
            <Input
              placeholder={tb('usernamePlaceholder')}
              error={!!errors.username}
              {...register('username', { required: tb('errors.usernameRequired') })}
            />
            {errors.username && <span className="text-xs text-red-500">{errors.username.message}</span>}
          </div>


          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-500">{tb('phone')}</label>
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: v =>
                  v.replace(/\D/g, '').length >= 12 || tb('errors.phoneInvalid'),
              }}
              render={({ field }) => (
                <Input
                  type="tel"
                  placeholder={tb('phonePlaceholder')}
                  error={!!errors.phone}
                  value={field.value}
                  onChange={e => field.onChange(formatPhone998(e.target.value))}
                />
              )}
            />
            {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
          </div>
        </>}

        {/* Footer */}
        <div className="flex justify-end gap-2.5 mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="px-5 py-2 bg-white text-slate-500 border border-gray-300 rounded-lg text-sm font-medium hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {isCreating && <Loader size={14} className="animate-spin" />}
            {isCreating ? tc('saving') : initial ? tc('save') : tc('create')}
          </button>
        </div>
      </form>
    </CustomModal>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  DeleteBranchModal                                     */
/* ═══════════════════════════════════════════════════════ */

function DeleteBranchModal({ open, onClose, onConfirm, branch, loading }) {
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')
  return (
    <CustomModal isOpen={open} onClose={onClose} className="w-[480px] max-w-[95vw] p-0 overflow-hidden">
      <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-gray-200 pr-14">
        <h3 className="text-lg font-bold text-slate-900">{tb('delete.title')}</h3>
      </div>

      <div className="px-7 py-6">
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {tb('delete.confirm')}
        </p>
        {branch && (
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2.5">
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 font-medium min-w-[120px]">{tb('delete.name')}</span>
              <span className="text-slate-900 font-medium">
                {branch.branch_user?.branch_id_data?.name || '—'}
              </span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 font-medium min-w-[120px]">{tb('delete.email')}</span>
              <span className="text-slate-900 font-medium">{branch.email || '—'}</span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 font-medium min-w-[120px]">{tb('delete.user')}</span>
              <span className="text-slate-900 font-medium">{branch.name || '—'}</span>
            </div>
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
/*  WarningModal                                          */
/* ═══════════════════════════════════════════════════════ */

function WarningModal({ open, onClose }) {
  const tb = useTranslations('Settings.branches')
  return (
    <CustomModal isOpen={open} onClose={onClose} className="w-[480px] max-w-[95vw] p-0 overflow-hidden">
      <div className="flex justify-between items-center px-7 pt-6 pb-4 border-b border-gray-200 pr-14">
        <h3 className="text-lg font-bold text-slate-900">{tb('warning.title')}</h3>
      </div>

      <div className="px-7 py-6">
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          {tb('warning.message')}
        </p>
      </div>

      <div className="flex justify-end gap-2.5 px-7 pb-6">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-[#0E73F6] text-white rounded-lg text-sm font-semibold hover:bg-[#0b5fd4] transition-colors cursor-pointer"
        >
          {tb('warning.understood')}
        </button>
      </div>
    </CustomModal>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  RowDropdown                                           */
/* ═══════════════════════════════════════════════════════ */

function RowDropdown({ onEdit, onDelete }) {
  const tc = useTranslations('Settings.common')
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handler(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.right - 200 })
    }
    setOpen(prev => !prev)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="bg-transparent border-none cursor-pointer p-1 rounded-md text-slate-400 flex items-center hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={18} />
      </button>
      {open && createPortal(
        <ul
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-[9999] list-none m-0 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px]"
        >
          <li
            onClick={() => { onEdit(); setOpen(false) }}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Pencil size={15} />
            <span>{tc('edit')}</span>
          </li>
          <li
            onClick={() => { onDelete(); setOpen(false) }}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
            <span>{tc('delete')}</span>
          </li>
        </ul>,
        document.body
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════ */
/*  BranchesPage                                          */
/* ═══════════════════════════════════════════════════════ */

export default observer(function BranchesPage() {
  const router = useRouter()
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')
  const { data: branchesData, isLoading: branchesLoading, refetch: refetchBranches } =
    useUcodeRequestQuery({
      method: 'get_my_branches',
      data: { page: 1, limit: 50, search: '' },
    })
  const branches = branchesData?.data?.data ?? []

  const [branchModalOpen, setBranchModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState(null)
  const [warningModalOpen, setWarningModalOpen] = useState(false)

  const { mutateAsync: mutateBranch, isPending: mutateLoading } = useMutation({
    mutationKey: ["delete_branch"],
    mutationFn: (data) => apiClient.invokeFunction(data),
    onError: (error) => {
      const errorMessage = error?.data?.error || error?.message || ''
      if (errorMessage.includes('has operations') || errorMessage.includes('транзакции')) {
        setDeleteModalOpen(false)
        setWarningModalOpen(true)
      } else {
        console.log('error', error)
        setDeleteModalOpen(false)
        setBranchToDelete(null)
      }
    }
  })

  function handleDeleteBranch(branch) {
    setBranchToDelete(branch)
    setDeleteModalOpen(true)
  }



  async function confirmDeleteBranch() {
    if (branchToDelete) {
      try {
        await mutateBranch({ method: 'delete_branch', data: { guid: branchToDelete.guid } })
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
  }

  return (
    <div className="flex-1 overflow-y-auto  bg-white">
      {/* Header */}
      <div className="flex p-5 h-16 sticky top-0 bg-white  z-20 items-center gap-4 mb-6">
        <h1 className="text-xl font-bold text-slate-900">{tb('pageTitle')}</h1>
        <button
          onClick={() => { setEditingBranch(null); setBranchModalOpen(true) }}
          className="px-5 py-2 primary-btn"
        >
          {tb('add')}
        </button>
      </div>

      {/* Table */}
      {branchesLoading ? (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                  {tb('table.name')}
                </th>
                <th className="px-4 w-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-4 py-3 text-xs">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Skeleton className="h-4 w-4" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : branches.length > 0 && !branchesLoading ? (
          <div className="flex-1  bg-white">
          <table className="w-full border-collapse">
              <thead className="sticky top-16 bg-gray-50 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                    {tb('table.name')}
                  </th>
                  <th className="px-4 w-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                    &nbsp;
                  </th>
              </tr>
            </thead>
            <tbody>
                {branches?.map(branch => (
                  <tr key={branch?.guid} className="hover:bg-gray-50 transition-colors">
                    <td onClick={(event) => {
                      event.stopPropagation()
                      router.push(`/pages/settings/branches/${branch?.guid}?name=${branch?.name}`)
                    }} className="px-4 py-1.5 border-b border-gray-200 cursor-pointer text-xs text-[#344054] whitespace-nowrap">
                      {branch?.name ?? tb('admin')}
                  </td>
                    <td className="p-1 py-1.5 text-xs border border-gray-200">
                    <RowDropdown
                      onEdit={() => {
                        setEditingBranch({
                          branch_id: branch?.guid,
                          name: branch?.name,
                        })
                        setBranchModalOpen(true)
                      }}
                      onDelete={() => handleDeleteBranch(branch)}
                    />
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      ) : (
            <div className="flex flex-col items-center text-center py-10 px-5">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-4">{tb('empty.title')}</h2>
              <p className="text-base text-[#666] leading-relaxed max-w-xl mb-4">
                {tb('empty.description')}
          </p>
              <p className="text-sm text-[#999] leading-relaxed max-w-xl mb-8">
                {tb('empty.help')}<br />
                {''}
                <a href="#" className="text-[#00b8d4] no-underline hover:underline">{tb('empty.video')}</a>
                {' '}{tb('common.or') || 'или'}{' '}
                <a href="#" className="text-[#00b8d4] no-underline hover:underline">{tb('empty.article')}</a>.
          </p>
              <button
            onClick={() => { setEditingBranch(null); setBranchModalOpen(true) }}
                aria-label={tb('create')}
                className="bg-transparent border-none text-[#d0d0d0] cursor-pointer p-0 hover:text-[#00b8d4] transition-colors"
          >
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55" cy="55" r="53" stroke="currentColor" strokeWidth="4" />
                  <rect x="53" y="31" width="4" height="48" fill="currentColor" />
                  <rect x="79" y="53" width="4" height="48" transform="rotate(90 79 53)" fill="currentColor" />
            </svg>
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      <BranchModal
        key={`${branchModalOpen}-${editingBranch?.id ?? 'new'}`}
        open={branchModalOpen}
        onClose={() => { setBranchModalOpen(false); setEditingBranch(null) }}
        onSubmit={() => refetchBranches()}
        initial={editingBranch}
      />

      {/* Delete modal */}
      <DeleteBranchModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setBranchToDelete(null) }}
        onConfirm={confirmDeleteBranch}
        loading={mutateLoading}
        branch={branchToDelete}
      />

      {/* Warning modal for branches with operations */}
      <WarningModal
        open={warningModalOpen}
        onClose={() => { setWarningModalOpen(false); setBranchToDelete(null) }}
      />

    </div>
  )
})
