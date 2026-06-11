'use client'

import CustomDialog from '@/components/shared/CustomDialog'

const DeleteUserModal = ({ user, onClose, onConfirm, isPending, tb, tc }) => {
  return (
    <CustomDialog open={!!user} onClose={onClose}>
      <div className="p-6 w-[350px]">
        <h2 className="text-lg font-semibold mb-2">
          {tb?.('deleteStaffTitle') || 'Подтверждение удаления'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {tb?.('deleteStaffConfirm') || 'Вы уверены, что хотите удалить сотрудника'} &quot;
          {user?.name}&quot;?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {tc?.('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isPending ? tc?.('deleting') || 'Удаление...' : tc?.('delete')}
          </button>
        </div>
      </div>
    </CustomDialog>
  )
}

export default DeleteUserModal
