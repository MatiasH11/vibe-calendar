'use client';

import { APP_NAME } from '@/lib/constants';
import { useDashboard } from './DashboardProvider';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { NavigationItem } from './NavigationItem';
import { UserInfo } from './UserInfo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2
} from 'lucide-react';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: Building2,
    href: '/dashboard/administracion',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    href: '/dashboard/reportes',
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    href: '/dashboard/configuracion',
  },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile, sidebarOpen, setSidebarOpen } = useDashboard();
  const { user } = useAuth();
  const { canManageShifts, canViewStatistics, businessRole } = usePermissions();

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  const sidebarContent = (
    <motion.aside 
      initial={false}
      animate={isMobile ? (sidebarOpen ? "open" : "closed") : "open"}
      variants={sidebarVariants}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full min-h-screen",
        isMobile ? "w-64" : (sidebarCollapsed ? "w-16" : "w-64"),
        isMobile && "shadow-xl"
      )}
      style={{ height: '100vh' }}
    >
      {/* Botón de cerrar en móvil */}
      {isMobile && (
        <button
          onClick={closeMobileSidebar}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Botón de colapso en desktop */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
          aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>
      )}

      {/* Header del Sidebar */}
      <div className="p-4 border-b border-gray-200">
        <motion.div 
          className="flex items-center space-x-3"
          layout
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">VC</span>
          </div>
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {APP_NAME}
                </h1>
                {user?.company_id && (
                  <p className="text-xs text-gray-500 truncate">
                    Empresa #{user.company_id}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Área de navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <motion.div 
            layout
            className={cn(
              "text-xs font-medium text-gray-500 uppercase tracking-wider mb-3",
              (sidebarCollapsed && !isMobile) && "text-center"
            )}
          >
            {(sidebarCollapsed && !isMobile) ? "•" : "Menú Principal"}
          </motion.div>
          
          {navigationItems
            .filter(item => {
              // Dashboard siempre visible
              if (item.id === 'dashboard') return true;
              
              // Configuración siempre visible
              if (item.id === 'configuracion') return true;
              
              // Verificar permisos específicos
              if (item.id === 'turnos') return canManageShifts;
              if (item.id === 'reportes') return canViewStatistics;
              
              return true;
            })
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavigationItem
                  item={item}
                  collapsed={sidebarCollapsed && !isMobile}
                />
              </motion.div>
            ))}
        </div>
      </nav>

      {/* Footer del Sidebar - Información del Usuario */}
      <UserInfo collapsed={sidebarCollapsed && !isMobile} />
    </motion.aside>
  );

  if (isMobile) {
    return sidebarContent;
  }

  return sidebarContent;
}
