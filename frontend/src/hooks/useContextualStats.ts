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
  const { filters, roleFilter, searchTerm } = useEmployeesStore();
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
      .filter(cargo => visibleCargoIds.has(cargo.id) || roleFilter === cargo.id)
      .map(cargo => {
        const cargoEmployees = filteredEmployees.filter(emp => emp.role_id === cargo.id);
        const count = cargoEmployees.length;
        const percentage = currentTotal > 0 ? Math.round((count / currentTotal) * 100) : 0;
        const activeCount = cargoEmployees.filter(emp => emp.is_active).length;
        const inactiveCount = count - activeCount;
        const isHighlighted = roleFilter === cargo.id;

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
    
    const isFiltered = !!roleFilter || !!searchTerm;
    let filterType: 'none' | 'role' | 'search' | 'both' = 'none';
    if (roleFilter && searchTerm) filterType = 'both';
    else if (roleFilter) filterType = 'role';
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
  }, [filteredEmployees, allEmployees, cargos, roleFilter, searchTerm]);

  return {
    stats,
    isLoading: false, // Derivado de otros hooks
    hasData: allEmployees.length > 0,
  };
}
