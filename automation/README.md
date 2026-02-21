# Bank Balance Automation

Automates fetching bank balances and FDs, then uploads to BankrollTracker.

## Setup

1. Install dependencies:
```bash
pip install playwright supabase
playwright install chromium
```

2. Copy config:
```bash
cp config.example.json config.json
```

3. Edit `config.json` with your:
   - Supabase credentials (from your BankrollTracker .env.local)
   - Bank login details

## Recording Bank Workflows

For each bank, you need to record the login + navigation flow:

```bash
npx playwright codegen https://now.hdfc.bank.in/retail-app/dashboard
```

This opens a browser with a recorder. As you click through:
1. Enter login credentials
2. Handle OTP/Captcha manually
3. Navigate to balance page
4. Navigate to FD page

The recorder generates Python code. Copy it into a new file in `recordings/` folder.

### Adapting Recorded Code

1. Copy `recordings/hdfc_template.py` as your starting point
2. Replace the placeholder navigation with your recorded code
3. Update `extract_balance()` and `extract_fds()` functions with correct selectors
4. The script pauses for OTP/Captcha - you enter them manually in the browser

## Running

```bash
python run.py
```

The script will:
1. Process each bank in config.json
2. Run the recorded script (browser opens, you handle OTP/captcha)
3. Extract balance and FD data
4. Save to `output/YYYY-MM-DD.json`
5. Ask if you want to upload to BankrollTracker

## Output Format

`output/2026-02-21.json`:
```json
{
  "date": "2026-02-21",
  "accounts": [
    {
      "holder_name": "John Doe",
      "bank_name": "HDFC Bank",
      "account_number": "XXXX1234",
      "balance": 150000,
      "fds": [
        {"principal": 100000, "maturity_date": "2027-01-15"}
      ]
    }
  ]
}
```

## Tips

- Run in non-headless mode (default) so you can see and interact with OTP/captcha
- The script waits for your input after login steps
- Test each bank recording individually first
- Keep `config.json` secure - it contains your credentials
