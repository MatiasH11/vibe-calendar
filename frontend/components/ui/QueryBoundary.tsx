'use client';

import { ErrorBoundary } from 'react-error-boundary';

export default function QueryBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => (
      <div className="p-4 text-sm">
        <p>Ocurrió un error al cargar los datos.</p>
        <button className="underline" onClick={resetErrorBoundary}>Reintentar</button>
      </div>
    )}>
      {children}
    </ErrorBoundary>
  );
}


