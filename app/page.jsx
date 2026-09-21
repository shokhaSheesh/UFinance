"use client"

import { useRouter } from '@/hooks/useAppRouter'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/operations')
  }, [router])
  
  return null
}
