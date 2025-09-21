'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SimpleShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Alt + N', description: 'Crear nuevo turno', category: 'Turnos' },
  { key: 'Alt + D', description: 'Duplicar turno seleccionado', category: 'Turnos' },
  { key: 'Alt + F', description: 'Enfocar búsqueda', category: 'Navegación' },
  { key: 'Alt + M', description: 'Abrir gestor de plantillas', category: 'Plantillas' },
  { key: '←', description: 'Semana anterior', category: 'Navegación' },
  { key: '→', description: 'Semana siguiente', category: 'Navegación' },
  { key: 'T', description: 'Ir a hoy', category: 'Navegación' },
  { key: '?', description: 'Mostrar/ocultar esta ayuda', category: 'Ayuda' },
];

export const SimpleShortcutHelp: React.FC<SimpleShortcutHelpProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de Teclado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Usa estos atajos para navegar más rápido por la aplicación. Los atajos Alt son seguros y no interfieren con el navegador.
          </div>

          <div className="grid gap-4">
            {['Turnos', 'Navegación', 'Plantillas', 'Ayuda'].map(category => {
              const categoryShortcuts = shortcuts.filter(shortcut => shortcut.category === category);
              
              if (categoryShortcuts.length === 0) return null;
              
              return (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{shortcut.description}</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};