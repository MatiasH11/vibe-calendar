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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => onEmployeeSelect?.(employee)}
                      className={`
                        transition-colors duration-150
                        ${onEmployeeSelect ? 'cursor-pointer hover:bg-blue-50' : ''}
                        ${!employee.is_active ? 'opacity-60' : ''}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEmployeeFullName(employee)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{employee.user?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {employee.job_position?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {employee.department?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {employee.location?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              employee.user?.user_type === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : employee.user?.user_type === 'ADMIN'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          `}
                        >
                          {employee.user?.user_type || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              employee.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          `}
                        >
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
