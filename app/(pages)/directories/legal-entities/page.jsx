"use client"

import CreateLegalEntityModal from '@/components/directories/CreateLegalEntityModal/CreateLegalEntityModal'
import DeleteLegalEntityConfirmModal from '@/components/directories/DeleteLegalEntityConfirmModal/DeleteLegalEntityConfirmModal'
import LegalEntityMenu from '@/components/directories/LegalEntityMenu/LegalEntityMenu'
import { useDeleteLegalEntities, useLegalEntitiesPlanFact } from '@/hooks/useDashboard'
import FixedContent from '@/layouts/FixedContent'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Input from '../../../../components/shared/Input'
import { appStore } from '../../../../store/app.store'
import styles from './legal-entities.module.scss'

export default observer(function LegalEntitiesPage() {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingLegalEntity, setEditingLegalEntity] = useState(null)
  const [deletingLegalEntity, setDeletingLegalEntity] = useState(null)

  const deleteMutation = useDeleteLegalEntities()
  const legelEntityPermissions = appStore.permission.directories.legalentities

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch legal entities using new invoke_function API
  const { data: legalEntitiesData, isLoading: isLoadingLegalEntities } = useLegalEntitiesPlanFact({
    page: 1,
    limit: 100,
    ...(debouncedSearchQuery && { search: debouncedSearchQuery.toLowerCase() }),
  })


  // Extract legal entities from response - correct path is data.data.data
  const legalEntitiesItems = useMemo(() => {
    const items = legalEntitiesData?.data?.data || []
    return Array.isArray(items) ? items : []
  }, [legalEntitiesData])

  // Transform API data to component format
  const entities = useMemo(() => {
    return legalEntitiesItems.map((item) => ({
      id: item.guid,
      guid: item.guid,
      shortName: item.nazvanie || tc('noName'),
      fullName: item.polnoe_nazvanie || '-',
      inn: item.inn?.toString() || '-',
      kpp: item.kpp?.toString() || '-',
      rawData: item // Store raw data for editing
    }))
  }, [legalEntitiesItems, tc])

  const filteredData = useMemo(() => {
    // Search is now handled by API, so just return entities
    return entities
  }, [entities])

  const handleEdit = (legalEntity) => {
    setEditingLegalEntity(legalEntity.rawData)
  }

  const handleDelete = (legalEntity) => {
    setDeletingLegalEntity(legalEntity.rawData)
  }

  const handleDeleteConfirm = async () => {
    if (deletingLegalEntity?.guid) {
      try {
        await deleteMutation.mutateAsync([deletingLegalEntity.guid])
        setDeletingLegalEntity(null)
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
        queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
      } catch (error) {
        console.error('Error deleting legal entity:', error)
      }
    }
  }

  // Block body scroll when page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <FixedContent className="overflow-auto">
      <div className="w-full h-full">
        {/* Header */}
        <div className="px-5 h-16 flex items-center bg-neutral-50 sticky top-0 z-10">
          <div className={styles.headerInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{t('pageTitle')}</h1>
              {legelEntityPermissions.add && <button
                onClick={() => setIsCreateModalOpen(true)}
                className={styles.createButton}
              >
                {tc('create')}
              </button>}
            </div>

            {/* Search */}
            <div className={styles.searchContainer}>
              <Input
                leftIcon={<Search size={20} />}
                placeholder={t('searchPlaceholder')}
                className={""}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-5 pt-3 bg-neutral-50">
          <div className={styles.tableOuter}>
            <table className="w-full">
              <thead className="bg-neutral-100 sticky top-16 z-20">
                <tr>
                  <th className={cn(styles.th, styles.thIndex)}>
                    {t('tableHeaders.index')}
                  </th>
                  <th className={styles.th}>
                    <button className={styles.headerButton}>
                      {t('tableHeaders.shortName')}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </th>
                  <th className={styles.th}>{t('tableHeaders.fullName')}</th>
                  <th className={styles.th}>{t('tableHeaders.inn')}</th>
                  <th className={styles.th}>{t('tableHeaders.kpp')}</th>
                  <th className={cn(styles.th)}></th>
                </tr>
              </thead>

              <tbody className={styles.tbody}>
                {isLoadingLegalEntities ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                      {t('loading')}
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                        {searchQuery ? t('noResults') : t('noData')}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((entity, index) => (
                    <tr key={entity.id} className={styles.row}>
                      <td className={cn(styles.td, styles.tdIndex)}>
                        {index + 1}
                      </td>
                      <td className={styles.td}>{entity.shortName}</td>
                      <td className={styles.tdMuted}>{entity.fullName}</td>
                      <td className={styles.tdMuted}>{entity.inn}</td>
                      <td className={styles.tdMuted}>{entity.kpp}</td>
                      <td className={cn(styles.td, styles.tdActions)} onClick={(e) => e.stopPropagation()}>
                        <LegalEntityMenu
                          legalEntity={entity}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerText}>
            <span className={styles.footerCount}>
              {isLoadingLegalEntities ? t('loading') : t('entityCount', { count: legalEntitiesItems.length })}
            </span>
          </div>
        </div>
      </div>

      {/* Create Legal Entity Modal */}
      {isCreateModalOpen && (
        <CreateLegalEntityModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
            queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
          }}
        />
      )}

      {/* Edit Legal Entity Modal */}
      {editingLegalEntity && (
        <CreateLegalEntityModal
          isOpen={!!editingLegalEntity}
          onClose={() => {
            setEditingLegalEntity(null)
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['legalEntitiesPlanFact'] })
            queryClient.invalidateQueries({ queryKey: ['legalEntitiesV2'] })
          }}
          legalEntity={editingLegalEntity}
        />
      )}

      {/* Delete Legal Entity Confirm Modal */}
      {deletingLegalEntity && (
        <DeleteLegalEntityConfirmModal
          isOpen={!!deletingLegalEntity}
          legalEntity={deletingLegalEntity}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingLegalEntity(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </FixedContent>
  )
})
