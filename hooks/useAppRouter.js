'use client'

import { isNavigationTarget, navigationProgress } from '@/lib/navigationProgress'
import { useRouter as useNextRouter } from 'next/navigation'
import { useMemo } from 'react'

/**
 * useRouter из next/navigation, который включает полосу загрузки вверху
 * экрана при переходе (push / back). Раньше после клика по строке ничего не
 * происходило, пока не приходила новая страница, и было непонятно, открывается
 * ли что-то вообще. replace не трогаем: им тихо обновляют параметры в адресе.
 */
export function useRouter() {
  const router = useNextRouter()
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => {
        if (isNavigationTarget(href)) navigationProgress.start()
        return router.push(href, options)
      },
      back: () => {
        navigationProgress.start()
        return router.back()
      },
    }),
    [router]
  )
}

export default useRouter
