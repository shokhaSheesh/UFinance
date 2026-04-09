"use client"
import { cn } from '@/app/lib/utils'
import { createPortal } from 'react-dom'
import useMounted from '../../../../hooks/useMounted'
import styles from './SplitAmountCancelModal.module.scss'
export function SplitAmountCancelModal({ isOpen, onConfirm, onCancel }) {
  const mounted = useMounted()

  if (!isOpen || !mounted) return null

  return createPortal(
    <>
      <div 
        className={cn(styles.cancelModalOverlay, ' p-0')}
        onClick={onCancel}
      />
      <div className={styles.cancelModal}>
        <div className={styles.cancelModalHeader}>
          <h3 className={styles.cancelModalTitle}>Подтвердите, что вы хотите отменить разбиение суммы операции. Это приведет к удалению ранее введенных данных.</h3>
          <button 
            className={styles.cancelModalClose}
            onClick={onCancel}
          >
            <svg className={styles.cancelModalCloseIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.cancelModalFooter}>
          <button 
            className={styles.cancelModalButtonCancel}
            onClick={onCancel}
          >
            Вернуться
          </button>
          <button 
            className={styles.cancelModalButtonConfirm}
            onClick={onConfirm}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
