'use client'

import CustomDialog, { ConfirmDetail, ConfirmDialog, DialogBody, DialogFooter, DialogHeader } from '@/components/shared/CustomDialog'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

function DeleteBranchModal({ open, onClose, onConfirm, branch, loading }) {
  const tb = useTranslations('Settings.branches')
  const tc = useTranslations('Settings.common')
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      icon={Trash2}
      title={tb('delete.title')}
      message={tb('delete.confirm')}
      cancelLabel={tc('cancel')}
      confirmLabel={tc('delete')}
    >
      {branch && (
        <div className="flex flex-col gap-1.5">
          <ConfirmDetail label={tb('delete.name')}>{branch?.branch_user?.branch_id_data?.name || '—'}</ConfirmDetail>
          <ConfirmDetail label={tb('delete.email')}>{branch?.email || '—'}</ConfirmDetail>
          <ConfirmDetail label={tb('delete.user')}>{branch?.name || '—'}</ConfirmDetail>
        </div>
      )}
    </ConfirmDialog>
  )
}

export function WarningModal({ open, onClose }) {
  const tb = useTranslations('Settings.branches')
  return (
    <CustomDialog open={open} onClose={onClose} contentClass="w-[480px]">
      <DialogHeader icon={AlertTriangle} tone="neutral" title={tb('warning.title')} onClose={onClose} />
      <DialogBody className="text-sm text-slate-700">
        <p>{tb('warning.message')}</p>
      </DialogBody>
      <DialogFooter>
        <button type="button" onClick={onClose} className="primary-btn">
          {tb('warning.understood')}
        </button>
      </DialogFooter>
    </CustomDialog>
  )
}

export default DeleteBranchModal
