import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DocumentList from '@/components/DocumentList';

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock window.alert
global.alert = jest.fn();

// Mock DocumentPreview
jest.mock('@/components/DocumentPreview', () => {
  return function MockDocumentPreview({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

describe('DocumentList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display documents when loaded', async () => {
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should display empty state when no documents', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no documents attached/i)).toBeInTheDocument();
    });
  });

  it('should handle delete action', async () => {
    const mockOnDelete = jest.fn();
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDocuments }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Find delete button by title attribute
    const deleteButton = screen.getByTitle(/delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/documents/1', {
        method: 'DELETE',
      });
    });
  });

  it('should not delete if user cancels confirmation', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle(/delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });

    // Should not have called DELETE endpoint
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
  });

  it('should handle fetch error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no documents attached/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });


  it('should refresh when refreshTrigger changes', async () => {
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    const { rerender } = render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        refreshTrigger={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change refreshTrigger
    rerender(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        refreshTrigger={2}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should display documents with category and description', async () => {
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        description: 'Test description',
        category: 'Contract',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Contract')).toBeInTheDocument();
    });
  });

  it('should display different file icons for different mime types', async () => {
    const mockDocuments = [
      {
        _id: '1',
        filename: 'test.docx',
        originalName: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        path: '/uploads/test.docx',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        _id: '2',
        filename: 'test.xlsx',
        originalName: 'test.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 2048,
        path: '/uploads/test.xlsx',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        _id: '3',
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 3072,
        path: '/uploads/test.jpg',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    const { container } = render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.docx')).toBeInTheDocument();
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Check that file icons are rendered (they should be in the DOM)
    const icons = container.querySelectorAll('span.text-2xl');
    expect(icons.length).toBe(3);
  });

  it('should format file sizes correctly', async () => {
    const mockDocuments = [
      {
        _id: '1',
        filename: 'small.txt',
        originalName: 'small.txt',
        mimeType: 'text/plain',
        size: 0,
        path: '/uploads/small.txt',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        _id: '2',
        filename: 'medium.pdf',
        originalName: 'medium.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1 MB
        path: '/uploads/medium.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        _id: '3',
        filename: 'large.pdf',
        originalName: 'large.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024 * 1024, // 1 GB
        path: '/uploads/large.pdf',
        uploadedBy: {
          _id: 'user-id',
          firstName: 'Test',
          lastName: 'User',
        },
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockDocuments }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/0 Bytes/i)).toBeInTheDocument();
      expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
      expect(screen.getByText(/1 GB/i)).toBeInTheDocument();
    });
  });

  it('should handle fetch response with success false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Failed to fetch' }),
    });

    render(
      <DocumentList
        relatedEntityType="contact"
        relatedEntityId="contact-id"
      />
    );

    await waitFor(() => {
      // Component should show empty state when fetch fails or returns success: false
      // The component doesn't set documents if success is false, so it will show empty state
      expect(screen.getByText(/no documents attached/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
