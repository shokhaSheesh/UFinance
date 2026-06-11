'use client'

import { Pencil } from 'lucide-react'

const ContractTable = ({ contracts, onEdit, tco, tc }) => {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-slate-600">
          <tr>
            <th className="text-left px-4 py-3 font-medium">{tco?.('branch')}</th>
            <th className="text-start px-4 py-3 font-medium w-32">{tco?.('name')}</th>
            <th className="text-left px-4 py-3 font-medium">{tco?.('file')}</th>
            <th className="text-right px-4 py-3 font-medium w-32">{tco?.('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {contracts?.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                {tco?.('empty')}
              </td>
            </tr>
          ) : (
            contracts?.map((c) => (
              <tr key={c?.guid} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-slate-900">{c?.branch_name || '—'}</td>
                <td className="px-4 py-3 text-start text-slate-900">{c?.name || '—'}</td>
                <td className="px-4 py-3">
                  {c?.file ? (
                    <a
                      href={c?.file}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0E73F6] hover:underline truncate inline-block max-w-[420px] align-middle"
                    >
                      {c?.file?.split('/')?.pop()}
                    </a>
                  ) : (
                    <span className="text-slate-400">{tc?.('noData')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onEdit?.(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#0E73F6] border border-[#0E73F6]/30 rounded-md hover:bg-[#0E73F6]/5"
                    >
                      <Pencil size={14} />
                      {tco?.('edit')}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ContractTable
