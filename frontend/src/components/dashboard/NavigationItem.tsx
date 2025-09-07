'use client';

import { cn } from '@/lib/utils';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { LucideIcon } from 'lucide-react';

interface NavigationItemProps {
  item: {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
  };
  collapsed: boolean;
}

export function NavigationItem({ item, collapsed }: NavigationItemProps) {
  const { navigateTo, currentPath } = useDashboardNavigation();
  
  const isActive = currentPath === item.href;

  const handleClick = () => {
    navigateTo(item.href);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center text-left transition-all duration-200 rounded-lg group",
        collapsed ? "p-2 justify-center" : "p-3 space-x-3",
        isActive
          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon 
        className={cn(
          "flex-shrink-0 transition-colors duration-200",
          collapsed ? "w-5 h-5" : "w-5 h-5",
          isActive 
            ? "text-blue-600" 
            : "text-gray-500 group-hover:text-gray-700"
        )} 
      />
      
      {!collapsed && (
        <span className={cn(
          "font-medium truncate transition-colors duration-200",
          isActive ? "text-blue-700" : "text-gray-700 group-hover:text-gray-900"
        )}>
          {item.label}
        </span>
      )}
      
      {!collapsed && isActive && (
        <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto flex-shrink-0" />
      )}
    </button>
  );
}
