'use client'

import React from 'react'
import PermissionRow from './PermissionRow'

const PermissionTree = ({
  permissionsConfig,
  permissions,
  onCheckboxChange,
  onParentCheckboxChange,
  t,
}) => {
  return (
    <table className="w-fit border-collapse">
      <thead className="bg-gray-ucode-50">
        <tr>
          <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.menu') || 'Меню'}
          </th>
          <th className="px-4 py-3 text-left text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.submenu') || 'Подменю'}
          </th>
          <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.read')}
          </th>
          <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.add')}
          </th>
          <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.edit')}
          </th>
          <th className="px-4 py-3 text-center w-[100px] text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]">
            {t('permissions.delete')}
          </th>
        </tr>
      </thead>
      <tbody>
        {permissionsConfig?.map((item) => (
          <React.Fragment key={item?.id}>
            <PermissionRow
              item={item}
              permissions={permissions}
              onCheckboxChange={onCheckboxChange}
              onParentCheckboxChange={onParentCheckboxChange}
            />
            {item?.children?.map((child) => (
              <PermissionRow
                key={child?.id}
                item={child}
                isChild
                parent={item}
                permissions={permissions}
                onCheckboxChange={onCheckboxChange}
                onParentCheckboxChange={onParentCheckboxChange}
              />
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}

export default PermissionTree
