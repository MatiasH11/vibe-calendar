'use client';

import { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import { Toaster } from 'sonner';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}


