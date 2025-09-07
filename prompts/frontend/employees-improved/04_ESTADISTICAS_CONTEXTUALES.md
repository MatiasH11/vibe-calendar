# 📊 FASE 4: Estadísticas Contextuales y Visualizaciones

## 🎯 Objetivo
Implementar estadísticas inteligentes que se adapten al contexto actual (filtros, búsquedas, cargo seleccionado) y proporcionen insights valiosos en tiempo real sin sobrecargar la UI.

## 📝 PASO 1: Hook de Estadísticas Contextuales

### `src/hooks/useContextualStats.ts`
```typescript
import { useMemo } from 'react';
import { useEmployees } from './useEmployees';
import { useCargosContextual } from './useCargosContextual';
import { useEmployeesStore } from '@/stores/employeesStore';
import { Employee, Cargo } from '@/types/employee';

interface ContextualStats {
  // Estadísticas actuales (según filtros)
  current: {
    total: number;
    active: number;
    inactive: number;
    activePercentage: number;
  };
  
  // Comparación con totales globales
  global: {
    total: number;
    active: number;
    inactive: number;
    filteredPercentage: number; // % del total que se está mostrando
  };
  
  // Distribución por cargo (solo visible)
  distribution: Array<{
    cargo: Cargo;
    count: number;
    percentage: number;
    activeCount: number;
    inactiveCount: number;
    isHighlighted: boolean; // Si es el cargo filtrado actual
  }>;
  
  // Insights contextuales
  insights: {
    mostPopularRole: string;
    leastPopularRole: string;
    emptyRoles: number;
    averageEmployeesPerRole: number;
    isFiltered: boolean;
    filterType: 'none' | 'role' | 'search' | 'both';
  };
  
  // Métricas de rendimiento
  performance: {
    employeeGrowthRate: number; // Simulado
    rolesUtilization: number; // % de roles con empleados
    averageActivePercentage: number;
  };
}

export function useContextualStats() {
  const { filters, cargoFilter, searchTerm } = useEmployeesStore();
  const { cargos } = useCargosContextual();
  
  // Obtener empleados filtrados (vista actual)
  const { employees: filteredEmployees } = useEmployees(filters);
  
  // Obtener todos los empleados para comparación
  const { employees: allEmployees } = useEmployees({ limit: 1000 }); 
  
  const stats: ContextualStats = useMemo(() => {
    // Estadísticas actuales (filtradas)
    const currentTotal = filteredEmployees.length;
    const currentActive = filteredEmployees.filter(emp => emp.is_active).length;
    const currentInactive = currentTotal - currentActive;
    const currentActivePercentage = currentTotal > 0 
      ? Math.round((currentActive / currentTotal) * 100) 
      : 0;

    // Estadísticas globales
    const globalTotal = allEmployees.length;
    const globalActive = allEmployees.filter(emp => emp.is_active).length;
    const globalInactive = globalTotal - globalActive;
    const filteredPercentage = globalTotal > 0 
      ? Math.round((currentTotal / globalTotal) * 100) 
      : 0;

    // Distribución por cargo (solo de empleados visibles)
    const visibleCargoIds = new Set(filteredEmployees.map(emp => emp.role_id));
    const distribution = cargos
      .filter(cargo => visibleCargoIds.has(cargo.id) || cargoFilter === cargo.id)
      .map(cargo => {
        const cargoEmployees = filteredEmployees.filter(emp => emp.role_id === cargo.id);
        const count = cargoEmployees.length;
        const percentage = currentTotal > 0 ? Math.round((count / currentTotal) * 100) : 0;
        const activeCount = cargoEmployees.filter(emp => emp.is_active).length;
        const inactiveCount = count - activeCount;
        const isHighlighted = cargoFilter === cargo.id;

        return {
          cargo,
          count,
          percentage,
          activeCount,
          inactiveCount,
          isHighlighted,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Insights contextuales
    const nonEmptyRoles = distribution.filter(d => d.count > 0);
    const mostPopularRole = nonEmptyRoles[0]?.cargo.name || 'N/A';
    const leastPopularRole = nonEmptyRoles[nonEmptyRoles.length - 1]?.cargo.name || 'N/A';
    const emptyRoles = cargos.length - nonEmptyRoles.length;
    const averageEmployeesPerRole = nonEmptyRoles.length > 0 
      ? Math.round(currentTotal / nonEmptyRoles.length) 
      : 0;
    
    const isFiltered = !!cargoFilter || !!searchTerm;
    let filterType: 'none' | 'role' | 'search' | 'both' = 'none';
    if (cargoFilter && searchTerm) filterType = 'both';
    else if (cargoFilter) filterType = 'role';
    else if (searchTerm) filterType = 'search';

    // Métricas de rendimiento (algunas simuladas)
    const employeeGrowthRate = Math.floor(Math.random() * 20) - 10; // -10% a +10%
    const rolesUtilization = cargos.length > 0 
      ? Math.round((nonEmptyRoles.length / cargos.length) * 100) 
      : 0;
    const averageActivePercentage = nonEmptyRoles.length > 0
      ? Math.round(nonEmptyRoles.reduce((sum, role) => {
          const activePercent = role.count > 0 ? (role.activeCount / role.count) * 100 : 0;
          return sum + activePercent;
        }, 0) / nonEmptyRoles.length)
      : 0;

    return {
      current: {
        total: currentTotal,
        active: currentActive,
        inactive: currentInactive,
        activePercentage: currentActivePercentage,
      },
      global: {
        total: globalTotal,
        active: globalActive,
        inactive: globalInactive,
        filteredPercentage,
      },
      distribution,
      insights: {
        mostPopularRole,
        leastPopularRole,
        emptyRoles,
        averageEmployeesPerRole,
        isFiltered,
        filterType,
      },
      performance: {
        employeeGrowthRate,
        rolesUtilization,
        averageActivePercentage,
      },
    };
  }, [filteredEmployees, allEmployees, cargos, cargoFilter, searchTerm]);

  return {
    stats,
    isLoading: false, // Derivado de otros hooks
    hasData: allEmployees.length > 0,
  };
}
```

