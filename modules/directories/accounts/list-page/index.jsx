"use client"

import CreateAccountGroupModal from '@/components/directories/CreateAccountGroupModal/CreateAccountGroupModal'
import CreateLegalEntityModal from '@/components/directories/CreateLegalEntityModal/CreateLegalEntityModal'
import CreateMyAccountModal from '@/components/directories/CreateMyAccountModal/CreateMyAccountModal'
import { DeleteAccountConfirmModal } from '@/components/directories/DeleteAccountConfirmModal/DeleteAccountConfirmModal'
import DeleteAccountGroupModal from '@/components/directories/DeleteAccountGroupModal/DeleteAccountGroupModal'
import { FilterSection, FilterSidebar } from '@/components/directories/FilterSidebar/FilterSidebar'
import GroupMyAccounts from '@/components/ReadyComponents/GroupMyAccouts'
import SelectLegelEntitties from '@/components/ReadyComponents/SelectLegelEntitties'
import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import Input from '@/components/shared/Input'
import ScreenLoader from '@/components/shared/ScreenLoader'
import SingleSelect from '@/components/shared/Selects/SingleSelect'
import { GlobalCurrency } from '@/constants/globalCurrency'
import { useDeleteMyAccounts, useUcodeRequestMutation, useUcodeRequestQuery } from '@/hooks/useDashboard'
import useMounted from '@/hooks/useMounted'
import FixedContent from '@/layouts/FixedContent'
import { cn } from '@/lib/utils'
import { accountsStore } from '@/store/accounts.store'
import { appStore } from '@/store/app.store'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AccountsTable } from '../components/AccountsTable/AccountsTable'
import { useAccountsFilter } from '../hooks/useAccountsFilter'
import { useAccountsModals } from '../hooks/useAccountsModals'
import styles from './accounts.module.scss'

