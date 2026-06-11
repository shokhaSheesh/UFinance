import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { processRolePermissions } from '../utils/permissionUtils'

export const usePermissionTree = (rolePermission) => {
  const [menuIdMap, setMenuIdMap] = useState({})

  const { defaultValues, menuIdMap: initialMenuIdMap } = useMemo(
    () => processRolePermissions(rolePermission),
    [rolePermission],
  )

  useEffect(() => {
    if (Object.keys(initialMenuIdMap)?.length > 0) {
      setMenuIdMap(initialMenuIdMap)
    }
  }, [initialMenuIdMap])

  const form = useForm({
    defaultValues: defaultValues || { permissions: {} },
    values: defaultValues,
  })

  const { setValue, watch } = form
  const permissions = watch('permissions') || {}

  const handleCheckboxChange = (id, action, parentId = null) => {
    if (parentId) {
      const currentValue = permissions?.[parentId]?.[id]?.[action] || false
      setValue(`permissions.${parentId}.${id}.${action}`, !currentValue)
    } else {
      const currentValue = permissions?.[id]?.[action] || false
      setValue(`permissions.${id}.${action}`, !currentValue)
    }
  }

  const handleParentCheckboxChange = (parent, action) => {
    const currentValue = permissions?.[parent?.id]?.[action] || false
    const newValue = !currentValue

    setValue(`permissions.${parent?.id}.${action}`, newValue)

    if (parent?.children) {
      parent?.children?.forEach((child) => {
        setValue(`permissions.${parent?.id}.${child?.id}.${action}`, newValue)
      })
    }
  }

  return {
    form,
    permissions,
    menuIdMap,
    handleCheckboxChange,
    handleParentCheckboxChange,
  }
}
