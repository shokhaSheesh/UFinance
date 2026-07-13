import { useCallback, useState } from 'react'

export function usePurchasesSelection(formattedDeals) {
  const [selectedDeals, setSelectedDeals] = useState(new Set())

  const isAllSelected =
    formattedDeals?.length > 0 && selectedDeals.size === formattedDeals?.length

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedDeals(new Set(formattedDeals.map(d => d.guid)))
    } else {
      setSelectedDeals(new Set())
    }
  }, [formattedDeals])

  const handleSelectOne = useCallback((guid, e) => {
    e.stopPropagation()
    setSelectedDeals(prev => {
      const next = new Set(prev)
      if (next.has(guid)) next.delete(guid)
      else next.add(guid)
      return next
    })
  }, [])

  const removeSelected = useCallback((guid) => {
    setSelectedDeals(prev => {
      const next = new Set(prev)
      next.delete(guid)
      return next
    })
  }, [])

  return { selectedDeals, isAllSelected, handleSelectAll, handleSelectOne, removeSelected }
}
