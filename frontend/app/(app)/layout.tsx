import '@/app/globals.css';
import Sidebar from '@/components/navigation/Sidebar';
import Topbar from '@/components/navigation/Topbar';
import AppProviders from '@/providers/AppProviders';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 min-h-screen flex flex-col">
          <Topbar />
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </AppProviders>
  );
}


