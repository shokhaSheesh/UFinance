import { ConfirmDialog } from '@/components/shared/CustomDialog'
import { Trash2 } from 'lucide-react'

const DeleteAccountGroupModal = ({ isOpen, onClose, onConfirm, groupName, isDeleting }) => {
  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isDeleting}
      icon={Trash2}
      title="Удалить группу"
      cancelLabel="Отменить"
      confirmLabel="Удалить"
    >
      <p>
        Вы уверены, что хотите удалить группу <span className="font-semibold text-slate-900">{groupName}</span>?
      </p>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
        Данная группа содержит счета, которые будут перемещены в группу «Нераспределенные».
      </p>
    </ConfirmDialog>
  )
}

export default DeleteAccountGroupModal
