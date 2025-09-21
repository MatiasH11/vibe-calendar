'use client';

import { ShiftTemplateManager } from '@/components/shifts/templates/ShiftTemplateManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const queryClient = new QueryClient();

export default function TestTemplatesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Test Templates Page</h1>
        <ShiftTemplateManager />
      </div>
    </QueryClientProvider>
  );
}