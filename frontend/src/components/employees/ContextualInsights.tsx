'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useContextualStats } from '@/hooks/useContextualStats';
import { useEmployeesStore } from '@/stores/employeesStore';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ContextualInsights() {
  const { stats, hasData } = useContextualStats();
  const { roleFilter, setCreatingEmployee, setCreatingCargo } = useEmployeesStore();

  if (!hasData) {
    return null;
  }

  // Generar insights dinámicos basados en el contexto
  const insights = [];

  // Insight de cargo más popular
  if (stats.insights.mostPopularRole !== 'N/A' && !roleFilter) {
    insights.push({
      type: 'info',
      icon: TrendingUp,
      title: 'Cargo más popular',
      description: `${stats.insights.mostPopularRole} tiene más empleados`,
      action: stats.distribution.length > 0 ? {
        label: 'Ver detalles',
        onClick: () => {
          const popularCargo = stats.distribution[0];
          if (popularCargo) {
            // filterByRole será llamado desde el padre
          }
        }
      } : undefined,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    });
  }

  // Insight de roles vacíos
  if (stats.insights.emptyRoles > 0) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `${stats.insights.emptyRoles} cargo${stats.insights.emptyRoles > 1 ? 's' : ''} vacío${stats.insights.emptyRoles > 1 ? 's' : ''}`,
      description: 'Considere asignar empleados o eliminar cargos no utilizados',
      action: {
        label: 'Gestionar cargos',
        onClick: () => setCreatingCargo(true)
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    });
  }

  // Insight de distribución equilibrada
  if (stats.distribution.length > 2 && stats.insights.averageEmployeesPerRole > 0) {
    const isBalanced = stats.distribution.every(role => 
      Math.abs(role.count - stats.insights.averageEmployeesPerRole) <= 2
    );
    
    if (isBalanced) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Distribución equilibrada',
        description: `Buena distribución de empleados entre cargos`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      });
    }
  }

  // Insight de empleados activos
  if (stats.current.activePercentage < 80 && stats.current.total > 5) {
    insights.push({
      type: 'warning',
      icon: Users,
      title: 'Baja actividad',
      description: `Solo ${stats.current.activePercentage}% de empleados están activos`,
      action: {
        label: 'Revisar empleados',
        onClick: () => {
          // Esta acción podría filtrar por inactivos
        }
      },
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    });
  }

  // Insight contextual si está filtrado
  if (roleFilter && stats.current.total > 0) {
    const cargoName = stats.distribution.find(d => d.isHighlighted)?.cargo.name;
    insights.push({
      type: 'info',
      icon: Target,
      title: `Enfoque en ${cargoName}`,
      description: `${stats.current.total} empleado${stats.current.total > 1 ? 's' : ''} en este cargo`,
      action: {
        label: 'Agregar más',
        onClick: () => setCreatingEmployee(true)
      },
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    });
  }

  // Insight de crecimiento potencial
  if (!roleFilter && stats.current.total < 20 && stats.distribution.length > 0) {
    insights.push({
      type: 'info',
      icon: TrendingUp,
      title: 'Potencial de crecimiento',
      description: 'Considere expandir el equipo en los cargos más activos',
      action: {
        label: 'Nuevo empleado',
        onClick: () => setCreatingEmployee(true)
      },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          <span>Insights</span>
          <Badge variant="outline" className="text-xs">
            {insights.length} sugerencia{insights.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg ${insight.bgColor} border border-opacity-20`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg bg-white ${insight.color}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
                
                {insight.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={insight.action.onClick}
                    className={`text-xs ${insight.color} border-current hover:bg-white/50`}
                  >
                    {insight.action.label}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
