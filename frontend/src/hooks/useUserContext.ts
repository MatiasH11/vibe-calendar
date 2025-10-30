import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api';
import { Employee } from '@/types/employee';

export function useUserContext() {
  const { user, isAuthenticated } = useAuth();
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setEmployeeData(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getEmployee(user.employee_id);
      if (response.success && response.data) {
        setEmployeeData(response.data);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const getUserFullName = (): string => {
    if (employeeData) {
      return `${employeeData.user.first_name} ${employeeData.user.last_name}`;
    }
    return user ? 'Usuario' : '';
  };

  const getUserDisplayName = (): string => {
    if (employeeData) {
      return `${employeeData.user.first_name} ${employeeData.user.last_name}`;
    }
    return user ? 'Usuario' : '';
  };

  const getUserRoleDisplay = (): string => {
    if (employeeData) {
      return `${employeeData.department.name} - ${employeeData.position}`;
    }
    return user?.role_name || '';
  };

  return {
    user,
    employeeData,
    isLoading,
    isAuthenticated,
    getUserFullName,
    getUserDisplayName,
    getUserRoleDisplay,
    refreshEmployeeData: fetchEmployeeData,
  };
}
