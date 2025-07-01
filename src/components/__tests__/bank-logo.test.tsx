import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BankLogo } from '../bank-logo';

describe('BankLogo', () => {
  it('renders the SbiLogo when bankName is "SBI"', () => {
    render(<BankLogo bankName="SBI" />);
    expect(screen.getByTestId('sbi-logo')).toBeInTheDocument();
  });

  it('renders the HdfcLogo when bankName is "HDFC"', () => {
    render(<BankLogo bankName="HDFC" />);
    expect(screen.getByTestId('hdfc-logo')).toBeInTheDocument();
  });

  it('renders the IciciLogo when bankName is "ICICI"', () => {
    render(<BankLogo bankName="ICICI" />);
    expect(screen.getByTestId('icici-logo')).toBeInTheDocument();
  });

  it('renders the PnbLogo when bankName is "PNB"', () => {
    render(<BankLogo bankName="PNB" />);
    expect(screen.getByTestId('pnb-logo')).toBeInTheDocument();
  });

  it('renders the OthersLogo when bankName is not recognized', () => {
    render(<BankLogo bankName="UNKNOWN" />);
    expect(screen.getByTestId('others-logo')).toBeInTheDocument();
  });
});
