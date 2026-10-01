'use client'

import BudgetDetailScreen from '@/components/mobile/plans/BudgetDetailScreen'
import { useParams } from 'next/navigation'

/** Бюджет на телефоне: /m/plans/pnl/<id> — БДР, /m/plans/cashflow/<id> — БДДС. */
export default function MobileBudgetPage() {
  const params = useParams()
  const type = params?.type === 'cashflow' ? 'cashflow' : 'pnl'
  return <BudgetDetailScreen type={type} id={params?.id} />
}
