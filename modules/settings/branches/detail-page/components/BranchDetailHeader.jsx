'use client'

import { Plus } from 'lucide-react'

const BranchDetailHeader = ({ branchName, onCreate, tb, tc }) => {
  return (
    <div className="flex p-4 sticky bg-white top-0 h-16 justify-start gap-2 items-center">
      <h1 className="text-xl font-bold text-slate-900">
        {branchName} {tb?.('branchStaff') || 'Сотрудники филиала'}
      </h1>
      <button onClick={onCreate} className="flex items-center primary-btn">
        <Plus size={18} />
        {tc?.('add')}
      </button>
    </div>
  )
}

export default BranchDetailHeader
