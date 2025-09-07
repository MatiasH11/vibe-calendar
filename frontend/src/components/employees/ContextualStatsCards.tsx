'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Briefcase
} from 'lucide-react';
import { useContextualStats } from '@/hooks/useContextualStats';
import { useEmployeesStore } from '@/stores/employeesStore';

export function ContextualStatsCards() {
  const { stats, hasData } = useContextualStats();
  const { roleFilter } = useEmployeesStore();

  if (!hasData) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    bgColor, 
    textColor, 
    iconColor 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }) => (
    <div className={`${bgColor} rounded-lg p-4 border transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${textColor} mb-1`}>
            {title}
          </p>
          <p className={`text-2xl font-bold ${textColor.replace('600', '900')} mb-1`}>
            {value}
          </p>
          <p className={`text-xs ${textColor} truncate`}>
            {subtitle}
          </p>
        </div>
        <div className={iconColor}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total empleados */}
      <StatCard
        title="Total"
        value={stats.current.total}
        subtitle={roleFilter ? "empleados filtrados" : "empleados registrados"}
        icon={Users}
        bgColor="bg-blue-50"
        textColor="text-blue-600"
        iconColor="text-blue-500"
      />
      
      {/* Empleados activos */}
      <StatCard
        title="Activos"
        value={stats.current.active}
        subtitle="trabajando actualmente"
        icon={UserCheck}
        bgColor="bg-green-50"
        textColor="text-green-600"
        iconColor="text-green-500"
      />
      
      {/* Empleados inactivos */}
      <StatCard
        title="Inactivos"
        value={stats.current.inactive}
        subtitle="temporalmente fuera"
        icon={Clock}
        bgColor="bg-orange-50"
        textColor="text-orange-600"
        iconColor="text-orange-500"
      />
      
      {/* Total de equipos/roles */}
      <StatCard
        title="Equipos"
        value={stats.distribution.length}
        subtitle="departamentos activos"
        icon={Briefcase}
        bgColor="bg-purple-50"
        textColor="text-purple-600"
        iconColor="text-purple-500"
      />
    </div>
  );
}
