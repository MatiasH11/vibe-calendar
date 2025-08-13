'use client';

import { useState } from 'react';
import RoleCreateDialog from '@/components/equipo/RoleCreateDialog';

export default function RoleCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="px-3 py-2 border rounded" onClick={() => setOpen(true)}>Nuevo Rol</button>
      <RoleCreateDialog open={open} onOpenChange={setOpen} />
    </>
  );
}


