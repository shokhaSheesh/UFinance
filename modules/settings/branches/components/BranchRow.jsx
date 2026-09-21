'use client'

import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/hooks/useAppRouter'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function RowDropdown({ onEdit, onDelete }) {
  const tc = useTranslations('Settings.common')
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    function handler(e) {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.right - 200 })
    }
    setOpen((prev) => !prev)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent border-none text-neutral-600 cursor-pointer transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e73f6]"
      >
        <EllipsisVertical size={18} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={menuRef}
            style={{ position: 'fixed', top: pos?.top, left: pos?.left }}
            className="z-[9999] list-none m-0 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px]"
          >
            <li
              onClick={() => {
                onEdit?.()
                setOpen(false)
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Pencil size={15} />
              <span>{tc('edit')}</span>
            </li>
            <li
              onClick={() => {
                onDelete?.()
                setOpen(false)
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
            >
              <Trash2 size={15} />
              <span>{tc('delete')}</span>
            </li>
          </ul>,
          document.body,
        )}
    </>
  )
}

function BranchRow({ branch, onEdit, onDelete }) {
  const router = useRouter()
  const tb = useTranslations('Settings.branches')

  return (
    <tr key={branch?.guid} className="hover:bg-gray-50 transition-colors">
      <td
        onClick={(event) => {
          event.stopPropagation()
          router.push(`/settings/branches/${branch?.guid}?name=${branch?.name}`)
        }}
        className="px-4 py-1.5 border-b border-gray-200 cursor-pointer text-xs text-[#344054] whitespace-nowrap"
      >
        {branch?.name ?? tb('admin')}
      </td>
      <td className="p-1 py-1.5 text-xs border border-gray-200">
        <RowDropdown onEdit={() => onEdit?.(branch)} onDelete={() => onDelete?.(branch)} />
      </td>
    </tr>
  )
}

export default BranchRow
