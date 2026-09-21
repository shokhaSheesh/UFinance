'use client'

import { ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'

const DeleteUserModal = ({ user, onClose, onConfirm, isPending, tb, tc }) => {
  return (
    <ConfirmDialog
      open={!!user}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isPending}
      icon={Trash2}
      title={tb?.('deleteStaffTitle') || 'Подтверждение удаления'}
      message={`${tb?.('deleteStaffConfirm') || 'Вы уверены, что хотите удалить сотрудника'} "${user?.name ?? ''}"?`}
      cancelLabel={tc?.('cancel')}
      confirmLabel={isPending ? tc?.('deleting') || 'Удаление...' : tc?.('delete')}
    />
  )
}

export default DeleteUserModal
