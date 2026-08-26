'use client'

import SelectUsers from '@/components/ReadyComponents/SelectUsers'
import CustomDialog from '@/components/shared/CustomDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { colorOf, initialsOf } from '../utils/avatar'
import {
  useAttachGroupLeader,
  useDetachGroupLeader,
  useGroupLeadersOfGroup,
} from '../hooks/useGroupLeaders'

// Управление ответственными пользователями одной группы контрагентов
export default function GroupLeadersModal({ open, onClose, group, canEdit }) {
  const tg = useTranslations('Settings.groups')
  const tc = useTranslations('Settings.common')

  const [selectedUser, setSelectedUser] = useState(null)
  const groupId = group?.guid

  const { leaders, isLoading } = useGroupLeadersOfGroup(open ? groupId : null)
  const { attach, isAttaching } = useAttachGroupLeader()
  const { detach, isDetaching } = useDetachGroupLeader()

  // уже назначенных не показываем в выпадашке — иначе бэкенд вернёт дубликат
  const attachedUserIds = useMemo(
    () => leaders.map((leader) => leader?.user_id).filter(Boolean),
    [leaders]
  )

  const handleAdd = async () => {
    if (!selectedUser || !groupId) return
    const ok = await attach({ counterparties_group_id: groupId, user_id: selectedUser })
    if (ok) setSelectedUser(null)
  }

  const handleClose = () => {
    setSelectedUser(null)
    onClose?.()
  }

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      contentClass="w-[560px] max-w-[95vw] p-0 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-200">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-ucode-800">{tg('leadersTitle')}</h3>
          <p className="text-sm text-gray-ucode-500 mt-0.5 truncate">
            {group?.nazvanie_gruppy || '—'}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-md text-gray-ucode-400 hover:bg-gray-ucode-100 hover:text-gray-ucode-600 transition-colors cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {canEdit && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-ucode-25">
          <label className="text-xs font-medium text-gray-ucode-600 mb-1.5 block">
            {tg('addUser')}
          </label>
          <div className="flex items-center gap-2">
            <SelectUsers
              value={selectedUser}
              onChange={setSelectedUser}
              exclude={attachedUserIds}
              placeholder={tg('userPlaceholder')}
              className="flex-1 bg-white"
              dropdownClassName="w-[340px]"
            />
            <button
              onClick={handleAdd}
              disabled={!selectedUser || isAttaching}
              className="primary-btn h-9 shrink-0"
            >
              {isAttaching ? <Loader size={14} className="animate-spin" /> : <Plus size={16} />}
              {tc('add')}
            </button>
          </div>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-6 py-4 flex flex-col gap-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : leaders.length ? (
          <ul className="divide-y divide-gray-200">
            {leaders.map((leader) => (
              <li key={leader?.guid} className="flex items-center gap-3 px-6 py-3 group">
                <span
                  className="size-9 shrink-0 rounded-full grid place-items-center text-xs font-semibold text-white"
                  style={{ background: colorOf(leader?.user_id || leader?.guid) }}
                >
                  {initialsOf(leader?.user_name)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-ucode-800 truncate">
                    {leader?.user_name || '—'}
                  </div>
                  <div className="text-xs text-gray-ucode-500 truncate">
                    {leader?.user_email || leader?.user_phone || '—'}
                  </div>
                </div>

                {canEdit && (
                  <button
                    onClick={() => detach(leader?.guid)}
                    disabled={isDetaching}
                    title={tc('delete')}
                    className="p-1.5 rounded-md text-gray-ucode-400 hover:bg-red-50 hover:text-red-ucode transition-colors disabled:opacity-50 cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center text-center px-6 py-10">
            <div className="size-12 rounded-full bg-gray-ucode-50 grid place-items-center mb-3">
              <UserPlus size={22} className="text-gray-ucode-400" />
            </div>
            <p className="text-sm text-gray-ucode-500">{tg('noLeaders')}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-gray-200">
        <button onClick={handleClose} className="outline-btn">
          {tg('close')}
        </button>
      </div>
    </CustomDialog>
  )
}
