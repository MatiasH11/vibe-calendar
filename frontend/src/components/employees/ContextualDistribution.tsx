'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useContextualStats } from '@/hooks/useContextualStats';
import { useEmployeesStore } from '@/stores/employeesStore';
import { BarChart3, Users, Eye, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ContextualDistribution() {
  const { stats, hasData } = useContextualStats();
  const { filterByRole, roleFilter, clearAllFilters } = useEmployeesStore();

  if (!hasData || stats.distribution.length === 0) {
    return null; // No mostrar si no hay datos de distribución
  }

  // Solo mostrar si hay distribución interesante o está filtrado
  const shouldShow = stats.distribution.length > 1 || stats.insights.isFiltered;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Distribución por Cargo</span>
            {stats.insights.isFiltered && (
              <Badge variant="outline" className="text-xs">
                Vista filtrada
              </Badge>
            )}
          </CardTitle>
          
          {roleFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              Ver todos
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <AnimatePresence>
          {stats.distribution.map((roleData, index) => (
            <motion.div
              key={roleData.cargo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                roleData.isHighlighted 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!roleData.isHighlighted) {
                  filterByRole(roleData.cargo.id);
                }
              }}
            >
              {/* Header del cargo */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: roleData.cargo.color }}
                  />
                  <span className={`font-medium truncate ${
                    roleData.isHighlighted ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {roleData.cargo.name}
                  </span>
                  {roleData.isHighlighted && (
                    <Badge variant="default" className="text-xs">
                      Seleccionado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {roleData.count} empleado{roleData.count !== 1 ? 's' : ''}
                  </Badge>
                  <span className="text-sm font-medium text-gray-600">
                    {roleData.percentage}%
                  </span>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="mb-2">
                <Progress 
                  value={roleData.percentage} 
                  className="h-2"
                />
              </div>
              
              {/* Detalles adicionales */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">
                    ✓ {roleData.activeCount} activos
                  </span>
                  {roleData.inactiveCount > 0 && (
                    <span className="text-orange-600">
                      ○ {roleData.inactiveCount} inactivos
                    </span>
                  )}
                </div>
                
                {!roleData.isHighlighted && roleData.count > 0 && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Eye className="w-3 h-3" />
                    <span>Filtrar</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Resumen global si está filtrado */}
        {stats.insights.isFiltered && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Vista filtrada</span>
              </div>
              <div className="text-gray-600">
                Mostrando {stats.current.total} de {stats.global.total} empleados
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
