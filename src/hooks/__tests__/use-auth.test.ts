import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../use-auth';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

describe('useAuth', () => {
  it('should return loading true initially', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  it('should set user and session when getSession returns a session', async () => {
    const mockSession = { user: { id: '123' } } as Session;
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should update the session on auth state change', async () => {
    const mockSession = { user: { id: '123' } } as Session;
    let onAuthStateChangeCallback: (event: string, session: Session | null) => void;

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      onAuthStateChangeCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      onAuthStateChangeCallback('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.loading).toBe(false);
    });
  });
});
