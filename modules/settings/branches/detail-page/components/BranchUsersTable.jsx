'use client'

import { Loader } from 'lucide-react'
import BranchUserRow from './BranchUserRow'

const BranchUsersTable = ({ usersList, isLoading, onEdit, onDelete, tb }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader size={24} className="animate-spin text-[#0E73F6]" />
      </div>
    )
  }

  return (
    <table className="w-full border-collapse bg-white">
      <thead>
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">
            {tb?.('staff.name') || 'Имя'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">
            {tb?.('staff.email') || 'Email'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">
            {tb?.('staff.phone') || 'Телефон'}
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-[#344054] border-b">
            {tb?.('staff.role') || 'Роль'}
          </th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-[#344054] border-b w-[100px]">
            {tb?.('staff.actions') || 'Действия'}
          </th>
        </tr>
      </thead>
      <tbody>
        {usersList?.map((user) => (
          <BranchUserRow
            key={user?.guid}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {usersList?.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
              {tb?.('noStaff') || 'Нет сотрудников'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default BranchUsersTable
