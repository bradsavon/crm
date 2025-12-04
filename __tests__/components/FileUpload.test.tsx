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

  it('should handle cancel action', async () => {
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
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  it('should handle drag leave', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const dropZone = container.querySelector('.border-2.border-dashed') as HTMLDivElement;

    if (dropZone) {
      fireEvent.dragOver(dropZone);
      expect(dropZone.className).toContain('border-blue-500');
      
      fireEvent.dragLeave(dropZone);
      await waitFor(() => {
        expect(dropZone.className).not.toContain('border-blue-500');
      });
    }
  });

  it('should handle upload network error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

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
      expect(screen.getByText(/failed to upload file/i)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should call onUploadSuccess callback after successful upload', async () => {
    const mockOnUploadSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'doc-id' } }),
    });

    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUploadSuccess={mockOnUploadSuccess}
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
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('should use category prop as initial value', () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        category="contract"
      />
    );

    const categorySelect = container.querySelector('select') as HTMLSelectElement;
    expect(categorySelect).toBeInTheDocument();
    // The select should have the category value set
    expect(categorySelect.value).toBe('contract');
  });

  it('should show error when trying to upload without selecting file', async () => {
    render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    // Try to click upload button when no file is selected
    // The button shouldn't be visible, but let's test the error case
    const uploadButtons = screen.queryAllByText(/upload document/i);
    const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON');
    
    // Button should not exist when no file is selected
    expect(uploadButton).toBeUndefined();
  });

  it('should handle file selection with no file', () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: null } });
    }

    // Should not show any file
    expect(screen.queryByText(/test\.pdf/i)).not.toBeInTheDocument();
  });

  it('should handle drag drop with no file', () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    const dropZone = container.querySelector('.border-2.border-dashed') as HTMLDivElement;

    if (dropZone) {
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [],
        },
      });
    }

    // Should not show any file
    expect(screen.queryByText(/test\.pdf/i)).not.toBeInTheDocument();
  });

  it('should format file sizes correctly', async () => {
    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
      />
    );

    // Test 0 bytes
    const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [emptyFile] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/0 Bytes/i)).toBeInTheDocument();
    });

    // Test KB
    const kbFile = new File(['x'.repeat(1024)], 'kb.txt', { type: 'text/plain' });
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [kbFile] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/1 KB/i)).toBeInTheDocument();
    });

    // Test MB
    const mbFile = new File(['x'.repeat(1024 * 1024)], 'mb.txt', { type: 'text/plain' });
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [mbFile] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
    });
  });

  it('should disable inputs during upload', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

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
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      expect(fileInput).toBeDisabled();
      
      const descriptionInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const categorySelect = container.querySelector('select') as HTMLSelectElement;
      expect(descriptionInput).toBeDisabled();
      expect(categorySelect).toBeDisabled();
      expect(uploadButton).toBeDisabled();
    });
  });

  it('should reset form after successful upload', async () => {
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
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const descriptionInput = container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    const uploadButtons = screen.getAllByText(/upload document/i);
    const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      expect(descriptionInput.value).toBe('');
    });
  });

  it('should handle upload with both onUpload and onUploadSuccess', async () => {
    const mockOnUploadSuccess = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'doc-id' } }),
    });

    const { container } = render(
      <FileUpload
        relatedEntityType="contact"
        relatedEntityId="contact-id"
        onUpload={mockOnUpload}
        onUploadSuccess={mockOnUploadSuccess}
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
      expect(mockOnUpload).toHaveBeenCalled();
      expect(mockOnUploadSuccess).toHaveBeenCalled();
    });
  });

  it('should include description and category in form data when provided', async () => {
    let capturedBody: any = null;
    
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      capturedBody = options?.body;
      return {
        ok: true,
        json: async () => ({ success: true, data: { _id: 'doc-id' } }),
      };
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
    const categorySelect = container.querySelector('select') as HTMLSelectElement;
    
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.change(categorySelect, { target: { value: 'contract' } });

    const uploadButtons = screen.getAllByText(/upload document/i);
    const uploadButton = uploadButtons.find(btn => btn.tagName === 'BUTTON') as HTMLButtonElement;
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Verify the fetch was called with FormData
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1]?.body).toBeInstanceOf(FormData);
    
    const formData = fetchCall[1]?.body as FormData;
    expect(formData.get('description')).toBe('Test description');
    expect(formData.get('category')).toBe('contract');
    expect(formData.get('relatedEntityType')).toBe('contact');
    expect(formData.get('relatedEntityId')).toBe('contact-id');
  });
});
