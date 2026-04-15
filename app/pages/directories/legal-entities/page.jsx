"use client"

import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/app/lib/utils'
import { useDeleteLegalEntities, useLegalEntitiesPlanFact } from '@/hooks/useDashboard'
import CreateLegalEntityModal from '@/components/directories/CreateLegalEntityModal/CreateLegalEntityModal'
import LegalEntityMenu from '@/components/directories/LegalEntityMenu/LegalEntityMenu'
import DeleteLegalEntityConfirmModal from '@/components/directories/DeleteLegalEntityConfirmModal/DeleteLegalEntityConfirmModal'
import styles from './legal-entities.module.scss'
import Input from '../../../../components/shared/Input'
import { Search } from 'lucide-react'

export default function LegalEntitiesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingLegalEntity, setEditingLegalEntity] = useState(null)
  const [deletingLegalEntity, setDeletingLegalEntity] = useState(null)

  const deleteMutation = useDeleteLegalEntities()

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
    console.log('Legal entities items:', items)
    return Array.isArray(items) ? items : []
  }, [legalEntitiesData])

  // Transform API data to component format
  const entities = useMemo(() => {
    return legalEntitiesItems.map((item) => ({
      id: item.guid,
      guid: item.guid,
      shortName: item.nazvanie || 'Без названия',
      fullName: item.polnoe_nazvanie || '-',
      inn: item.inn?.toString() || '-',
      kpp: item.kpp?.toString() || '-',
      rawData: item // Store raw data for editing
    }))
  }, [legalEntitiesItems])

  const isRowSelected = (id) => selectedRows.includes(id)

  const toggleRowSelection = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(prev => prev.filter(rid => rid !== id))
    } else {
      setSelectedRows(prev => [...prev, id])
    }
  }

  const allSelected = selectedRows.length === entities.length && entities.length > 0

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([])
    } else {
      setSelectedRows(entities.map(e => e.id))
    }
  }

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
    <div className="w-[calc(100%-80px)] flex h-[calc(100%-60px)]  overflow-auto fixed left-[80px] top-[60px]">
      <div className="w-full h-full">
        {/* Header */}
        <div className="px-5 h-16 flex items-center bg-neutral-50 sticky top-0 z-10">
          <div className={styles.headerInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Мои юрлица</h1>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={styles.createButton}
              >
                Создать
              </button>
            </div>

            {/* Search */}
            <div className={styles.searchContainer}>
              <Input
                leftIcon={<Search size={20} />}
                placeholder="Поиск по краткому названию"
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
                    №
                  </th>
                  <th className={styles.th}>
                    <button className={styles.headerButton}>
                      Краткое название
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </th>
                  <th className={styles.th}>Полное название</th>
                  <th className={styles.th}>ИНН</th>
                  <th className={styles.th}>КПП</th>
                  <th className={cn(styles.th)}></th>
                </tr>
              </thead>

              <tbody className={styles.tbody}>
                {isLoadingLegalEntities ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                      Загрузка...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.td} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                      {searchQuery ? 'Ничего не найдено' : 'Нет данных'}
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
              {isLoadingLegalEntities ? 'Загрузка...' : `${legalEntitiesItems.length} ${legalEntitiesItems.length === 1 ? 'юрлицо' : legalEntitiesItems.length < 5 ? 'юрлица' : 'юрлиц'}`}
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
    </div>
  )
}
