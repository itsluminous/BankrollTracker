import { renderHook, act, waitFor } from '@testing-library/react';
import { useBankData } from '../use-bank-data';
import { useAuth } from '../use-auth';
import { supabase } from '@/lib/supabase';
import { DailyRecord } from '@/lib/types';

// Mock dependencies
jest.mock('../use-auth');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

const mockUseAuth = useAuth as jest.Mock;

describe('useBankData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, loading: false });
  });

  describe('fetchDailyRecords', () => {
    it('should fetch and format daily records', async () => {
      const mockRecords = [
        {
          id: 'rec1',
          record_date: '2024-07-29T00:00:00.000Z',
          accounts: [
            {
              id: 'acc1',
              holder_name: 'Test User',
              bank_name: 'Test Bank',
              account_number: '123',
              balance: 100,
              fixed_deposits: [{ id: 'fd1', principal: 50, maturity_date: '2025-01-01T00:00:00.000Z' }],
            },
          ],
        },
      ];
      (supabase.from('daily_records').select().eq().order as jest.Mock).mockResolvedValue({ data: mockRecords, error: null });

      const { result } = renderHook(() => useBankData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(Object.keys(result.current.data).length).toBe(1);
        expect(result.current.data['2024-07-29']).toBeDefined();
      });
    });
  });
});
