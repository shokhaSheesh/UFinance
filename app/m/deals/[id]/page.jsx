'use client'

import DealDetailScreen from '@/components/mobile/deals/DealDetailScreen'
import { useParams } from 'next/navigation'

/** Сделка по продаже на телефоне — экран общий с закупкой. */
export default function MobileDealPage() {
  const params = useParams()
  return <DealDetailScreen kind="sale" dealId={params?.id} />
}
