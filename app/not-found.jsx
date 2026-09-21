'use client'
import { authStore } from "@/store/auth.store"
import { observer } from "mobx-react-lite"
import { useRouter } from "@/hooks/useAppRouter"
import { useEffect } from 'react'

const NotFound = observer(() => {
  const router = useRouter()

  useEffect(() => {
    if (authStore.isAuthenticated) {
      router.replace('/operations')
    } else {
      router.replace('/auth')
    }
  }, [router])

  return null
})

export default NotFound