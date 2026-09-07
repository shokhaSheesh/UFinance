// Дерево доступов роли: юрлицо → его счета (см. account-permissions-api.md).
// Бэк всегда возвращает список целиком и уже нормализует «нет записи» в permission: true,
// поэтому на фронте отдельного состояния «не задано» нет.

export const normalizeAccountPermissions = (accountPermissions) => {
  if (!Array.isArray(accountPermissions)) return []

  return accountPermissions
    ?.filter((entity) => entity?.guid)
    ?.map((entity) => ({
      guid: entity?.guid,
      nazvanie: entity?.nazvanie || '',
      permission: entity?.permission !== false,
      children: (entity?.children || [])
        ?.filter((account) => account?.guid)
        ?.map((account) => ({
          guid: account?.guid,
          nazvanie: account?.nazvanie || '',
          permission: account?.permission !== false,
        })),
    }))
}

// Состояние чекбокса юрлица считается по его счетам: у юрлица со счетами
// собственный permission — производный, поэтому в UI он не участвует.
export const getEntityCheckState = (entity) => {
  const children = entity?.children || []

  if (children?.length === 0) {
    return { checked: !!entity?.permission, indeterminate: false }
  }

  const checkedCount = children?.filter((account) => account?.permission)?.length

  return {
    checked: checkedCount === children?.length,
    indeterminate: checkedCount > 0 && checkedCount < children?.length,
  }
}

export const toggleEntityPermission = (tree, entityGuid) =>
  tree?.map((entity) => {
    if (entity?.guid !== entityGuid) return entity

    const { checked } = getEntityCheckState(entity)
    const nextValue = !checked

    return {
      ...entity,
      permission: nextValue,
      children: entity?.children?.map((account) => ({
        ...account,
        permission: nextValue,
      })),
    }
  })

export const toggleAccountPermission = (tree, entityGuid, accountGuid) =>
  tree?.map((entity) => {
    if (entity?.guid !== entityGuid) return entity

    const children = entity?.children?.map((account) =>
      account?.guid === accountGuid
        ? { ...account, permission: !account?.permission }
        : account,
    )

    return {
      ...entity,
      // Юрлицо доступно, пока открыт хотя бы один его счёт
      permission: children?.some((account) => account?.permission),
      children,
    }
  })

export const buildAccountPermissionsPayload = (tree) =>
  tree?.map((entity) => {
    const children = entity?.children?.map((account) => ({
      guid: account?.guid,
      nazvanie: account?.nazvanie,
      permission: !!account?.permission,
      children: [],
    }))

    return {
      guid: entity?.guid,
      nazvanie: entity?.nazvanie,
      permission:
        children?.length > 0
          ? children?.some((account) => account?.permission)
          : !!entity?.permission,
      children,
    }
  })
