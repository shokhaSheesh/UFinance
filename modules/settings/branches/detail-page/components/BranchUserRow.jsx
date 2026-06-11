'use client'

import { Pencil, Trash2 } from 'lucide-react'

const BranchUserRow = ({ user, onEdit, onDelete }) => {
  return (
    <tr className="bg-gray-200/20 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-[#344054] border-b">{user?.user_name}</td>
      <td className="px-4 py-3 text-sm text-[#344054] border-b">{user?.user_email}</td>
      <td className="px-4 py-3 text-sm text-[#344054] border-b">{user?.user_phone}</td>
      <td className="px-4 py-3 text-sm text-[#344054] border-b">
        {user?.role_name || user?.roles_id}
      </td>
      <td className="px-4 py-3 text-sm border-b">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit?.(user)}
            className="p-1.5 text-gray-500 hover:text-[#0E73F6] cursor-pointer hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete?.(user)}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 cursor-pointer rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default BranchUserRow
