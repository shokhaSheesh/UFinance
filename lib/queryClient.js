import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // tab o'zgarganda OFF
      refetchOnMount: true,          // page ga qaytganda ON ✅
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
