"use client"

import { useTranslations } from 'next-intl'
import Loader from '../../shared/Loader'
import styles from './OperationsTable.module.scss'

export function DeleteConfirmModal({ isOpen, operation, onConfirm, onCancel, isDeleting = false }) {
  const t = useTranslations('Operations')
  if (!isOpen) return null

  return (
    <>
      <div
        className={styles.deleteModalOverlay}
        onClick={onCancel}
      />
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3 className={styles.deleteModalTitle}>{t('deleteModal.title')}</h3>
          <button
            className={styles.deleteModalClose}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>
        <div className={styles.deleteModalBody}>
          <p className={styles.deleteModalText}>
            {t('deleteModal.confirmation')}
          </p>
          {operation && (
            <div className={styles.deleteModalInfo}>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('deleteModal.description')}</span>
                <span className={styles.deleteModalInfoValue}>{operation.opisanie || '—'}</span>
              </div>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('deleteModal.amount')}</span>
                <span className={styles.deleteModalInfoValue}>{operation.summa || '—'}</span>
              </div>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('deleteModal.date')}</span>
                <span className={styles.deleteModalInfoValue}>{operation.operationDate || '—'}</span>
              </div>
            </div>
          )}
        </div>
        <div className={styles.deleteModalFooter}>
          <button
            className={styles.deleteModalButtonCancel}
            onClick={onCancel}
          >
            {t('deleteModal.cancel')}
          </button>
          <button
            className={styles.deleteModalButtonConfirm}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader /> : t('deleteModal.delete')}
          </button>
        </div>
      </div>
    </>
  )
}
