'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatRoleDate } from '../utils/formatDate'

export default function RoleRow({ role, index, canEdit, canDelete, onEdit, onDelete }) {
  const router = useRouter()

  const handleRowClick = () => {
    router.push(`/settings/role/${role?.guid}?role_name=${role?.name}`)
  }

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-gray-50 transition-colors cursor-pointer group"
    >
      <td className="px-3 py-2 text-sm text-gray-400 w-12">{index + 1}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-gray-900">{role?.name}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-gray-500 truncate">{role?.description || '—'}</td>
      <td className="px-3 py-2 w-36">
        <span className="text-sm text-gray-700">{role?.users_count || 0}</span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-500 w-36">{formatRoleDate(role?.created_at)}</td>
      <td className="px-3 py-2 w-24">
        {(canEdit || canDelete) && (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <button
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                onClick={() => onEdit?.(role)}
              >
                <Pencil size={14} />
              </button>
            )}
            {canDelete && (
              <button
                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                onClick={() => onDelete?.(role)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
