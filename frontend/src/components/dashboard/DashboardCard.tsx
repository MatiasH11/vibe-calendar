'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  headerActions?: React.ReactNode;
}

export function DashboardCard({ 
  title, 
  subtitle, 
  children, 
  icon: Icon, 
  iconColor = "text-gray-600",
  className,
  headerActions
}: DashboardCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center space-x-2">
            {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
            <span>{title}</span>
          </CardTitle>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