export default observer(function AccountsPageList() {
  const t = useTranslations('Directories.account')
  const tc = useTranslations('Common')
  const mounted = useMounted()
  const accountPermissions = appStore.permission.directories.accounts
  const queryClient = useQueryClient()

  // Store state
  const {
    searchQuery, setSearchQuery,
    toggleType,
    selectedEntity, setSelectedEntity,
    selectedAccounts, setSelectedAccounts,
    selectedGrouping, setSelectedGrouping,
    isFilterOpen, setIsFilterOpen
  } = accountsStore

  // Custom hooks for modals and filters
  const modals = useAccountsModals()
  const { requestBankAccounts } = useAccountsFilter(accountsStore)

  // Menu state (single source of truth from the hook)
  const menuRef = useRef(null)
  const { isMenuOpen, setIsMenuOpen } = modals

  // Close the menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen, setIsMenuOpen])

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Delete mutations
  const deleteMutation = useDeleteMyAccounts()
  const { mutateAsync: deleteGroupMutate, isPending: isPendingDeleteGroup } = useUcodeRequestMutation({
    mutationSetting: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
        queryClient.invalidateQueries({ queryKey: ['bankAccountsPlanFact'] })
        modals.closeDeleteGroupModal()
      }
    }
  })

  // Fetch bank accounts
  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } = useUcodeRequestQuery({
    method: "get_my_accounts",
    data: requestBankAccounts,
    querySetting: {
      select: (response) => response?.data,
    }
  })

  const summary = useMemo(() => {
    return bankAccountsData?.summary
  }, [bankAccountsData])

  // Get dataArray for table rendering
  const dataArray = useMemo(() => {
    const rawData = bankAccountsData?.data
    if (Array.isArray(rawData)) return rawData
    if (Array.isArray(rawData?.data)) return rawData.data
    return []
  }, [bankAccountsData])

  // Group toggle handlers
  const toggleGroup = (id) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isAllExpanded = useMemo(() => {
    const groupCount = dataArray.length || 0
    return groupCount > 0 && expandedGroups.size === groupCount
  }, [expandedGroups, dataArray])

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedGroups(new Set())
    } else {
      const allGroupIds = dataArray.map(g => g.guid) || []
      setExpandedGroups(new Set(allGroupIds))
    }
  }

  // Delete handlers
  const handleDeleteGroup = async () => {
    try {
      await deleteGroupMutate({
        method: "delete_account_group",
        data: {
          guid: modals.deletingGroup.guid
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!modals.deletingAccount) return

    try {
      await deleteMutation.mutateAsync([modals.deletingAccount.guid])
      modals.closeDeleteAccountModal()
      queryClient.invalidateQueries({ queryKey: ['get_my_accounts'] })
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  // Menu handlers
  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleCreateSingle = () => {
    modals.openCreateAccountModal()
    setIsMenuOpen(false)
  }

  const handleCreateGroup = () => {
    modals.openCreateGroupModal()
    setIsMenuOpen(false)
  }

  const clearCount =
    (!accountsStore.isCash || !accountsStore.isNonCash || !accountsStore.isCard || !accountsStore.isElectronic ? 1 : 0) +
    selectedEntity.length +
    selectedAccounts.length

  const handleClearFilters = () => {
    accountsStore.resetFilters()
  }

  // Prevent hydration mismatch
  if (!mounted) return null

  return (
    <FixedContent>
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(!isFilterOpen)}
        clearCount={clearCount}
        onClear={handleClearFilters}
      >
        <FilterSection title={t('types.type')}>
          <div className="space-y-2.5 flex flex-col items-start">
            <OperationCheckbox
              checked={accountsStore.isCash}
              onChange={() => toggleType('Наличный')}
              label={t('types.cash')}
            />
            <OperationCheckbox
              checked={accountsStore.isNonCash}
              onChange={() => toggleType('Безналичный')}
              label={t('types.nonCash')}
            />
            <OperationCheckbox
              checked={accountsStore.isCard}
              onChange={() => toggleType('Карта физлица')}
              label={t('types.card')}
            />
            <OperationCheckbox
              checked={accountsStore.isElectronic}
              onChange={() => toggleType('Электронный')}
              label={t('types.electronic')}
            />
          </div>
        </FilterSection>

        <FilterSection title={tc('parameters')}>
          <div className="space-y-3">
            <GroupMyAccounts
              value={selectedAccounts}
              onChange={setSelectedAccounts}
              placeholder={t('selectAccounts')}
              multi={true}
            />

            <SelectLegelEntitties
              value={selectedEntity}
              onChange={setSelectedEntity}
              placeholder={t('selectLegalEntity')}
              multi={true}
            />
          </div>
        </FilterSection>
      </FilterSidebar>

      <div className={cn(`pb-40 w-full h-dvh overflow-y-auto flex-1 bg-white`)}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{t('pageTitle')}</h1>
              <div ref={menuRef} className="flex items-center gap-2 relative">
                {accountPermissions.add && (
                  <button onClick={handleMenuClick} className={cn('primary-btn', "flex items-center gap-2")}>
                    {tc('create')}
                    {isMenuOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                )}
                {isMenuOpen && (
                  <div className="absolute top-full w-40 p-2 flex flex-col justify-start items-start left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <button
                      className="text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer rounded-sm"
                      onClick={handleCreateSingle}
                    >
                      {tc('create')}
                    </button>
                    <button
                      className="text-neutral-700 font-normal hover:bg-neutral-100 w-full text-start text-sm p-1 cursor-pointer rounded-sm"
                      onClick={handleCreateGroup}
                    >
                      {t('createGroup')}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.headerActionsRight}>
                <SingleSelect
                  data={[
                    { value: 'none', label: t('grouping.none') },
                    { value: 'groups', label: t('grouping.groups') },
                    { value: 'legal_entities', label: t('grouping.legalEntities') },
                  ]}
                  value={selectedGrouping}
                  withSearch={false}
                  isClearable={false}
                  className={'bg-white w-44'}
                  onChange={setSelectedGrouping}
                />
                <Input
                  leftIcon={<Search size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="bg-white w-56"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 relative bg-white pb-20">
          <div className="z-50">
            <AccountsTable
              dataArray={dataArray}
              selectedGrouping={selectedGrouping}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onAccountEdit={modals.openEditAccountModal}
              onAccountDelete={modals.openDeleteAccountModal}
              onGroupEdit={(group) => {
                if (selectedGrouping === 'legal_entities') {
                  modals.openEditLegalEntityModal(group)
                } else {
                  modals.openEditGroupModal(group)
                }
              }}
              onGroupDelete={modals.openDeleteGroupModal}
              onExpandAll={toggleExpandAll}
              isAllExpanded={isAllExpanded}
              t={t}
              tc={tc}
            />
          </div>
        </div>

        {/* Footer - Always visible at bottom */}
        <div className={cn("absolute flex gap-2 items-center bottom-0 z-10 bg-neutral-100 p-2 w-full")}>
          <div className={styles.footerText}>
            <span className={styles.footerTextBold}>
              {t('accountCount', { count: summary?.accounts_count || 0 })}
            </span>
          </div>
          <div className={styles.footerTextMuted}>
            {isLoadingBankAccounts ? (
              <span>{t('loading')}</span>
            ) : (
              <div className='flex items-center gap-1 text-xs'>
                <p>{t('currentBalance')}:</p>
                <span className={styles.footerTextBold}>
                  {summary?.current_balance_val.toLocaleString('ru-RU')}
                </span>
                  <span>{GlobalCurrency?.name}</span>
              </div>
            )}
          </div>
        </div>
        {isLoadingBankAccounts && <ScreenLoader />}
      </div>

      {/* Create Account Modal */}
      {modals.isCreateModalOpen && (
        <CreateMyAccountModal
          isOpen={modals.isCreateModalOpen}
          onClose={modals.closeCreateAccountModal}
        />
      )}

      {/* Create Account Group Modal */}
      {modals.isCreateGroupModalOpen && (
        <CreateAccountGroupModal
          isOpen={modals.isCreateGroupModalOpen}
          editingGroup={modals.editingGroup}
          editId={modals.editingGroup?.id}
          onClose={modals.closeCreateGroupModal}
        />
      )}

      {/* Edit Account Modal */}
      {modals.editingAccount && (
        <CreateMyAccountModal
          isOpen={!!modals.editingAccount}
          onClose={modals.closeEditAccountModal}
          account={modals.editingAccount}
        />
      )}

      {/* Delete Account Confirm Modal */}
      {modals.deletingAccount && (
        <DeleteAccountConfirmModal
          isOpen={!!modals.deletingAccount}
          account={modals.deletingAccount}
          onConfirm={handleDeleteConfirm}
          onCancel={modals.closeDeleteAccountModal}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Delete Group Modal */}
      {modals.deletingGroup && (
        <DeleteAccountGroupModal
          isOpen={!!modals.deletingGroup}
          onClose={modals.closeDeleteGroupModal}
          onConfirm={handleDeleteGroup}
          groupName={modals.deletingGroup.name}
          isDeleting={isPendingDeleteGroup}
        />
      )}

      {/* Edit Legal Entity Modal */}
      {modals.editingLegalEntity && (
        <CreateLegalEntityModal
          isOpen={!!modals.editingLegalEntity}
          onClose={modals.closeEditLegalEntityModal}
          legalEntity={modals.editingLegalEntity}
          legalEntityId={modals.editingLegalEntity.legal_entity_id}
        />
      )}
    </FixedContent>
  )
})
