/**
 * Доступ роли к юрлицам и счетам (account_permissions / access_new_accounts).
 *
 * Настройка живёт на роли (см. update_role_permissions / get_role_permissions)
 * и приезжает вместе с правами в get_user_role_permissions при входе и при
 * смене филиала — так же, как закрытый период (utils/dataEditingRestriction.js).
 *
 * Бэк присылает дерево целиком и уже нормализует «нет записи» в permission: true,
 * поэтому запрещено только то, что явно помечено false. Гуида, которого в дереве
 * нет вовсе (счёт завели после того, как роль сохранили), касается флаг
 * access_new_accounts.
 */

export const DEFAULT_ACCOUNT_PERMISSIONS = {
  legalEntities: {},
  accounts: {},
  accessNew: true,
  // false — прав не присылали (админ, ошибка запроса, старый localStorage):
  // тогда ничего не прячем, иначе пустой список выглядел бы как «нет данных»
  loaded: false,
}

// Сырой `data` из get_user_role_permissions / get_role_permissions → состояние стора
export const mapAccountPermissionsFromApi = (data) => {
  const tree = Array.isArray(data?.account_permissions) ? data.account_permissions : []

  const legalEntities = {}
  const accounts = {}

  tree.forEach((entity) => {
    if (!entity?.guid) return
    legalEntities[entity.guid] = entity?.permission !== false

    ;(entity?.children || []).forEach((account) => {
      if (!account?.guid) return
      accounts[account.guid] = account?.permission !== false
    })
  })

  return {
    legalEntities,
    accounts,
    accessNew: !!data?.access_new_accounts,
    loaded: tree.length > 0,
  }
}

const isGuidAllowed = (map, guid, permissions) => {
  if (!permissions?.loaded) return true
  if (!guid) return true

  const value = map?.[guid]
  // Не знаем такого гуида — значит объект появился после сохранения роли
  return value === undefined ? !!permissions?.accessNew : !!value
}

export const isAccountAllowed = (guid, permissions) =>
  isGuidAllowed(permissions?.accounts, guid, permissions)

export const isLegalEntityAllowed = (guid, permissions) =>
  isGuidAllowed(permissions?.legalEntities, guid, permissions)

/**
 * Отфильтровать список счетов. `guidKey` — где лежит гуид счёта в элементе.
 */
export const filterAllowedAccounts = (list, permissions, guidKey = 'guid') => {
  if (!permissions?.loaded || !Array.isArray(list)) return list
  return list.filter((item) => isAccountAllowed(item?.[guidKey], permissions))
}

/**
 * Отфильтровать сгруппированный список: группа — юрлицо, `children` — его счета.
 * Группа без доступных счетов из выдачи убирается.
 */
export const filterAllowedAccountGroups = (groups, permissions, childrenKey = 'children') => {
  if (!permissions?.loaded || !Array.isArray(groups)) return groups

  return groups
    .map((group) => {
      const children = filterAllowedAccounts(group?.[childrenKey], permissions)
      return { ...group, [childrenKey]: children }
    })
    .filter((group) => group?.[childrenKey]?.length > 0)
}
