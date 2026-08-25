'use client'

import { appStore } from '@/store/app.store'
import { Search } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import GroupLeadersModal from './components/GroupLeadersModal'
import GroupsTable from './components/GroupsTable'
import { useGroupLeadersData } from './hooks/useGroupLeaders'

// Группы контрагентов и назначенные на них ответственные (group_leaders)
const GroupsListPage = observer(() => {
  const tg = useTranslations('Settings.groups')

  const groupPermissions = appStore?.permission?.settings?.users || {
    read: true,
    add: true,
    edit: true,
    delete: true,
  }

  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState(null)

  const { groups, leadersByGroup, isLoading } = useGroupLeadersData(search)

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center h-16 sticky top-0 bg-white z-20 justify-between gap-5 px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-semibold text-gray-ucode-800">{tg('pageTitle')}</h1>

        <div className="relative w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-ucode-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tg('searchPlaceholder')}
            className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-gray-ucode-200 rounded-md outline-none transition-colors placeholder:text-gray-ucode-400 focus:border-primary"
          />
        </div>
      </div>

      <GroupsTable
        groups={groups}
        leadersByGroup={leadersByGroup}
        isLoading={isLoading}
        onOpen={setActiveGroup}
      />

      <GroupLeadersModal
        open={!!activeGroup}
        onClose={() => setActiveGroup(null)}
        group={activeGroup}
        canEdit={groupPermissions?.edit}
      />
    </div>
  )
})

export default GroupsListPage
