/**
 * Provider TanStack React Query untuk caching server state.
 *
 * Bungkus paling luar di root layout supaya semua useQuery/useMutation punya client yang sama.
 * QueryClient dibuat sekali di module scope (bukan di dalam komponen) agar tidak reset tiap render.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

/** Satu instance global — staleTime 5 menit, cache 30 menit, retry 2x. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 menit data dianggap masih fresh
      gcTime: 30 * 60 * 1000, // cache disimpan 30 menit setelah tidak dipakai
      retry: 2, // coba ulang 2 kali kalau request gagal
    },
  },
});

/** Wrap children dengan QueryClientProvider. */
export const QueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
