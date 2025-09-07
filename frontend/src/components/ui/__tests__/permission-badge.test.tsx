import { render, screen } from '@testing-library/react';
import { PermissionBadge } from '../permission-badge';

describe('PermissionBadge', () => {
  it('should render admin badge correctly', () => {
    render(<PermissionBadge userType="admin" />);
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('🔑')).toBeInTheDocument();
  });

  it('should render employee badge correctly', () => {
    render(<PermissionBadge userType="employee" />);
    
    expect(screen.getByText('Empleado')).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PermissionBadge userType="admin" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
