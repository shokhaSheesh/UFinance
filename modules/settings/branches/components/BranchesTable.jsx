'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import BranchRow from './BranchRow'

function BranchesTable({ branches, isLoading, onEdit, onDelete, onCreateClick }) {
  const tb = useTranslations('Settings.branches')

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                {tb('table.name')}
              </th>
              <th className="px-4 w-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="px-4 py-3 text-xs">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3 text-xs">
                  <Skeleton className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (branches?.length > 0) {
    return (
      <div className="flex-1 bg-white">
        <table className="w-full border-collapse">
          <thead className="sticky top-16 bg-gray-50 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                {tb('table.name')}
              </th>
              <th className="px-4 w-4 py-3 text-left text-xs font-medium text-[#1D2939] border-b border-gray-200 whitespace-nowrap">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {branches?.map((branch) => (
              <BranchRow
                key={branch?.guid}
                branch={branch}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center py-10 px-5">
      <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-4">{tb('empty.title')}</h2>
      <p className="text-base text-[#666] leading-relaxed max-w-xl mb-4">
        {tb('empty.description')}
      </p>
      <p className="text-sm text-[#999] leading-relaxed max-w-xl mb-8">
        {tb('empty.help')}
        <br />
        {''}
        <a href="#" className="text-[#00b8d4] no-underline hover:underline">
          {tb('empty.video')}
        </a>{' '}
        {tb('common.or') || 'или'}{' '}
        <a href="#" className="text-[#00b8d4] no-underline hover:underline">
          {tb('empty.article')}
        </a>
        .
      </p>
      <button
        onClick={onCreateClick}
        aria-label={tb('create')}
        className="bg-transparent border-none text-[#d0d0d0] cursor-pointer p-0 hover:text-[#00b8d4] transition-colors"
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 110 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="55" cy="55" r="53" stroke="currentColor" strokeWidth="4" />
          <rect x="53" y="31" width="4" height="48" fill="currentColor" />
          <rect x="79" y="53" width="4" height="48" transform="rotate(90 79 53)" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}

export default BranchesTable
