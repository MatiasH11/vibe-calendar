'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  User, 
  LogOut, 
  ChevronUp,
  Building2,
  Mail
} from 'lucide-react';
import { useState } from 'react';

interface UserInfoProps {
  collapsed: boolean;
}

export function UserInfo({ collapsed }: UserInfoProps) {
  const { user, logout } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  const handleLogout = () => {
    logout();
  };

  if (collapsed) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-col space-y-2">
          <button
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Información del usuario"
            onClick={() => setShowDetails(!showDetails)}
          >
            <User className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors group"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="space-y-3">
        {/* Info del usuario */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              Usuario #{user?.user_id || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role || 'admin'}
            </p>
          </div>
          <ChevronUp 
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              showDetails && "rotate-180"
            )} 
          />
        </button>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="space-y-2 pl-2">
            {user?.email && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user?.company_id && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building2 className="w-3 h-3" />
                <span>Empresa #{user.company_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Botón de logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-red-50 transition-colors group"
        >
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
            <LogOut className="w-4 h-4 text-red-600 group-hover:text-red-700" />
          </div>
          <span className="text-sm font-medium text-red-600 group-hover:text-red-700">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );
}
