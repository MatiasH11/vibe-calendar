'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'block rounded px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100',
        active && 'bg-neutral-100 font-medium'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}


