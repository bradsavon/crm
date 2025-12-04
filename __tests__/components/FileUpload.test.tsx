import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '@/components/FileUpload';

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);

describe('FileUpload Component', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file upload area', () => {
    render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeInTheDocument();
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should show metadata form after file selection', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      // After file selection, inputs should be enabled and upload button should appear
      const descriptionInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const categorySelect = container.querySelector('select') as HTMLSelectElement;
      // Use getAllByText and filter for the button (not the heading)
      const uploadButtons = screen.getAllByText(/upload document/i);
      const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
      
      expect(descriptionInput).toBeInTheDocument();
      expect(categorySelect).toBeInTheDocument();
      expect(uploadButton).toBeInTheDocument();
      expect(descriptionInput).not.toBeDisabled();
      expect(categorySelect).not.toBeDisabled();
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it('should upload file when save is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'doc-id' } }),
    });

    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      const uploadButtons = screen.getAllByText(/upload document/i);
      const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
      expect(uploadButton).not.toBeDisabled();
    });

    const descriptionInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    const categoryInput = container.querySelector('select') as HTMLSelectElement;
    const uploadButtons = screen.getAllByText(/upload document/i);
    const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;

    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.change(categoryInput, { target: { value: 'Contract' } });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('should handle drag and drop', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = container.querySelector('.border-2.border-dashed');

    if (dropZone) {
      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should show error message on upload failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Upload failed' }),
    });

    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      const uploadButtons = screen.getAllByText(/upload document/i);
      const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
      expect(uploadButton).not.toBeDisabled();
    });

    const uploadButtons = screen.getAllByText(/upload document/i);
    const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload failed|failed to upload/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should validate file size', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
    });
  });
});
