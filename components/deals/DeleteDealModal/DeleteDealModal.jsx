'use client';

import { useTranslations } from 'next-intl';
import Loader from '../../shared/Loader';
import styles from './DeleteDealModal.module.scss';

export function DeleteDealModal({ isOpen, onClose, onConfirm, deal, isDeleting = false }) {
  const t = useTranslations('Deals.deleteDealModal');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <>
      <div
        className={styles.deleteModalOverlay}
        onClick={onClose}
      />
      <div className={styles.deleteModal}>
        <div className={styles.deleteModalHeader}>
          <h3 className={styles.deleteModalTitle}>{t('title')}</h3>
          <button
            className={styles.deleteModalClose}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className={styles.deleteModalBody}>
          <p className={styles.deleteModalText}>
            {t('confirmation')}
          </p>
          {deal && (
            <div className={styles.deleteModalInfo}>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('nameLabel')}</span>
                <span className={styles.deleteModalInfoValue}>{deal.name || t('noData')}</span>
              </div>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('clientLabel')}</span>
                <span className={styles.deleteModalInfoValue}>{deal.client || t('noData')}</span>
              </div>
              <div className={styles.deleteModalInfoItem}>
                <span className={styles.deleteModalInfoLabel}>{t('amountLabel')}</span>
                <span className={styles.deleteModalInfoValue}>{deal.amount || t('noData')}</span>
              </div>
            </div>
          )}
        </div>
        <div className={styles.deleteModalFooter}>
          <button
            className={styles.deleteModalButtonCancel}
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button
            className={styles.deleteModalButtonConfirm}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader /> : t('delete')}
          </button>
        </div>
      </div>
    </>
  );
}
