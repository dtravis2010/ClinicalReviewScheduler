import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AriaLiveRegion, ScreenReaderOnly } from '../../components/AriaLiveRegion';

describe('AriaLiveRegion', () => {
  it('should render with polite mode by default', () => {
    const { container } = render(<AriaLiveRegion message="Test message" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should render with assertive mode when specified', () => {
    const { container } = render(<AriaLiveRegion message="Urgent message" mode="assertive" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should have aria-atomic="true"', () => {
    const { container } = render(<AriaLiveRegion message="Test message" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('should have sr-only class for visual hiding', () => {
    const { container } = render(<AriaLiveRegion message="Test message" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should announce message after delay', async () => {
    const { container } = render(<AriaLiveRegion message="Test announcement" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    // Initially empty
    expect(liveRegion).toHaveTextContent('');
    
    // After delay, should contain message
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Test announcement');
    }, { timeout: 200 });
  });

  it('should clear and re-announce when message changes', async () => {
    const { container, rerender } = render(<AriaLiveRegion message="First message" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('First message');
    });
    
    // Change message
    rerender(<AriaLiveRegion message="Second message" />);
    
    // Should eventually show new message
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Second message');
    }, { timeout: 200 });
  });

  it('should handle empty message', () => {
    const { container } = render(<AriaLiveRegion message="" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent('');
  });

  it('should accept custom className', () => {
    const { container } = render(<AriaLiveRegion message="Test" className="custom-class" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    expect(liveRegion).toHaveClass('sr-only');
    expect(liveRegion).toHaveClass('custom-class');
  });

  it('should re-announce same message when it changes', async () => {
    const { container, rerender } = render(<AriaLiveRegion message="Same message" />);
    const liveRegion = container.querySelector('[role="status"]');
    
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Same message');
    });
    
    // Clear message - the component clears first then sets after delay
    rerender(<AriaLiveRegion message="" />);
    
    // Wait a bit for the clear to take effect
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Re-announce same message
    rerender(<AriaLiveRegion message="Same message" />);
    
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Same message');
    }, { timeout: 300 });
  });
});

describe('ScreenReaderOnly', () => {
  it('should render children with sr-only class', () => {
    const { container } = render(<ScreenReaderOnly>Hidden text</ScreenReaderOnly>);
    const element = container.firstChild;
    
    expect(element).toHaveClass('sr-only');
    expect(element).toHaveTextContent('Hidden text');
  });

  it('should render as span by default', () => {
    const { container } = render(<ScreenReaderOnly>Text</ScreenReaderOnly>);
    const element = container.firstChild;
    
    expect(element.tagName).toBe('SPAN');
  });

  it('should render as custom element when specified', () => {
    const { container } = render(<ScreenReaderOnly as="div">Text</ScreenReaderOnly>);
    const element = container.firstChild;
    
    expect(element.tagName).toBe('DIV');
  });

  it('should render complex children', () => {
    render(
      <ScreenReaderOnly>
        <span>Part 1</span>
        <span>Part 2</span>
      </ScreenReaderOnly>
    );
    
    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });
});
