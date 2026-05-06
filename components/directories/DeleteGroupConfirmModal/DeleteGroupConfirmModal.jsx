"use client"

import { useTranslations } from 'next-intl'
import styles from './DeleteGroupConfirmModal.module.scss'

export function DeleteGroupConfirmModal({ isOpen, group, onConfirm, onCancel, isDeleting = false }) {
  const t = useTranslations('Directories.counterparty')
  const tc = useTranslations('Common')
  if (!isOpen) return null

  return (
    <>
      <div 
        className={styles.deleteModalOverlay}
        onClick={onCancel}
        style={{ zIndex: 1100 }}
      />
      <div className={styles.deleteModal} style={{ zIndex: 1101 }}>
        <div className={styles.deleteModalHeader}>
          <h3 className={styles.deleteModalTitle}>{t('deleteConfirmTitle')}</h3>
          <button 
            className={styles.deleteModalClose}
            onClick={onCancel}
          >
            <svg className={styles.deleteModalCloseIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.deleteModalBody}>
          <p className={styles.deleteModalText}>
            {t('deleteConfirmMessage')}
          </p>
          {group && (
            <div className={styles.deleteModalInfo}>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('groupNameLabel')}</span>
                <span className={styles.deleteModalInfoValue}>{group.nazvanie_gruppy || '—'}</span>
              </div>
              {group.opisanie_gruppy && (
                <div className={styles.deleteModalInfoItem}>
                  <span className={styles.deleteModalInfoLabel}>{t('groupDescriptionLabel')}</span>
                  <span className={styles.deleteModalInfoValue}>{group.opisanie_gruppy}</span>
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
            className={styles.deleteModalButtonConfirm}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? tc('deleting') : tc('delete')}
          </button>
        </div>
      </div>
    </>
  )
}
