import { useState } from 'react'
import {
  normalizeAccountPermissions,
  toggleAccountPermission,
  toggleEntityPermission,
} from '../utils/accountPermissionUtils'

/**
 * Состояние вкладки «Юрлица и счета».
 * `access_new_accounts` бэк перезаписывает при каждом update_role_permissions,
 * поэтому текущее значение всегда уходит вместе с деревом.
 */
export const useAccountPermissions = () => {
  const [tree, setTree] = useState([])
  const [accessNewAccounts, setAccessNewAccounts] = useState(false)

  const initFromRole = (roleData) => {
    setTree(normalizeAccountPermissions(roleData?.account_permissions))
    setAccessNewAccounts(!!roleData?.access_new_accounts)
  }

  return {
    tree,
    accessNewAccounts,
    initFromRole,
    setAccessNewAccounts,
    toggleEntity: (entityGuid) =>
      setTree((prev) => toggleEntityPermission(prev, entityGuid)),
    toggleAccount: (entityGuid, accountGuid) =>
      setTree((prev) => toggleAccountPermission(prev, entityGuid, accountGuid)),
  }
}
