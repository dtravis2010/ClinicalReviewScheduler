import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import BulkAssignmentModal from '../../components/schedule/BulkAssignmentModal';
import { employeeArbitrary, entityArbitrary } from '../helpers/generators';

describe('BulkAssignmentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnApply = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    selectedEmployees: new Set(['emp1', 'emp2']),
    employees: [
      { id: 'emp1', name: 'John Doe', skills: ['DAR', 'CPOE'] },
      { id: 'emp2', name: 'Jane Smith', skills: ['Trace'] },
      { id: 'emp3', name: 'Bob Johnson', skills: ['Float'] }
    ],
    entities: [
      { id: 'ent1', name: 'Entity A' },
      { id: 'ent2', name: 'Entity B' }
    ],
    darColumns: ['DAR 1', 'DAR 2', 'DAR 3'],
    onApply: mockOnApply
  };

  it('should render when open', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByText('Bulk Assignment')).toBeInTheDocument();
    expect(screen.getByText(/Assign 2 employee/)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<BulkAssignmentModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Bulk Assignment')).not.toBeInTheDocument();
  });

  it('should show assignment type options', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const select = screen.getByLabelText('Assignment Type');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('dar');
  });

  it('should show DAR column selection for DAR type', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    expect(screen.getByLabelText('DAR Column')).toBeInTheDocument();
  });

  it('should show entity selection for non-DAR types', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText('Assignment Type');
    fireEvent.change(typeSelect, { target: { value: 'newIncoming' } });
    expect(screen.getByText('Select Entities')).toBeInTheDocument();
  });

  it('should generate preview on button click', async () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const previewButton = screen.getByText('Preview Assignments');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/Successful/)).toBeInTheDocument();
    });
  });

  it('should validate DAR skill requirements', async () => {
    const props = {
      ...defaultProps,
      selectedEmployees: new Set(['emp3']), // Bob has only Float skill
      employees: [
        { id: 'emp3', name: 'Bob Johnson', skills: ['Float'] }
      ]
    };

    render(<BulkAssignmentModal {...props} />);
    const previewButton = screen.getByText('Preview Assignments');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed/)).toBeInTheDocument();
      expect(screen.getByText(/does not have DAR\/Trace skill/)).toBeInTheDocument();
    });
  });

  it('should validate CPOE skill requirements', async () => {
    const props = {
      ...defaultProps,
      selectedEmployees: new Set(['emp2']), // Jane has only Trace skill
      employees: [
        { id: 'emp2', name: 'Jane Smith', skills: ['Trace'] }
      ]
    };

    render(<BulkAssignmentModal {...props} />);
    const typeSelect = screen.getByLabelText('Assignment Type');
    fireEvent.change(typeSelect, { target: { value: 'cpoe' } });
    
    const previewButton = screen.getByText('Preview Assignments');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed/)).toBeInTheDocument();
      expect(screen.getByText(/does not have CPOE skill/)).toBeInTheDocument();
    });
  });

  it('should call onApply with successful assignments', async () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const previewButton = screen.getByText('Preview Assignments');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/Successful/)).toBeInTheDocument();
    });

    const applyButton = screen.getByText('Apply Assignments');
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'emp1',
          type: 'dar',
          darIndex: 0
        }),
        expect.objectContaining({
          employeeId: 'emp2',
          type: 'dar',
          darIndex: 0
        })
      ])
    );
  });

  it('should call onClose when cancel is clicked', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable apply button when no preview', () => {
    render(<BulkAssignmentModal {...defaultProps} />);
    const applyButton = screen.getByText('Apply Assignments');
    expect(applyButton).toBeDisabled();
  });

  /**
   * Property 31: Bulk assignment validation
   * Validates: Requirements 14.3
   * 
   * For any set of employees and assignment type, when bulk assignment is applied,
   * each employee should be validated individually against skill requirements
   */
  it('Property 31: should validate each employee individually', () => {
    fc.assert(
      fc.property(
        fc.array(employeeArbitrary, { minLength: 1, maxLength: 10 }),
        fc.constantFrom('dar', 'cpoe', 'newIncoming', 'crossTraining', 'specialProjects'),
        (employees, assignmentType) => {
          const selectedIds = new Set(employees.map(e => e.id));
          const props = {
            ...defaultProps,
            selectedEmployees: selectedIds,
            employees,
            entities: [{ id: 'ent1', name: 'Entity A' }]
          };

          const { unmount } = render(<BulkAssignmentModal {...props} />);
          
          // Change assignment type
          const typeSelect = screen.getByLabelText('Assignment Type');
          fireEvent.change(typeSelect, { target: { value: assignmentType } });

          // For entity-based assignments, select an entity
          if (['newIncoming', 'crossTraining', 'specialProjects'].includes(assignmentType)) {
            const entityCheckbox = screen.getByLabelText('Entity A');
            fireEvent.click(entityCheckbox);
          }

          // Generate preview
          const previewButton = screen.getByText('Preview Assignments');
          fireEvent.click(previewButton);

          // Check that results are shown
          const hasSuccessful = screen.queryByText(/Successful/);
          const hasFailed = screen.queryByText(/Failed/);

          // At least one result section should be present
          const hasResults = hasSuccessful || hasFailed;
          
          unmount();
          return hasResults !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 32: Bulk assignment result completeness
   * Validates: Requirements 14.4, 14.5
   * 
   * For any bulk assignment operation, the results should account for all selected employees
   * (either in successful or failed lists)
   */
  it('Property 32: should account for all selected employees in results', () => {
    fc.assert(
      fc.property(
        fc.array(employeeArbitrary, { minLength: 1, maxLength: 10 }),
        (employees) => {
          const selectedIds = new Set(employees.map(e => e.id));
          const props = {
            ...defaultProps,
            selectedEmployees: selectedIds,
            employees,
            entities: [{ id: 'ent1', name: 'Entity A' }]
          };

          const { unmount } = render(<BulkAssignmentModal {...props} />);
          
          // Generate preview
          const previewButton = screen.getByText('Preview Assignments');
          fireEvent.click(previewButton);

          // Count successful and failed employees
          const successfulSection = screen.queryByText(/Successful \((\d+)\)/);
          const failedSection = screen.queryByText(/Failed \((\d+)\)/);

          let successCount = 0;
          let failCount = 0;

          if (successfulSection) {
            const match = successfulSection.textContent.match(/Successful \((\d+)\)/);
            successCount = match ? parseInt(match[1]) : 0;
          }

          if (failedSection) {
            const match = failedSection.textContent.match(/Failed \((\d+)\)/);
            failCount = match ? parseInt(match[1]) : 0;
          }

          const totalProcessed = successCount + failCount;
          
          unmount();
          
          // Total processed should equal selected employees
          return totalProcessed === employees.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});
