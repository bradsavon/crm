import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '@/components/Navigation';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Navigation Component', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });
  });

  it('should render navigation items', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search submission', async () => {
    render(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchForm = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(searchForm!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
    });
  });

  it('should not submit empty search', async () => {
    render(<Navigation />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    const searchForm = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: '   ' } });
    fireEvent.submit(searchForm!);

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('should hide navigation on login page', () => {
    (usePathname as jest.Mock).mockReturnValue('/login');
    
    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should show user menu when logged in', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
        },
      }),
    });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });
  });

  it('should handle logout', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'user-id',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'admin',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});

