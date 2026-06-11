'use client'

import { Loader } from 'lucide-react'
import { useTranslations } from 'next-intl'
import RoleRow from './RoleRow'

export default function RolesTable({ roles, isLoading, canEdit, canDelete, onEdit, onDelete }) {
  const tr = useTranslations('Settings.roles')
  const tc = useTranslations('Settings.common')

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tr('name')}</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">{tr('description')}</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">{tc('noData')}</th>
            <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-36">{tc('createdAt') || 'Дата создания'}</th>
            <th className="w-24 px-3 py-2"></th>
          </tr>
        </thead>
      </table>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full table-fixed">
            <tbody className="divide-y divide-gray-50">
              {roles?.map((role, index) => (
                <RoleRow
                  key={role?.guid || role?.id}
                  role={role}
                  index={index}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}

              {roles?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-sm text-gray-400">
                    {tr('noData') || 'Нет ролей'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
