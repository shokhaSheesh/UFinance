"use client"

import { ConfirmDetail, ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'

export function DeleteCounterpartyConfirmModal({ isOpen, counterparty, onConfirm, onCancel, isDeleting = false, errorMessage = '' }) {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить контрагента?"
      cancelLabel="Отмена"
      confirmLabel={isDeleting ? 'Удаление...' : 'Удалить'}
      // Причина отказа от бэка — прямо в окне: пользователь смотрит сюда,
      // а не на всплывающее уведомление
      error={errorMessage}
    >
      {counterparty && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label="Название:">{counterparty.nazvanie || '—'}</ConfirmDetail>
          {counterparty.polnoe_imya && (
            <ConfirmDetail label="Полное название:">{counterparty.polnoe_imya}</ConfirmDetail>
          )}
        </div>
      )}
    </ConfirmDialog>
  )
}