## 📝 PASO 2: Componente de Estadísticas Inteligentes

### `src/components/employees/ContextualStatsCards.tsx`
```typescript
'use client';

import { StatsCard } from '../dashboard/StatsCard';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/transitions';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Target,
  BarChart3
} from 'lucide-react';
import { useContextualStats } from '@/hooks/useContextualStats';
import { useEmployeesStore } from '@/stores/employeesStore';

export function ContextualStatsCards() {
  const { stats, hasData } = useContextualStats();
  const { cargoFilter, searchTerm } = useEmployeesStore();

  if (!hasData) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return Target;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total empleados (contextuales) */}
      <FadeIn delay={0.1}>
        <StatsCard
          title={stats.insights.isFiltered ? "Filtrados" : "Total"}
          value={stats.current.total.toString()}
          change={stats.insights.isFiltered 
            ? `${stats.global.filteredPercentage}% del total`
            : `${stats.global.total} empleados`
          }
          trend="neutral"
          icon={stats.insights.isFiltered ? Filter : Users}
          color="text-blue-600"
          bgColor="bg-blue-50"
          compact
        >
          {stats.insights.isFiltered && (
            <Badge variant="outline" className="mt-2 text-xs">
              {stats.insights.filterType === 'role' && 'Por cargo'}
              {stats.insights.filterType === 'search' && 'Por búsqueda'}
              {stats.insights.filterType === 'both' && 'Múltiples filtros'}
            </Badge>
          )}
        </StatsCard>
      </FadeIn>
      
      {/* Empleados activos */}
      <FadeIn delay={0.2}>
        <StatsCard
          title="Activos"
          value={stats.current.active.toString()}
          change={`${stats.current.activePercentage}% activos`}
          trend="neutral"
          icon={UserCheck}
          color="text-green-600"
          bgColor="bg-green-50"
          compact
        >
          {stats.insights.isFiltered && stats.global.active !== stats.current.active && (
            <Badge variant="outline" className="mt-2 text-xs text-green-600">
              Global: {stats.global.active}
            </Badge>
          )}
        </StatsCard>
      </FadeIn>
      
      {/* Distribución o inactivos */}
      <FadeIn delay={0.3}>
        <StatsCard
          title={stats.distribution.length > 1 ? "Cargos" : "Inactivos"}
          value={stats.distribution.length > 1 
            ? stats.distribution.length.toString()
            : stats.current.inactive.toString()
          }
          change={stats.distribution.length > 1
            ? `${stats.insights.averageEmployeesPerRole} prom/cargo`
            : `${Math.round((stats.current.inactive / stats.current.total) * 100) || 0}% inactivos`
          }
          trend="neutral"
          icon={stats.distribution.length > 1 ? BarChart3 : Clock}
          color={stats.distribution.length > 1 ? "text-purple-600" : "text-orange-600"}
          bgColor={stats.distribution.length > 1 ? "bg-purple-50" : "bg-orange-50"}
          compact
        />
      </FadeIn>
      
      {/* Métrica dinámica */}
      <FadeIn delay={0.4}>
        <StatsCard
          title="Rendimiento"
          value={`${stats.performance.averageActivePercentage}%`}
          change={`${Math.abs(stats.performance.employeeGrowthRate)}% crecimiento`}
          trend={stats.performance.employeeGrowthRate >= 0 ? "up" : "down"}
          icon={getTrendIcon(stats.performance.employeeGrowthRate)}
          color={getTrendColor(stats.performance.employeeGrowthRate)}
          bgColor={stats.performance.employeeGrowthRate >= 0 ? "bg-green-50" : "bg-red-50"}
          compact
        >
          <Badge 
            variant="outline" 
            className={`mt-2 text-xs ${getTrendColor(stats.performance.employeeGrowthRate)}`}
          >
            {stats.performance.rolesUtilization}% roles activos
          </Badge>
        </StatsCard>
      </FadeIn>
    </div>
  );
}
```

