import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataEntryForm from '../data-entry-form';
import { useToast } from '@/hooks/use-toast';

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock('@/lib/supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));


import { useBankData } from '@/hooks/use-bank-data';

jest.mock('@/hooks/use-bank-data');

describe('DataEntryForm', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  const selectedDate = new Date('2024-07-28T00:00:00.000Z');

  const initialData = {
    date: '2024-07-28',
    accounts: [
      {
        id: '1',
        holderName: 'John Doe',
        bankName: 'HDFC',
        accountNumber: '123456789',
        balance: 1000,
        fds: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBankData as jest.Mock).mockReturnValue({
      getLatestRecord: jest.fn().mockResolvedValue(null),
    });
  });

  it('renders with initial data', async () => {
    render(
      <DataEntryForm
        initialData={initialData}
        onSave={onSave}
        selectedDate={selectedDate}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('dataEntry.addAccount')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('adds a new account when "Add Account" is clicked', async () => {
    render(
      <DataEntryForm
        initialData={null}
        onSave={onSave}
        selectedDate={selectedDate}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
        expect(screen.getByText('dataEntry.addAccount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('dataEntry.addAccount'));

    await waitFor(() => {
        expect(screen.getAllByPlaceholderText('dataEntry.accountHolder').length).toBe(1);
    })
  });

  it('removes an account when trash icon is clicked', async () => {
    render(
      <DataEntryForm
        initialData={initialData}
        onSave={onSave}
        selectedDate={selectedDate}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
        expect(screen.getByText('dataEntry.addAccount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-account-0'));

    await waitFor(() => {
        expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
    })
  });

  it('calls onSave with the correct data when form is submitted', async () => {
    render(
      <DataEntryForm
        initialData={initialData}
        onSave={onSave}
        selectedDate={selectedDate}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
        expect(screen.getByText('dataEntry.addAccount')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('John Doe'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByText('dataEntry.saveData'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        accounts: [
          {
            ...initialData.accounts[0],
            holderName: 'Jane Doe',
          },
        ],
      });
    });
  });

  it('adds a new FD when "Add FD" is clicked', async () => {
    render(
      <DataEntryForm
        initialData={initialData}
        onSave={onSave}
        selectedDate={selectedDate}
        onCancel={onCancel}
      />
    );

    await waitFor(() => {
        expect(screen.getByText('dataEntry.addAccount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('dataEntry.addFd'));

    await waitFor(() => {
        expect(screen.getAllByLabelText('dataEntry.principal').length).toBe(1);
        expect(screen.getAllByLabelText('dataEntry.maturityDate').length).toBe(1);
    })
  });
});
