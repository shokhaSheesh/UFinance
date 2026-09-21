'use client';

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DeleteDealModal({ isOpen, onClose, onConfirm, deal, isDeleting = false }) {
  const t = useTranslations('Deals.deleteDealModal');
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={() => onConfirm()}
      loading={isDeleting}
      icon={Trash2}
      title={t('title')}
      message={t('confirmation')}
      cancelLabel={t('cancel')}
      confirmLabel={t('delete')}
    >
      {deal && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label={t('nameLabel')}>{deal.name || t('noData')}</ConfirmDetail>
          <ConfirmDetail label={t('clientLabel')}>{deal.client || t('noData')}</ConfirmDetail>
          <ConfirmDetail label={t('amountLabel')}>{deal.amount || t('noData')}</ConfirmDetail>
        </div>
      )}
    </ConfirmDialog>
  );
}
