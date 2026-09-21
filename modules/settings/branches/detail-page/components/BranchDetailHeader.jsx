'use client'

import BackLink from '@/components/shared/BackLink/BackLink'
import PageHeader from '@/components/shared/PageHeader/PageHeader'
import { Plus } from 'lucide-react'

/** Шапка карточки филиала: заголовок слева, добавление сотрудника — справа. */
const BranchDetailHeader = ({ branchName, onCreate, tb, tc }) => {
  return (
    <>
    <div className="px-4 pt-4">
      <BackLink href="/settings/branches" label={tb?.('pageTitle')} />
    </div>
    <PageHeader
      className="sticky top-0 z-20 px-4"
      title={`${branchName} ${tb?.('branchStaff') || 'Сотрудники филиала'}`}
      actions={
        <button onClick={onCreate} className="primary-btn gap-1.5">
          <Plus size={16} />
          {tc?.('add')}
        </button>
      }
    />
    </>
  )
}

export default BranchDetailHeader
