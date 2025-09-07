'use client';

import { useDashboard } from './DashboardProvider';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import { motion } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, children }: DashboardHeaderProps) {
  const { isMobile, sidebarOpen, setSidebarOpen } = useDashboard();
  const { getCurrentNavigation } = useDashboardNavigation();
  const [showActions, setShowActions] = useState(false);
  
  const currentNav = getCurrentNavigation();
  const displayTitle = title || currentNav.label;

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Botón menú móvil */}
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </motion.div>
            </motion.button>
          )}

          <div className="min-w-0 flex-1">
            {/* Breadcrumbs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Breadcrumbs className="mb-1" />
            </motion.div>
            
            {/* Título */}
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
            >
              {displayTitle}
            </motion.h1>
            
            {/* Subtítulo */}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 mt-1 text-sm sm:text-base truncate"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {/* Área de acciones */}
        {children && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            {isMobile ? (
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Mostrar acciones"
                >
                  <ChevronDown className={cn(
                    "w-5 h-5 text-gray-600 transition-transform duration-200",
                    showActions && "rotate-180"
                  )} />
                </motion.button>
                
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50"
                  >
                    {children}
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3"
              >
                {children}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
}
