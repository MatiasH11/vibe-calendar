'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useDashboard } from './DashboardProvider';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  className,
  emptyMessage = "No hay datos disponibles"
}: DataTableProps<T>) {
  const { isMobile } = useDashboard();

  if (data.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </motion.div>
    );
  }

  // Vista móvil: Cards en lugar de tabla
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4 space-y-2"
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map((column) => (
                <div key={String(column.key)} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    {column.label}:
                  </span>
                  <span className="text-sm text-gray-900">
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key])
                    }
                  </span>
                </div>
              ))}
          </motion.div>
        ))}
      </div>
    );
  }

  // Vista desktop: Tabla tradicional
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th 
                key={String(column.key)}
                className="text-left py-3 px-4 font-medium text-gray-900"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((column) => (
                <td 
                  key={String(column.key)}
                  className={cn("py-3 px-4", column.className)}
                >
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key])
                  }
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
