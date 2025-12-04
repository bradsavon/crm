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
});
