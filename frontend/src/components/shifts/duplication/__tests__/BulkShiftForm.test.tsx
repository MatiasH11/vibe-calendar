import React from 'react';
import { render, screen } from '@testing-library/react';
import { BulkShiftForm } from '../BulkShiftForm';
import { EmployeeWithShifts } from '@/types/shifts/employee';

// Mock the API service
jest.mock('@/lib/shifts', () => ({
  shiftsApiService: {
    previewBulkShifts: jest.fn().mockResolvedValue({
      total_shifts: 0,
      shifts_to_create: [],
      conflicts: [],
      warnings: []
    })
  }
}));

// Mock the template hook
jest.mock('@/hooks/shifts/useShiftTemplates', () => ({
  useShiftTemplates: () => ({
    templates: [],
    isLoading: false,
    useTemplate: jest.fn()
  })
}));

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

describe('BulkShiftForm', () => {
  const mockProps = {
    employees: mockEmployees,
    onSubmit: jest.fn(),
    onPreview: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false
  };

  it('renders without crashing', () => {
    render(<BulkShiftForm {...mockProps} />);
    expect(screen.getByText('Select Employees')).toBeInTheDocument();
    expect(screen.getByText('Select Dates')).toBeInTheDocument();
    expect(screen.getByText('Shift Times')).toBeInTheDocument();
  });

  it('shows quick date selection buttons', () => {
    render(<BulkShiftForm {...mockProps} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('Next 7 Days')).toBeInTheDocument();
  });

  it('displays time input fields', () => {
    render(<BulkShiftForm {...mockProps} />);
    expect(screen.getByLabelText('Start Time *')).toBeInTheDocument();
    expect(screen.getByLabelText('End Time *')).toBeInTheDocument();
  });
});