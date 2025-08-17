'use client';

import '@/app/globals.css';
import AppProviders from '@/providers/AppProviders';

// Layout simplificado después del reseteo de UI
// Mantiene la infraestructura de providers pero elimina navegación compleja
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div className="min-h-screen">
        <main className="p-4">{children}</main>
      </div>
    </AppProviders>
  );
}


