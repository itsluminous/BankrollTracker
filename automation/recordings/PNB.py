#!/usr/bin/env python3
"""PNB Bank - Papaji Account (Savings + Term Deposit)"""

import os
import json
import re
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

def log(msg):
    print(f"[PNB] {msg}")

def parse_amount(text):
    """Convert 1,37,905.18 Cr. to 137905 (rupees as int)"""
    clean = re.sub(r'[^\d.]', '', text).rstrip('.')
    return int(float(clean)) if clean else 0

def parse_date(text):
    """Convert '18/03/2026' to '2026-03-18'"""
    from datetime import datetime
    for fmt in ["%d/%m/%Y", "%d %b %Y", "%d-%m-%Y"]:
        try:
            dt = datetime.strptime(text.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except:
            continue
    return text

def try_click(page, locator, description, timeout=5000):
    try:
        log(f"Trying: {description}")
        locator.click(timeout=timeout)
        return True
    except PlaywrightTimeout:
        log(f"Skipped: {description} (not found)")
        return False

def run():
    username = os.environ.get("BANK_USERNAME", "")
    password = os.environ.get("BANK_PASSWORD", "")
    output_file = os.environ.get("OUTPUT_FILE", "result.json")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        log("Opening PNB NetBanking...")
        page.goto("https://ibanking.pnb.bank.in/")
        
        log("Clicking Retail Internet Banking...")
        page.get_by_role("link", name="Retail Internet Banking").click()
        page.wait_for_timeout(3000)
        
        # Step 1: Enter User ID
        log("Entering User ID...")
        user_id_field = page.get_by_label("User ID :*")
        user_id_field.fill(username)
        page.wait_for_timeout(500)
        user_id_field.press("Enter")
        user_id_field.fill(username)
        page.wait_for_timeout(500)
        page.keyboard.press("Enter")
        page.wait_for_timeout(2000)
        
        # Step 2: Enter Password
        log("Entering Password...")
        page.get_by_label("Password:*").fill(password)
        
        # Step 3: Focus captcha field and wait for user to enter
        log("Waiting for CAPTCHA...")
        page.locator("#AuthenticationFG\\.ENTERED_CAPTCHA_CODE").focus()
        print("\n>>> Enter CAPTCHA in browser, then press Enter here...")
        input()
        
        # Step 4: Click Log In
        log("Clicking Log In...")
        page.get_by_text("Log In").click()
        page.wait_for_timeout(2000)
        
        # Step 5: Handle popup - click OK button
        log("Handling popup...")
        try_click(page, page.get_by_role("button", name="OK"), "OK popup button", timeout=5000)
        page.wait_for_timeout(2000)
        
        # Step 6: Navigate to Manage Accounts > Account Summary
        log("Navigating to Account Summary...")
        page.locator("#Manage_Accounts").hover()
        page.wait_for_timeout(500)
        page.locator("#Account-Details_Account-Summary").click()
        page.wait_for_timeout(3000)
        
        # Step 7: Extract account data from table
        log("Extracting account data...")
        
        accounts = []
        fds = []
        fd_indices = []  # Track which rows are Term Deposits
        
        # Find all rows in the summary table
        rows = page.locator("#SummaryList tr.listwhiterow, #SummaryList tr.listgreyrow").all()
        
        for i, row in enumerate(rows):
            try:
                # Get account number from menuPullDownHead or span
                acc_num_el = row.locator(".menuPullDownHead").first
                if acc_num_el.count():
                    acc_num = acc_num_el.inner_text().strip().split()[0]
                else:
                    acc_num = row.locator(f"#HREF_AccountSummaryFG\\.ACCOUNT_DISPLAY_NAME_ARRAY\\[{i}\\]").inner_text().strip()
                
                # Get account type
                acc_type = row.locator(f"#AccountSummaryFG\\.ACCOUNT_TYPE_ARRAY\\[{i}\\]").inner_text().strip()
                
                # Get balance
                balance_text = row.locator(f"#HREF_AccountSummaryFG\\.BALANCE_ARRAY\\[{i}\\]").inner_text().strip()
                balance = parse_amount(balance_text)
                
                if acc_type == "Term Deposit":
                    fds.append({
                        "principal": balance,
                        "maturity_date": "",
                        "_row_index": i
                    })
                    log(f"  Term Deposit: ₹{balance:,}")
                else:
                    accounts.append({
                        "type": acc_type,
                        "account_number": acc_num,
                        "balance": balance,
                        "fds": []
                    })
                    log(f"  {acc_type} ({acc_num}): ₹{balance:,}")
                    
            except Exception as e:
                log(f"  Error parsing row {i}: {e}")
        
        # Get maturity dates by clicking into each Term Deposit
        for fd in fds:
            try:
                row_idx = fd["_row_index"]
                log(f"Getting maturity date for FD ₹{fd['principal']:,}...")
                
                # Click the name link to view details
                page.locator(f"#HREF_AccountSummaryFG\\.ACCOUNT_NAME_ARRAY\\[{row_idx}\\]").click()
                page.wait_for_timeout(2000)
                
                # Extract maturity date from details page
                maturity_text = page.locator("#HREF_maturityDateOutput").inner_text().strip()
                fd["maturity_date"] = parse_date(maturity_text)
                log(f"  Maturity: {fd['maturity_date']}")
                
                # Go back to summary
                page.locator("#BACK").click()
                page.wait_for_timeout(2000)
                
            except Exception as e:
                log(f"  Error getting FD details: {e}")
            
            # Remove internal tracking field
            del fd["_row_index"]
        
        # Attach FDs to first savings account
        if accounts and fds:
            accounts[0]["fds"] = fds
        
        result = {"accounts": accounts}
        
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        
        log(f"Done! Extracted {len(accounts)} accounts, {len(fds)} FDs")
        
        # Logout
        log("Logging out...")
        try_click(page, page.get_by_text("Logout"), "Logout button", timeout=3000)
        
        browser.close()

if __name__ == "__main__":
    run()
