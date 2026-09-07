'use client'

import OperationCheckbox from '@/components/shared/Checkbox/operationCheckbox'
import { Loader } from 'lucide-react'
import { Fragment } from 'react'
import { getEntityCheckState } from '../utils/accountPermissionUtils'

const TH = 'px-4 py-3 text-[11px] font-semibold capitalize text-[#344054] border-b border-[#f2f4f7]'
const TD = 'px-4 py-3 text-sm text-[#344054] border-b border-[#f2f4f7]'

/**
 * Вкладка «Юрлица и счета»: дерево доступов роли к юрлицам и их счетам.
 * Уходит в update_role_permissions полем account_permissions вместе с role_permissions.
 * Флаг access_new_accounts живёт над табами (см. AccessNewAccounts).
 */
const AccountPermissions = ({ tree, onToggleEntity, onToggleAccount, isLoading, t, tc }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white w-[740px] max-w-full">
      <div className="max-h-[520px] overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">{tc('loading')}...</span>
          </div>
        )}

        {!isLoading && tree?.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">{t('accounts.empty')}</div>
        )}

        {!isLoading && tree?.length > 0 && (
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-gray-ucode-50 sticky top-0 z-10">
              <tr>
                <th className={`${TH} w-1/3 text-left`}>{t('accounts.legalEntity')}</th>
                <th className={`${TH} w-1/3 text-left`}>{t('accounts.account')}</th>
                <th className={`${TH} w-1/3 text-center`}>{t('accounts.access')}</th>
              </tr>
            </thead>
            <tbody>
              {tree?.map((entity) => {
                const entityState = getEntityCheckState(entity)

                return (
                  <Fragment key={entity?.guid}>
                    <tr className="bg-white font-medium">
                      <td className={TD}>{entity?.nazvanie}</td>
                      <td className={TD} />
                      <td className={`${TD} text-center`}>
                        <div className="flex justify-center items-center">
                          <OperationCheckbox
                            checked={entityState?.checked}
                            indeterminate={entityState?.indeterminate}
                            onChange={() => onToggleEntity(entity?.guid)}
                          />
                        </div>
                      </td>
                    </tr>

                    {entity?.children?.map((account) => (
                      <tr key={account?.guid} className="bg-white">
                        <td className={TD} />
                        <td className={TD}>{account?.nazvanie}</td>
                        <td className={`${TD} text-center`}>
                          <div className="flex justify-center items-center">
                            <OperationCheckbox
                              checked={!!account?.permission}
                              onChange={() => onToggleAccount(entity?.guid, account?.guid)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AccountPermissions
