import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,    // 2 min — cache fresco, sem refetch desnecessário
        gcTime: 10 * 60 * 1000,     // 10 min — dados disponíveis entre navegações
        retry: 1,
        refetchOnWindowFocus: false, // evita refetch ao alt-tab
      },
    },
  })
}
