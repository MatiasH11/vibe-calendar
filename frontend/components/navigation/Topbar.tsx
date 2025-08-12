'use client';

import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const TITLE_MAP: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.PLANILLA]: 'Planilla de Turnos',
  [ROUTES.EQUIPO_ROLES]: 'Gestión de Roles',
  [ROUTES.EQUIPO_EMPLEADOS]: 'Gestión de Empleados',
  [ROUTES.MI_TURNOS]: 'Mis Turnos',
};

export default function Topbar() {
  const pathname = usePathname();
  const title = TITLE_MAP[pathname] ?? 'Panel';
  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <h1 className="text-base font-medium">{title}</h1>
      <form action="/api/auth/logout" method="post">
        <Button type="submit" variant="outline" size="sm">Cerrar sesión</Button>
      </form>
    </header>
  );
}


