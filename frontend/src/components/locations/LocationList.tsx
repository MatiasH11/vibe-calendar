/**
 * LocationList Component
 * Displays list of locations with filtering and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useLocation, formatLocationAddress } from '@/hooks/useLocation';
import { Location } from '@/api/locationApi';

interface LocationListProps {
  showInactive?: boolean;
  onLocationSelect?: (location: Location) => void;
}

export function LocationList({
  showInactive = false,
  onLocationSelect,
}: LocationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    items: locations,
    isLoading,
    error,
    loadAll,
    search,
  } = useLocation({
    onError: (err) => {
      console.error('Location error:', err.message);
    },
  });

  // Load locations on mount and when filters change
  useEffect(() => {
    const loadLocations = async () => {
      const filters: any = {};

      if (!showInactive) {
        filters.is_active = 'true';
      }

      await loadAll(filters);
    };

    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, reload all locations
      await loadAll({
        is_active: showInactive ? undefined : 'true',
      });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    await search(query, {
      is_active: showInactive ? undefined : 'true',
    });
    setIsSearching(false);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error loading locations: {error.message}</p>
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
          placeholder="Search locations by name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Location List */}
      {!isLoading && !isSearching && (
        <>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No locations found matching your search' : 'No locations found'}
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
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr
                      key={location.id}
                      onClick={() => onLocationSelect?.(location)}
                      className={`
                        transition-colors duration-150
                        ${onLocationSelect ? 'cursor-pointer hover:bg-blue-50' : ''}
                        ${!location.is_active ? 'opacity-60' : ''}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{location.address || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{location.city || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{location.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              location.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          `}
                        >
                          {location.is_active ? 'Active' : 'Inactive'}
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
      {!isLoading && !isSearching && locations.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {locations.length} location{locations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
