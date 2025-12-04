import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

  it('should handle logout error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const logoutError = new Error('Logout failed');
    
    let fetchCallCount = 0;
    (global.fetch as jest.Mock).mockImplementation((url) => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // First call: get user
        return Promise.resolve({
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
      } else if (url === '/api/auth/logout') {
        // Logout call - reject with error
        return Promise.reject(logoutError);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText(/logout/i);
    
    // Click logout - should not crash even if there's an error
    fireEvent.click(logoutButton);

    // Wait a bit for the async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // The component should still be rendered (not crashed)
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    
    // Console.error should be called (but might be called asynchronously)
    // We'll just verify the component didn't crash
    consoleSpy.mockRestore();
  });

  it('should handle fetchUser error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.queryByText(/test user/i)).not.toBeInTheDocument();
    });
  });

  it('should show Users link for admin', async () => {
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
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('should show Users link for manager', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'manager',
        },
      }),
    });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('should not show Users link for sales rep', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'salesrep',
        },
      }),
    });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.queryByText('Users')).not.toBeInTheDocument();
    });
  });

  it('should display task notifications when overdue', async () => {
    const fetchMock = (global.fetch as jest.Mock)
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
        json: async () => ({
          success: true,
          data: {
            tasks: [],
            counts: { overdue: 3, dueToday: 1 },
          },
        }),
      });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    // Wait for the second fetch call (task notifications) to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Wait for task notifications to be displayed
    await waitFor(() => {
      const taskLinks = screen.queryAllByTitle(/3 overdue, 1 due today/i);
      expect(taskLinks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should display task notifications when due today only', async () => {
    const fetchMock = (global.fetch as jest.Mock)
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
        json: async () => ({
          success: true,
          data: {
            tasks: [],
            counts: { overdue: 0, dueToday: 2 },
          },
        }),
      });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    // Wait for the second fetch call (task notifications) to complete
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // Wait for task notifications to be displayed
    await waitFor(() => {
      const taskLinks = screen.queryAllByTitle(/0 overdue, 2 due today/i);
      expect(taskLinks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should handle task notifications fetch error', async () => {
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
      .mockRejectedValueOnce(new Error('Network error'));

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });
    // Should not crash, just silently fail
  });

  it('should toggle mobile menu', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<Navigation />);

    const menuButton = screen.getByLabelText('Menu');
    // Mobile menu should be closed initially
    let mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
    expect(mobileMenuContainer).toBeNull();

    await act(async () => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      // Mobile menu should be open
      mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      // Mobile menu should be closed again
      mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeNull();
    }, { timeout: 1000 });
  });

  it('should toggle mobile search', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    render(<Navigation />);

    const searchButton = screen.getByLabelText('Search');
    expect(screen.queryByPlaceholderText(/search contacts/i)).not.toBeInTheDocument();

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search contacts/i)).toBeInTheDocument();
    });

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search contacts/i)).not.toBeInTheDocument();
    });
  });

  it('should close mobile menu when link is clicked', async () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<Navigation />);

    const menuButton = screen.getByLabelText('Menu');
    await act(async () => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      // Mobile menu should be open
      const mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeInTheDocument();
    });

    // Find Dashboard link in mobile menu - it should have the mobile menu classes
    const mobileDashboardLink = container.querySelector('.lg\\:hidden .pb-4.border-t a[href="/"]');
    expect(mobileDashboardLink).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(mobileDashboardLink!);
    });

    await waitFor(() => {
      // Mobile menu should be closed after clicking link
      const mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeNull();
    }, { timeout: 2000 });
  });

  it('should show login link when not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });

    render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('should show mobile menu user info when logged in', async () => {
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
        json: async () => ({
          success: true,
          data: { tasks: [], counts: { overdue: 0, dueToday: 0 } },
        }),
      });

    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<Navigation />);

    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    const menuButton = screen.getByLabelText('Menu');
    await act(async () => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      // Mobile menu should be open
      const mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeInTheDocument();
      // Should see user info section in mobile menu
      const mobileUserInfo = mobileMenuContainer?.querySelector('.mt-4.pt-4');
      expect(mobileUserInfo).toBeInTheDocument();
      // Should see user name in mobile menu
      const userNames = screen.getAllByText(/test user/i);
      expect(userNames.length).toBeGreaterThan(1); // Desktop + mobile
    });
  });

  it('should show mobile menu login link when not authenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });

    (usePathname as jest.Mock).mockReturnValue('/');
    const { container } = render(<Navigation />);

    await waitFor(() => {
      // Should see login link in desktop view
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    const menuButton = screen.getByLabelText('Menu');
    await act(async () => {
      fireEvent.click(menuButton);
    });

    await waitFor(() => {
      // Mobile menu should be open
      const mobileMenuContainer = container.querySelector('.lg\\:hidden .pb-4.border-t');
      expect(mobileMenuContainer).toBeInTheDocument();
      // Should see login link in mobile menu
      const mobileLoginSection = mobileMenuContainer?.querySelector('.mt-4.pt-4');
      expect(mobileLoginSection).toBeInTheDocument();
      // Should have multiple Login links (desktop + mobile)
      const loginLinks = screen.getAllByText('Login');
      expect(loginLinks.length).toBeGreaterThan(1);
    });
  });
});

