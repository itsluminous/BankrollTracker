import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyView from '../daily-view';
import { useToast } from '@/hooks/use-toast';

const mockToast = jest.fn();
// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the BankLogo component
jest.mock('@/components/bank-logo', () => ({
  BankLogo: ({ bankName }: { bankName: string }) => (
    <div data-testid={`bank-logo-${bankName}`}>{bankName}</div>
  ),
}));

describe('DailyView', () => {
  const onEdit = jest.fn();
  const mockRecord = {
    date: '2024-07-28T00:00:00.000Z',
    accounts: [
      {
        id: '1',
        holderName: 'John Doe',
        bankName: 'HDFC',
        accountNumber: '123456789',
        balance: 1000,
        fds: [
          {
            id: 'fd1',
            principal: 500,
            maturityDate: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
      {
        id: '2',
        holderName: 'Jane Doe',
        bankName: 'SBI',
        accountNumber: '987654321',
        balance: 2000,
        fds: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the total combined balance', () => {
    render(<DailyView record={mockRecord} onEdit={onEdit} />);
    expect(screen.getByText('Total Combined Balance')).toBeInTheDocument();
    expect(screen.getByText('₹3,500')).toBeInTheDocument();
  });

  it('renders details for each account', () => {
    render(<DailyView record={mockRecord} onEdit={onEdit} />);
    expect(screen.getByText('John Doe - HDFC')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe - SBI')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    render(<DailyView record={mockRecord} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('copies data to clipboard when copy button is clicked', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    render(<DailyView record={mockRecord} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Copy'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.any(String));
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Copied to clipboard!',
      description: 'You can now paste the balance details in WhatsApp.',
    });
  });
});