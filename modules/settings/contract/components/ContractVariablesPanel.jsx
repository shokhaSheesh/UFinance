'use client'

import { Check, Search, Variable, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  CONTRACT_VARIABLES_COUNT,
  CONTRACT_VARIABLE_GROUPS,
  toContractToken,
} from '@/modules/settings/contract/constants/contractVariables'

/**
 * Панель переменных шаблона договора: поиск + сгруппированный список.
 * Клик вставляет `${имя}` в место каретки — за саму вставку отвечает диалог,
 * панель лишь сообщает выбранное имя через `onInsert`.
 */
const ContractVariablesPanel = ({ onInsert, tco, disabled = false }) => {
  const t = (key) => tco?.(`editDialog.variables.${key}`) ?? key
  const [query, setQuery] = useState('')
  const [justInserted, setJustInserted] = useState(null)
  const resetTimer = useRef(null)

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase()
    return CONTRACT_VARIABLE_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!search) return true
        const haystack = [item.key, ...(item.aliases || []), t(`items.${item.key}`)]
        return haystack.some((value) => String(value).toLowerCase().includes(search))
      }),
    })).filter((group) => group.items.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tco])

  const found = groups.reduce((total, group) => total + group.items.length, 0)

  const handleInsert = (name) => {
    onInsert?.(toContractToken(name))
    setJustInserted(name)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setJustInserted(null), 1200)
  }

  return (
    <aside className="flex w-[310px] shrink-0 flex-col border-l border-gray-200 bg-slate-50/70">
      <div className="border-b border-gray-200 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0E73F6]/10 text-[#0E73F6]">
            <Variable size={15} />
          </span>
          <h3 className="flex-1 text-sm font-semibold text-slate-900">{t('title')}</h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-gray-200">
            {CONTRACT_VARIABLES_COUNT}
          </span>
        </div>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-slate-500">{t('hint')}</p>

        <div className="relative mt-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-8 text-[13px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0E73F6]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {found === 0 ? (
          <p className="px-1 py-6 text-center text-[12.5px] text-slate-400">{t('empty')}</p>
        ) : (
          groups.map((group) => (
            <section key={group.key} className="mb-4 last:mb-1">
              <h4 className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {t(`groups.${group.key}`)}
              </h4>

              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const inserted = justInserted === item.key
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        disabled={disabled}
                        title={(item.aliases || []).map(toContractToken).join(' · ')}
                        // фокус остаётся в редакторе — иначе каретка в iframe теряется
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleInsert(item.key)}
                        className={`group flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          inserted
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-transparent bg-white hover:border-[#0E73F6]/40 hover:bg-[#0E73F6]/[0.04] hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium leading-tight text-slate-800">
                            {t(`items.${item.key}`)}
                          </span>
                          <span
                            className={`mt-0.5 block truncate font-mono text-[11px] leading-tight ${
                              inserted ? 'text-emerald-600' : 'text-[#0E73F6]'
                            }`}
                          >
                            {toContractToken(item.key)}
                          </span>
                        </span>

                        {inserted ? (
                          <span className="flex items-center gap-1 text-[10.5px] font-medium text-emerald-600">
                            <Check size={13} />
                            {t('inserted')}
                          </span>
                        ) : (
                          <span className="rounded border border-gray-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                            +
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </aside>
  )
}

export default ContractVariablesPanel
