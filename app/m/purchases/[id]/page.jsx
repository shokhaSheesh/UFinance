'use client'

import DealDetailScreen from '@/components/mobile/deals/DealDetailScreen'
import { useParams } from 'next/navigation'

/** Сделка по закупке на телефоне — экран общий с продажей. */
export default function MobilePurchasePage() {
  const params = useParams()
  return <DealDetailScreen kind="purchase" dealId={params?.id} />
}
