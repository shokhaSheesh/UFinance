export const getPermissionsData = (t) => [
  {
    id: 'indicators',
    label: t('permissions.sections.indicators'),
    hasSubmenu: false,
    allowedActions: ['read'],
    menuId: null,
  },
  {
    id: 'operations',
    label: t('permissions.sections.operations'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'income', label: t('permissions.sections.income'), menuId: null },
      { id: 'expense', label: t('permissions.sections.expense'), menuId: null },
      { id: 'transfer', label: t('permissions.sections.transfer'), menuId: null },
      { id: 'accrual', label: t('permissions.sections.accrual'), menuId: null },
      { id: 'shipment', label: t('permissions.sections.shipment'), menuId: null },
    ],
  },
  {
    id: 'deals',
    label: t('permissions.sections.deals'),
    hasSubmenu: false,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
  },
  {
    id: 'reports',
    label: t('permissions.sections.reports'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'cash_flow', label: t('permissions.sections.cash_flow'), menuId: null },
      { id: 'p_and_l', label: t('permissions.sections.p_and_l'), menuId: null },
      { id: 'balance', label: t('permissions.sections.balance'), menuId: null },
      { id: 'students_report', label: t('permissions.sections.students_report'), menuId: null },
    ],
  },
  {
    id: 'directories',
    label: t('permissions.sections.directories'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'counterparties', label: t('permissions.sections.counterparties'), menuId: null },
      { id: 'accounting_items', label: t('permissions.sections.accounting_items'), menuId: null },
      { id: 'my_accounts', label: t('permissions.sections.my_accounts'), menuId: null },
      { id: 'my_entities', label: t('permissions.sections.my_entities'), menuId: null },
      { id: 'products_and_services', label: t('permissions.sections.products_and_services'), menuId: null },
    ],
  },
  {
    id: 'settings',
    label: t('permissions.sections.settings'),
    hasSubmenu: true,
    allowedActions: ['read', 'add', 'edit', 'delete'],
    menuId: null,
    children: [
      { id: 'general_settings', label: t('permissions.sections.general_settings'), menuId: null },
      { id: 'my_profile', label: t('permissions.sections.my_profile'), menuId: null },
      { id: 'branches', label: t('permissions.sections.branches'), menuId: null },
      { id: 'exchange_rates', label: t('permissions.sections.exchange_rates'), menuId: null },
      { id: 'users', label: t('permissions.sections.users'), menuId: null },
    ],
  },
]

// The static config above can drift from what the backend actually returns in two ways:
//   1. A whole top-level menu is missing (e.g. "warehouse" / "Мой склад").
//   2. A known menu (e.g. "deals" / "Сделки") gains sub-menus on the backend
//      (e.g. "Продажи" / "Закупки") that the static config still lists as a plain leaf.
// In both cases the extra permissions never render and are silently dropped from the
// save payload. Merge whatever the API returns into the config so every permission is
// both displayed and saved.
export const mergePermissionsConfig = (baseConfig, rolePermission) => {
  if (!Array.isArray(rolePermission) || rolePermission?.length === 0) {
    return baseConfig
  }

  const apiBySlug = {}
  rolePermission?.forEach((perm) => {
    if (perm?.menu_slug) apiBySlug[perm.menu_slug] = perm
  })

  const toChildConfig = (child) => ({
    id: child?.menu_slug,
    label: child?.menu_name || child?.menu_slug,
    menuId: null,
  })

  // 1. Enrich known sections with any API sub-menus the static config is missing.
  const enriched = (baseConfig || [])?.map((item) => {
    const apiChildren = apiBySlug[item?.id]?.children || []
    if (apiChildren?.length === 0) return item

    const existingChildIds = new Set((item?.children || [])?.map((c) => c?.id))
    const extraChildren = apiChildren
      ?.filter((c) => c?.menu_slug && !existingChildIds.has(c?.menu_slug))
      ?.map(toChildConfig)

    if (extraChildren?.length === 0) return item

    return {
      ...item,
      hasSubmenu: true,
      children: [...(item?.children || []), ...extraChildren],
    }
  })

  // 2. Append top-level menus the static config does not cover at all.
  const knownIds = new Set((baseConfig || [])?.map((item) => item?.id))
  const extraSections = rolePermission
    ?.filter((perm) => perm?.menu_slug && !knownIds.has(perm?.menu_slug))
    ?.map((perm) => {
      const children = (perm?.children || [])
        ?.filter((child) => child?.menu_slug)
        ?.map(toChildConfig)

      const section = {
        id: perm?.menu_slug,
        label: perm?.menu_name || perm?.menu_slug,
        hasSubmenu: children?.length > 0,
        allowedActions: ['read', 'add', 'edit', 'delete'],
        menuId: null,
      }

      // Only attach `children` when there really are sub-items — an empty array would
      // route a leaf row through the parent-checkbox handler in PermissionRow.
      if (children?.length > 0) {
        section.children = children
      }

      return section
    })

  return [...(enriched || []), ...extraSections]
}

export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const processRolePermissions = (rolePermission) => {
  if (!rolePermission) {
    return { defaultValues: null, menuIdMap: {} }
  }

  const menuMap = {}
  const formPermissions = {}

  rolePermission?.forEach((perm) => {
    const menuSlug = perm?.menu_slug

    menuMap[menuSlug] = {
      menu_id: perm?.menu_id,
      guid: perm?.guid,
      menu_slug: perm?.menu_slug,
      menu_name: perm?.menu_name,
    }

    if (perm?.children && perm?.children?.length > 0) {
      formPermissions[menuSlug] = {
        read: perm?.read || false,
        add: perm?.write || false,
        edit: perm?.update || false,
        delete: perm?.delete || false,
      }
      perm?.children?.forEach((child) => {
        menuMap[`${menuSlug}.${child?.menu_slug}`] = {
          menu_id: child?.menu_id,
          guid: child?.guid,
          menu_slug: child?.menu_slug,
          menu_name: child?.menu_name,
        }

        formPermissions[menuSlug][child?.menu_slug] = {
          read: child?.read || false,
          add: child?.write || false,
          edit: child?.update || false,
          delete: child?.delete || false,
        }
      })
    } else {
      formPermissions[menuSlug] = {
        read: perm?.read || false,
        add: perm?.write || false,
        edit: perm?.update || false,
        delete: perm?.delete || false,
      }
    }
  })

  return {
    defaultValues: { permissions: formPermissions },
    menuIdMap: menuMap,
  }
}

export const buildPermissionsPayload = (permissionsData, permissionsConfig, menuIdMap) => {
  return permissionsConfig?.map((parent) => {
    const parentPerm = permissionsData?.[parent?.id]
    const parentMenuId = menuIdMap?.[parent?.id] || null

    if (parent?.children && parent?.children?.length > 0) {
      const children = parent?.children?.map((child) => {
        const childPerm = parentPerm?.[child?.id] || {}
        const childMenuId = menuIdMap?.[`${parent?.id}.${child?.id}`] || null
        return {
          ...childMenuId,
          read: childPerm?.read || false,
          write: childPerm?.add || false,
          update: childPerm?.edit || false,
          delete: childPerm?.delete || false,
        }
      })

      return {
        ...parentMenuId,
        read: parentPerm?.read || false,
        write: parentPerm?.add || false,
        update: parentPerm?.edit || false,
        delete: parentPerm?.delete || false,
        children,
      }
    }

    return {
      ...parentMenuId,
      read: parentPerm?.read || false,
      write: parentPerm?.add || false,
      update: parentPerm?.edit || false,
      delete: parentPerm?.delete || false,
      children: [],
    }
  })
}
