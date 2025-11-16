/**
 * EmployeeList Component
 * Displays list of employees with filtering and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useEmployee, getEmployeeFullName } from '@/hooks/useEmployee';
import { Employee } from '@/api/employeeApi';
import { EmployeeCard } from './EmployeeCard';

interface EmployeeListProps {
  locationId?: number;
  departmentId?: number;
  showInactive?: boolean;
  onEmployeeSelect?: (employee: Employee) => void;
}

export function EmployeeList({
  locationId,
  departmentId,
  showInactive = false,
  onEmployeeSelect,
}: EmployeeListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    items: employees,
    isLoading,
    error,
    loadAll,
    search,
    getByLocation,
  } = useEmployee({
    onError: (err) => {
      console.error('Employee error:', err.message);
    },
  });

  // Load employees on mount and when filters change
  useEffect(() => {
    const loadEmployees = async () => {
      const filters: any = {};

      if (!showInactive) {
        filters.is_active = 'true';
      }

      if (locationId) {
        await getByLocation(locationId, filters);
      } else {
        await loadAll(filters);
      }
    };

    loadEmployees();
  }, [locationId, showInactive]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, reload all employees
      await loadAll({
        is_active: showInactive ? undefined : 'true',
      });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    await search(query, {
      is_active: showInactive ? undefined : 'true',
      location_id: locationId ? String(locationId) : undefined,
    });
    setIsSearching(false);
  };

  // Filter by department if specified (client-side filter)
  const filteredEmployees = departmentId
    ? employees.filter((emp) => emp.department_id === departmentId)
    : employees;

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error loading employees: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search employees by name or position..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Employee List */}
      {!isLoading && !isSearching && (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No employees found matching your search' : 'No employees found'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onClick={() => onEmployeeSelect?.(employee)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {!isLoading && !isSearching && filteredEmployees.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
