'use client';

import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardProvider, useDashboard } from '@/components/dashboard/DashboardProvider';

import { cn } from '@/lib/utils';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isMobile, sidebarOpen, setSidebarOpen } = useDashboard();

  return (
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Layout principal */}
      <div className="flex w-full min-h-screen">
        {/* Sidebar */}
        <div className={cn(
          "transition-transform duration-300 z-50 flex-shrink-0",
          isMobile ? "fixed left-0 top-0 h-screen" : "relative h-screen",
          isMobile && !sidebarOpen && "-translate-x-full"
        )}>
          <Sidebar />
        </div>
        
        {/* Área de contenido principal */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthRedirect requireAuth={true}>
      <DashboardProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </DashboardProvider>
    </AuthRedirect>
  );
}
