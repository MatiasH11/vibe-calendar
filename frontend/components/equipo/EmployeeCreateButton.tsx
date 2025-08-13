'use client';

import { useState } from 'react';
import EmployeeCreateDialog from '@/components/equipo/EmployeeCreateDialog';

export default function EmployeeCreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="px-3 py-2 border rounded" onClick={() => setOpen(true)}>Agregar Empleado</button>
      <EmployeeCreateDialog open={open} onOpenChange={setOpen} />
    </>
  );
}


