'use client'

import { Loader } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { authStore } from '@/store/auth.store'
import ContractHeader from '@/modules/settings/contract/components/ContractHeader'
import ContractTable from '@/modules/settings/contract/components/ContractTable'
import ContractEditDialog from '@/modules/settings/contract/components/ContractEditDialog'
import {
  mapContracts,
  useContractsQuery,
} from '@/modules/settings/contract/hooks/useContractData'

const ContractSettingsPage = observer(() => {
  const tco = useTranslations('Settings.contract')
  const tc = useTranslations('Settings.common')
  const branchId = authStore?.branch_id
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useContractsQuery(branchId)
  const contracts = mapContracts(data)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-4 overflow-auto">
      <ContractHeader title={tco?.('pageTitle')} subtitle={tco?.('subtitle')} />

      <ContractTable
        contracts={contracts}
        onEdit={setEditing}
        tco={tco}
        tc={tc}
      />

      {editing && (
        <ContractEditDialog
          contract={editing}
          branchId={branchId}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
          tco={tco}
        />
      )}
    </div>
  )
})

export default ContractSettingsPage
