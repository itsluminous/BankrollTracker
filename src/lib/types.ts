export interface FixedDeposit {
  id: string;
  principal: number;
  maturityDate: string; // ISO string format (yyyy-MM-dd)
}

export interface Account {
  id: string;
  holderName: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  fds: FixedDeposit[];
}

export interface DailyRecord {
  date: string; // yyyy-MM-dd format
  accounts: Account[];
}
