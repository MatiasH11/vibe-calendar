'use client';

import { useDashboard } from './DashboardProvider';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { breadcrumbs } = useDashboard();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      <Home className="w-4 h-4 text-gray-500" />
      
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span 
            className={cn(
              index === breadcrumbs.length - 1
                ? "text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {crumb}
          </span>
        </div>
      ))}
    </nav>
  );
}
