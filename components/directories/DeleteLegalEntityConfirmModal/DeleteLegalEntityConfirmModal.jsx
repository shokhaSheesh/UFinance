"use client"

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import styles from './DeleteLegalEntityConfirmModal.module.scss'

export default function DeleteLegalEntityConfirmModal({ isOpen, legalEntity, onConfirm, onCancel, isDeleting }) {
  const t = useTranslations('Directories.legalEntity')
  const tc = useTranslations('Common')
  if (!isOpen) return null

  return (
    <>
      <div 
        className={cn(styles.overlay, styles.opening)}
        onClick={onCancel}
      />
      <div 
        className={cn(styles.modal, styles.opening)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>{t('deleteConfirmTitle')}</h3>
          <button 
            className={styles.closeButton}
            onClick={onCancel}
            aria-label={tc('close')}
            disabled={isDeleting}
          >
            <svg className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.text}>
            {t('deleteConfirmMessage', { name: legalEntity?.nazvanie || tc('noName') })}
          </p>
          <p className={styles.warning}>
            {t('deleteWarning')}
          </p>
        </div>
        <div className={styles.footer}>
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
            disabled={isDeleting}
          >
            {tc('cancel')}
          </button>
          <button 
            className={styles.deleteButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') : tc('delete')}
          </button>
        </div>
      </div>
    </>
  )
}
