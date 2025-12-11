import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScheduleDateBanner from '../../components/schedule/ScheduleDateBanner';

describe('ScheduleDateBanner', () => {
  const defaultProps = {
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    scheduleStatus: 'published',
    readOnly: true,
    onStartDateChange: vi.fn(),
    onEndDateChange: vi.fn(),
    onPreviousSchedule: vi.fn(),
    onNextSchedule: vi.fn(),
    canGoPrevious: true,
    canGoNext: true
  };

  it('should render the date range', () => {
    render(<ScheduleDateBanner {...defaultProps} />);
    
    // The component should display formatted date range
    expect(screen.getByText(/Jan 2025 - Dec 2025/i)).toBeInTheDocument();
  });

  it('should show current schedule with blue gradient', () => {
    const futureEndDate = new Date();
    futureEndDate.setFullYear(futureEndDate.getFullYear() + 1);
    const endDate = futureEndDate.toISOString().split('T')[0];
    
    const { container } = render(
      <ScheduleDateBanner {...defaultProps} endDate={endDate} />
    );
    
    // Should use header-gradient class for current/future schedules
    const header = container.querySelector('.header-gradient');
    expect(header).toBeInTheDocument();
  });

  it('should show past schedule with orange gradient', () => {
    const pastEndDate = new Date();
    pastEndDate.setFullYear(pastEndDate.getFullYear() - 1);
    const endDate = pastEndDate.toISOString().split('T')[0];
    
    const { container } = render(
      <ScheduleDateBanner {...defaultProps} endDate={endDate} />
    );
    
    // Should use header-gradient-past class for past schedules
    const header = container.querySelector('.header-gradient-past');
    expect(header).toBeInTheDocument();
  });

  it('should call onPreviousSchedule when previous button is clicked', async () => {
    const user = userEvent.setup();
    const onPreviousSchedule = vi.fn();
    
    render(
      <ScheduleDateBanner
        {...defaultProps}
        onPreviousSchedule={onPreviousSchedule}
      />
    );
    
    const prevButton = screen.getByLabelText('Previous schedule');
    await user.click(prevButton);
    
    expect(onPreviousSchedule).toHaveBeenCalledTimes(1);
  });

  it('should call onNextSchedule when next button is clicked', async () => {
    const user = userEvent.setup();
    const onNextSchedule = vi.fn();
    
    render(
      <ScheduleDateBanner
        {...defaultProps}
        onNextSchedule={onNextSchedule}
      />
    );
    
    const nextButton = screen.getByLabelText('Next schedule');
    await user.click(nextButton);
    
    expect(onNextSchedule).toHaveBeenCalledTimes(1);
  });

  it('should disable previous button when canGoPrevious is false', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        canGoPrevious={false}
      />
    );
    
    const prevButton = screen.getByLabelText('Previous schedule');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button when canGoNext is false', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        canGoNext={false}
      />
    );
    
    const nextButton = screen.getByLabelText('Next schedule');
    expect(nextButton).toBeDisabled();
  });

  it('should show date inputs in edit mode when readOnly is false', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        readOnly={false}
      />
    );
    
    const startDateInput = screen.getByLabelText('Schedule start date');
    const endDateInput = screen.getByLabelText('Schedule end date');
    
    expect(startDateInput).toBeInTheDocument();
    expect(endDateInput).toBeInTheDocument();
  });

  it('should not show date inputs when readOnly is true', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        readOnly={true}
      />
    );
    
    const startDateInput = screen.queryByLabelText('Schedule start date');
    const endDateInput = screen.queryByLabelText('Schedule end date');
    
    expect(startDateInput).not.toBeInTheDocument();
    expect(endDateInput).not.toBeInTheDocument();
  });

  it('should show LIVE status for published schedules', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        scheduleStatus="published"
      />
    );
    
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('should show DRAFT status for draft schedules', () => {
    render(
      <ScheduleDateBanner
        {...defaultProps}
        scheduleStatus="draft"
      />
    );
    
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });
});
