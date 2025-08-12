import { NAV_ITEMS } from '@/lib/routes';
import { NavLink } from './NavLink';
import { Calendar, Clock, Home, Shield, Users } from 'lucide-react';
import Link from 'next/link';

const ICONS: Record<string, any> = { Home, Calendar, Shield, Users, Clock };

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 border-r min-h-screen sticky top-0">
      <div className="p-4 font-semibold text-lg">
        <Link href="/dashboard">Vibe Calendar</Link>
      </div>
      <nav className="px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? Home;
          return (
            <NavLink key={item.href} href={item.href}>
              <span className="inline-flex items-center gap-2">
                <Icon size={16} />
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}


