"use client"

import { useTranslations } from 'next-intl'
import Loader from "../../shared/Loader"
import styles from './DeleteCategoryConfirmModal.module.scss'

export function DeleteCategoryConfirmModal({ isOpen, category, onConfirm, onCancel, isDeleting = false }) {
  const tc = useTranslations('Common')
  const t = useTranslations('Directories.chartOfAccounts')
  if (!isOpen) return null

  return (
    <>
      <div 
        className={styles.deleteModalOverlay}
        onClick={onCancel}
      />
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3 className="text-lg font-semibold m-0">{tc('deleteConfirmTitle')}</h3>
          <button 
            className={styles.deleteModalClose}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className={styles.deleteModalBody}>
          <p className="text-sm text-gray-500 m-0 mb-4">
            {t('deleteConfirmMessage', { name: category?.name || '—' })}
          </p>
          {category && (
            <div className={styles.deleteModalInfo}>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>Название:</span>
                <span className={styles.deleteModalInfoValue}>{category.name || '—'}</span>
              </div>
              {category.tip && category.tip.length > 0 && (
                <div className={styles.deleteModalInfoItem}>
                  <span className={styles.deleteModalInfoLabel}>Тип:</span>
                  <span className={styles.deleteModalInfoValue}>{category.tip.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.deleteModalFooter}>
          <button 
            className={styles.deleteModalButtonCancel}
            onClick={onCancel}
          >
            {tc('cancel')}
          </button>
          <button
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border-none rounded-md cursor-pointer hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-sans"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader /> : tc('delete')}
          </button>
        </div>
      </div>
    </>
  )
}
