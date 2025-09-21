import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShiftDuplicator } from '../ShiftDuplicator';
import { Shift } from '@/types/shifts/shift';
import { EmployeeWithShifts } from '@/types/shifts/employee';

// Mock the API service
jest.mock('@/lib/shifts', () => ({
  shiftsApiService: {
    validateConflicts: jest.fn().mockResolvedValue({ conflicts: [], has_conflicts: false }),
    duplicateShifts: jest.fn().mockResolvedValue([])
  }
}));

const mockShift: Shift = {
  id: 1,
  company_employee_id: 1,
  shift_date: '2024-01-15',
  start_time: '09:00',
  end_time: '17:00',
  notes: 'Test shift',
  status: 'confirmed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  company_employee: {
    id: 1,
    company_id: 1,
    user_id: 1,
    role_id: 1,
    position: 'Developer',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }
};

const mockEmployees: EmployeeWithShifts[] = [
  {
    id: 1,
    company_id: 1,
    user_id: 1,
    role_id: 1,
    position: 'Developer',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    role: {
      id: 1,
      company_id: 1,
      name: 'Developer',
      color: '#blue',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    shifts: []
  }
];

describe('ShiftDuplicator', () => {
  const mockProps = {
    sourceShift: mockShift,
    employees: mockEmployees,
    onDuplicate: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false
  };

  it('renders without crashing', () => {
    render(<ShiftDuplicator {...mockProps} />);
    expect(screen.getByText('Duplicate Shift')).toBeInTheDocument();
  });

  it('displays source shift information', () => {
    render(<ShiftDuplicator {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument();
  });

  it('shows duplication target options', () => {
    render(<ShiftDuplicator {...mockProps} />);
    expect(screen.getByText('To Other Dates')).toBeInTheDocument();
    expect(screen.getByText('To Other Employees')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });
});