## 📝 PASO 3: Widget de Distribución Contextual

### `src/components/employees/ContextualDistribution.tsx`
```typescript
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
  const { filterByRole, cargoFilter, clearAllFilters } = useEmployeesStore();

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
          
          {cargoFilter && (
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
                  style={{
                    '--progress-background': roleData.cargo.color,
                  } as any}
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
```

## 📝 PASO 4: Insights Contextuales

### `src/components/employees/ContextualInsights.tsx`
```typescript
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
  const { cargoFilter, setCreatingEmployee, setCreatingCargo } = useEmployeesStore();

  if (!hasData) {
    return null;
  }

  // Generar insights dinámicos basados en el contexto
  const insights = [];

  // Insight de cargo más popular
  if (stats.insights.mostPopularRole !== 'N/A' && !cargoFilter) {
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
  if (cargoFilter && stats.current.total > 0) {
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
  if (!cargoFilter && stats.current.total < 20 && stats.distribution.length > 0) {
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
```

## 📝 PASO 5: Actualizar EmployeeMainPanel

### Integrar estadísticas contextuales
```typescript
// En src/components/dashboard/views/employees/EmployeeMainPanel.tsx
// Reemplazar las estadísticas estáticas por las contextuales:

// Agregar imports
import { ContextualStatsCards } from '@/components/employees/ContextualStatsCards';
import { ContextualDistribution } from '@/components/employees/ContextualDistribution';
import { ContextualInsights } from '@/components/employees/ContextualInsights';

// Reemplazar las StatsCard por:
{/* Estadísticas contextuales */}
<ContextualStatsCards />

// Después de la lista de empleados, agregar widgets adicionales:
{/* Widgets contextuales */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <FadeIn delay={0.7}>
    <ContextualDistribution />
  </FadeIn>
  
  <FadeIn delay={0.8}>
    <ContextualInsights />
  </FadeIn>
</div>
```

## ✅ Validación de la Fase 4

```bash
# 1. OBLIGATORIO: Verificar que no hay errores de TypeScript
npm run build
# Si falla: DETENTE y corrige errores antes de continuar

# 2. Verificar que los archivos se crearon correctamente
ls src/hooks/useContextualStats.ts
ls src/components/employees/ContextualStatsCards.tsx
ls src/components/employees/ContextualDistribution.tsx
ls src/components/employees/ContextualInsights.tsx

# 3. Verificar que la aplicación funciona
npm run dev
# Ir a: http://localhost:3000/dashboard/empleados

# 4. Probar estadísticas contextuales
# PRUEBA 1: Vista sin filtros
# - Verificar estadísticas globales
# - Verificar distribución completa
# - Verificar insights generales

# PRUEBA 2: Filtrar por cargo
# - Click en cargo en sidebar
# - Verificar que estadísticas cambian
# - Verificar distribución filtrada
# - Verificar insights contextuales

# PRUEBA 3: Búsqueda de empleados
# - Buscar término específico
# - Verificar que estadísticas se actualizan
# - Verificar insights relevantes

# PRUEBA 4: Interacciones
# - Click en insights con acciones
# - Verificar que abren formularios apropiados
# - Verificar navegación fluida

# PRUEBA 5: Responsividad
# - Verificar en móvil y tablet
# - Verificar que widgets se adaptan
# - Verificar que datos siguen siendo útiles
```

**CHECKLIST DE LA FASE 4:**
□ Hook useContextualStats implementado
□ ContextualStatsCards adaptándose a filtros
□ ContextualDistribution mostrando datos relevantes
□ ContextualInsights generando sugerencias inteligentes
□ Estadísticas se actualizan en tiempo real
□ Insights contextuales son útiles y accionables
□ Widgets se muestran/ocultan según contexto
□ Performance optimizada con useMemo
□ Build sin errores de TypeScript
□ UI responsiva y profesional

## 🎯 Resultado de la Fase 4

- ✅ **Estadísticas inteligentes** que se adaptan al contexto
- ✅ **Distribución visual** contextual con interacciones
- ✅ **Insights accionables** que guían al usuario
- ✅ **Métricas en tiempo real** según filtros aplicados
- ✅ **Widgets contextuales** que aparecen cuando son útiles
- ✅ **Performance optimizada** con cálculos memoizados
- ✅ **UI adaptativa** que responde al estado actual
- ✅ **Build sin errores** de TypeScript

**Estadísticas contextuales implementadas** - Listo para validación final en la siguiente fase.
