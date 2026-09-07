'use client'

import { cn } from '@/lib/utils'

const RoleDetailTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex items-center border-b border-gray-200">
      {tabs?.map((tab) => (
        <button
          key={tab?.key}
          type="button"
          onClick={() => onChange(tab?.key)}
          className={cn(
            'px-4 py-3 text-sm bg-transparent border-none border-b-2 cursor-pointer transition-colors',
            activeTab === tab?.key
              ? 'text-primary border-primary font-semibold'
              : 'text-slate-500 border-transparent hover:text-slate-800',
          )}
        >
          {tab?.label}
        </button>
      ))}
    </div>
  )
}

export default RoleDetailTabs
