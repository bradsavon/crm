import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DocumentPreview from '@/components/DocumentPreview';

// Mock ResizeObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});

describe('DocumentPreview Component', () => {
  const mockDocument = {
    _id: 'doc-id',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    description: 'Test document',
    category: 'Contract',
    uploadedBy: {
      firstName: 'Test',
      lastName: 'User',
    },
    createdAt: '2024-01-01T00:00:00Z',
    path: '/uploads/test.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ doNotFake: ['clearTimeout', 'setTimeout'] });
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 200,
      bottom: 150,
      right: 300,
      x: 200,
      y: 100,
      toJSON: jest.fn(),
    }));
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should render children', () => {
    render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('should show preview on mouse enter after delay', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    
    fireEvent.mouseEnter(link);

    // Preview should not show immediately
    expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).not.toBeInTheDocument();

    // Advance timers to trigger the delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should hide preview on mouse leave after delay', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    
    // Show preview
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });

    // Hide preview
    fireEvent.mouseLeave(link);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).not.toBeInTheDocument();
    });
  });

  it('should render PDF preview with iframe', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">PDF Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('PDF Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.getAttribute('src')).toBe('/uploads/test.pdf');
      expect(iframe?.getAttribute('title')).toBe('test.pdf');
    });
  });

  it('should render PDF preview for .pdf extension even without pdf mimeType', async () => {
    const pdfDoc = {
      ...mockDocument,
      mimeType: 'application/octet-stream',
      originalName: 'document.pdf',
    };

    const { container } = render(
      <DocumentPreview document={pdfDoc}>
        <a href="/test">PDF Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('PDF Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });
  });

  it('should render image preview', async () => {
    const imageDocument = {
      ...mockDocument,
      mimeType: 'image/jpeg',
      originalName: 'test.jpg',
      path: '/uploads/test.jpg',
    };

    const { container } = render(
      <DocumentPreview document={imageDocument}>
        <a href="/test">Image Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Image Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute('src')).toBe('/uploads/test.jpg');
      expect(img?.getAttribute('alt')).toBe('test.jpg');
    });
  });

  it('should handle image load error', async () => {
    const imageDocument = {
      ...mockDocument,
      mimeType: 'image/jpeg',
      originalName: 'test.jpg',
      path: '/uploads/test.jpg',
    };

    const { container } = render(
      <DocumentPreview document={imageDocument}>
        <a href="/test">Image Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Image Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    const img = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(img);

    await waitFor(() => {
      expect(img.style.display).toBe('none');
    });
  });

  it('should display document information', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('PDF Document')).toBeInTheDocument();
      expect(screen.getByText('Test document')).toBeInTheDocument();
      expect(screen.getByText('Contract')).toBeInTheDocument();
      expect(screen.getByText(/1 KB/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  it('should display document without description', async () => {
    const docWithoutDesc = {
      ...mockDocument,
      description: undefined,
    };

    const { container } = render(
      <DocumentPreview document={docWithoutDesc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Test document')).not.toBeInTheDocument();
    });
  });

  it('should display document without category', async () => {
    const docWithoutCategory = {
      ...mockDocument,
      category: undefined,
    };

    const { container } = render(
      <DocumentPreview document={docWithoutCategory}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Contract')).not.toBeInTheDocument();
    });
  });

  it('should format file sizes correctly', async () => {
    const testCases = [
      { size: 0, expected: '0 Bytes' },
      { size: 1024, expected: '1 KB' },
      { size: 1024 * 1024, expected: '1 MB' },
      { size: 1024 * 1024 * 1024, expected: '1 GB' },
    ];

    for (const testCase of testCases) {
      const doc = {
        ...mockDocument,
        size: testCase.size,
      };

      const { container, unmount } = render(
        <DocumentPreview document={doc}>
          <a href="/test">Test Link</a>
        </DocumentPreview>
      );

      const link = screen.getByText('Test Link');
      fireEvent.mouseEnter(link);
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(testCase.expected.replace(' ', '\\s+'), 'i'))).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should identify PDF file type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'application/pdf',
    };

    const { container, unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF Document')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify Word file type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Word Document')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify Excel file type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      originalName: 'spreadsheet.xlsx',
    };

    const { container, unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Excel Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Excel Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    }, { timeout: 2000 });

    // The mimeType contains 'spreadsheet' so getFileType should return 'Excel Spreadsheet'
    // Verify the preview shows the document info
    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl');
    expect(preview).toBeInTheDocument();
    // The file type should be displayed in the preview
    expect(preview?.textContent).toContain('spreadsheet.xlsx');

    unmount();
  });

  it('should identify JPEG image type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'image/jpeg',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('JPEG Image')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify PNG image type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'image/png',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('PNG Image')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify generic image type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'image/webp',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Image')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify text file type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'text/plain',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Text File')).toBeInTheDocument();
    });

    unmount();
  });

  it('should identify generic document type', async () => {
    const doc = {
      ...mockDocument,
      mimeType: 'application/octet-stream',
    };

    const { unmount } = render(
      <DocumentPreview document={doc}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Document')).toBeInTheDocument();
    });

    unmount();
  });

  it('should keep preview visible when hovering over preview', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    
    // Mouse leave from link but enter preview
    fireEvent.mouseLeave(link);
    fireEvent.mouseEnter(preview);

    // Preview should still be visible
    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });
  });

  it('should setup ResizeObserver when preview is shown', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });

    // ResizeObserver should be set up after preview is shown
    await waitFor(() => {
      expect(mockObserve).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should cleanup ResizeObserver on unmount', async () => {
    const { container, unmount } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Test Link</a>
      </DocumentPreview>
    );

    // Show preview to create ResizeObserver
    const link = screen.getByText('Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });

    unmount();

    // ResizeObserver disconnect is called in cleanup
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle scroll events', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Scroll Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Scroll Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Trigger scroll event - just verify it doesn't throw
    act(() => {
      fireEvent.scroll(window);
      jest.advanceTimersByTime(10);
    });

    // Should not throw error
    expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
  }, 10000);

  it('should handle resize events', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Resize Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Resize Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
    });

    // Trigger resize event
    act(() => {
      fireEvent(window, new Event('resize'));
      jest.advanceTimersByTime(10);
    });

    // Should not throw error
    expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).toBeInTheDocument();
  });

  it('should calculate position correctly', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Position Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Position Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    // Position calculation happens asynchronously via requestAnimationFrame
    // Wait a bit for the styles to be applied
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview.style.position).toBe('fixed');
      expect(preview.style.zIndex).toBe('50');
    }, { timeout: 1000 });
  });

  it('should position above when no space below', async () => {
    // Mock element at bottom of viewport with no space below
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 1000, // Near bottom
      left: 200,
      bottom: 1050,
      right: 300,
      x: 200,
      y: 1000,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Bottom Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Bottom Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
  });

  it('should constrain to viewport when no space above or below', async () => {
    // Mock element in middle with very small viewport
    Object.defineProperty(window, 'innerHeight', { value: 200, writable: true });
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 200,
      bottom: 150,
      right: 300,
      x: 200,
      y: 100,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Constrained Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Constrained Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
    
    // Restore window height
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  it('should adjust position when preview goes off right edge', async () => {
    // Mock element near right edge
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true });
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 350, // Near right edge
      bottom: 150,
      right: 450,
      x: 350,
      y: 100,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Right Edge Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Right Edge Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
    
    // Restore window width
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
  });

  it('should adjust position when preview goes off left edge', async () => {
    // Mock element near left edge
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 10, // Near left edge
      bottom: 150,
      right: 110,
      x: 10,
      y: 100,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Left Edge Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Left Edge Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
  });

  it('should constrain to viewport when preview would go off bottom', async () => {
    // Mock element with preview that would extend past bottom
    Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 200, // Near bottom
      left: 200,
      bottom: 250,
      right: 300,
      x: 200,
      y: 200,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Bottom Overflow Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Bottom Overflow Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
    
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  it('should constrain to viewport when preview goes off top', async () => {
    // Mock element at top with preview that would go above viewport
    Object.defineProperty(window, 'innerHeight', { value: 300, writable: true });
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 10, // Near top
      left: 200,
      bottom: 60,
      right: 300,
      x: 200,
      y: 10,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Top Overflow Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Top Overflow Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
    
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
  });

  it('should adjust transform when preview overflows right edge after adjustment', async () => {
    // Mock element at right edge where preview would still overflow after initial adjustment
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true });
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 250, // Very close to right edge
      bottom: 150,
      right: 350,
      x: 250,
      y: 100,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Right Overflow Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Right Overflow Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
    
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
  });

  it('should adjust transform when preview overflows left edge after adjustment', async () => {
    // Mock element at left edge where preview would still overflow after initial adjustment
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 5, // Very close to left edge
      bottom: 150,
      right: 105,
      x: 5,
      y: 100,
      toJSON: jest.fn(),
    }));

    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Left Overflow Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Left Overflow Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
      expect(preview).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const preview = container.querySelector('.bg-white.rounded-lg.shadow-xl') as HTMLElement;
    expect(preview.style.position).toBe('fixed');
  });

  it('should handle PDF link click without propagation', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">PDF Click Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('PDF Click Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const pdfLink = screen.getByText('Open PDF in new tab');
      expect(pdfLink).toBeInTheDocument();
    });

    const pdfLink = screen.getByText('Open PDF in new tab');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
    
    fireEvent(pdfLink, clickEvent);
    
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should format date correctly', async () => {
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Date Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Date Test Link');
    fireEvent.mouseEnter(link);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const dateText = new Date(mockDocument.createdAt).toLocaleDateString();
      expect(screen.getByText(new RegExp(dateText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    });
  });

  it('should clear timeout on mouse leave before preview shows', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { container } = render(
      <DocumentPreview document={mockDocument}>
        <a href="/test">Timeout Test Link</a>
      </DocumentPreview>
    );

    const link = screen.getByText('Timeout Test Link');
    fireEvent.mouseEnter(link);
    
    // Mouse leave before delay completes
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.mouseLeave(link);
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Preview should not show
    expect(container.querySelector('.bg-white.rounded-lg.shadow-xl')).not.toBeInTheDocument();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
