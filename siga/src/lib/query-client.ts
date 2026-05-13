import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 min — serve cache, refetch em background
        gcTime: 5 * 60 * 1000,      // 5 min — mantém no cache após unmount
        retry: 1,
        refetchOnWindowFocus: true,  // revalida ao retornar para a aba
      },
    },
  })
}
