import { QueryCache, QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error('Query error:', error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('Mutation error:', error);
        },
      },
    },
  });
}


