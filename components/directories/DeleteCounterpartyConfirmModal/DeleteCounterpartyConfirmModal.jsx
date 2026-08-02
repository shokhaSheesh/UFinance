"use client"

import styles from './DeleteCounterpartyConfirmModal.module.scss'

export function DeleteCounterpartyConfirmModal({ isOpen, counterparty, onConfirm, onCancel, isDeleting = false, errorMessage = '' }) {
  if (!isOpen) return null

  return (
    <>
      <div 
        className={styles.deleteModalOverlay}
        onClick={onCancel}
      />
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3 className={styles.deleteModalTitle}>Подтверждение удаления</h3>
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
            Вы уверены, что хотите удалить контрагента?
          </p>
          {counterparty && (
            <div className={styles.deleteModalInfo}>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>Название:</span>
                <span className={styles.deleteModalInfoValue}>{counterparty.nazvanie || '—'}</span>
              </div>
              {counterparty.polnoe_imya && (
                <div className={styles.deleteModalInfoItem}>
                  <span className={styles.deleteModalInfoLabel}>Полное название:</span>
                  <span className={styles.deleteModalInfoValue}>{counterparty.polnoe_imya}</span>
                </div>
              )}
            </div>
          )}
          {/* Причина отказа от бэка — показываем прямо в окне: пользователь
              смотрит сюда, а не на всплывающее уведомление */}
          {errorMessage && (
            <p className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</p>
          )}
        </div>
        <div className={styles.deleteModalFooter}>
          <button 
            className={styles.deleteModalButtonCancel}
            onClick={onCancel}
          >
            Отмена
          </button>
          <button 
            className={styles.deleteModalButtonConfirm}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </>
  )
}
