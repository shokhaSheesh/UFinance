'use client'

import RowActions from '@/components/shared/RowActions/RowActions'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

function RowDropdown({ onEdit, onDelete }) {
  const tc = useTranslations('Common')
  return (
    <RowActions
      actions={[
        { key: 'edit', icon: Pencil, label: tc('edit'), onClick: () => onEdit?.() },
        { key: 'delete', icon: Trash2, label: tc('delete'), onClick: () => onDelete?.(), danger: true },
      ]}
    />
  )
}

function BranchRow({ branch, onEdit, onDelete }) {
  const router = useRouter()
  const tb = useTranslations('Settings.branches')

  return (
    <tr key={branch?.guid} className="hover:bg-gray-50 transition-colors">
      <td
        onClick={(event) => {
          event.stopPropagation()
          router.push(`/settings/branches/${branch?.guid}?name=${branch?.name}`)
        }}
        className="px-4 py-1.5 border-b border-gray-200 cursor-pointer text-xs text-[#344054] whitespace-nowrap"
      >
        {branch?.name ?? tb('admin')}
      </td>
      <td className="p-1 py-1.5 text-xs border border-gray-200">
        <RowDropdown onEdit={() => onEdit?.(branch)} onDelete={() => onDelete?.(branch)} />
      </td>
    </tr>
  )
}

export default BranchRow
