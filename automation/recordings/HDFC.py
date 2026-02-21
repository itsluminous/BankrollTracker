#!/usr/bin/env python3
"""HDFC Bank - Mummyji Account (Savings + Current)"""

import os
import json
import re
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

def log(msg):
    print(f"[HDFC] {msg}")

def parse_amount(text):
    """Convert ₹4,90,793.29 to 490793 (rupees as int)"""
    clean = re.sub(r'[^\d.]', '', text)
    return int(float(clean)) if clean else 0

def parse_date(text):
    """Convert '11 Jun 2026' to '2026-06-11'"""
    from datetime import datetime
    try:
        dt = datetime.strptime(text.strip(), "%d %b %Y")
        return dt.strftime("%Y-%m-%d")
    except:
        return text

def try_click(page, locator, description, timeout=5000):
    """Try to click element, return True if successful"""
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

        # Login
        log("Opening HDFC NetBanking...")
        page.goto("https://now.hdfc.bank.in/")
        
        log("Entering credentials...")
        page.get_by_role("textbox", name="Enter Customer ID/User ID").fill(username)
        page.get_by_role("textbox", name="Enter Password").fill(password)
        page.get_by_role("button", name="Login", exact=True).click()
        
        page.wait_for_timeout(2000)
        
        # Handle "Proceed Here" popup if session exists elsewhere
        try_click(page, page.get_by_role("button", name="Proceed Here"), "Proceed Here popup", timeout=3000)
        
        page.wait_for_timeout(2000)
        
        # OTP - only if OTP page appears
        otp_radio = page.get_by_role("radio", name=re.compile("SMS Mobile number")).nth(1)
        if otp_radio.count() > 0:
            log("OTP page detected")
            otp_radio.check()
            page.get_by_role("button", name="Get OTP").click()
            print("\n>>> Enter OTP in browser, then press Enter here...")
            input()
            page.get_by_role("button", name="Submit").click()
            page.wait_for_timeout(2000)
        else:
            log("No OTP required, continuing...")
        
        page.wait_for_timeout(2000)
        
        # Handle "Proceed Here" popup if session exists elsewhere
        try_click(page, page.get_by_role("button", name="Proceed Here"), "Proceed Here popup", timeout=3000)
        
        # Handle popups
        for _ in range(3):
            try_click(page, page.get_by_role("button", name="Do It Later"), "Dismiss popup")
        
        # Toggle if needed
        try_click(page, page.locator(".bb-switch__slider"), "Toggle switch", timeout=2000)
        
        # Navigate to Accounts
        log("Navigating to Accounts...")
        page.get_by_role("link", name="Accounts").click()
        page.wait_for_timeout(3000)
        
        # Extract accounts
        accounts = []
        log("Extracting account balances...")
        
        # Try multiple account tiles first (desktop view only)
        tiles = page.locator("bb-multiple-account-product-tile-ui .desktop-view").all()
        
        # If no multiple tiles, try single account view
        if not tiles:
            tiles = page.locator(".bb-product-kind").all()
        
        for tile in tiles:
            try:
                text = tile.inner_text()
                
                # Determine account type
                if "Savings A/c" in text:
                    acc_type = "Savings"
                elif "Current A/c" in text:
                    acc_type = "Current"
                else:
                    continue
                
                # Get account number (last 4 digits) - try both structures
                acc_num = ""
                acc_spans = tile.locator("bb-common-mask-account-number span").all()
                for span in acc_spans:
                    span_text = span.inner_text().strip()
                    if "**" in span_text and any(c.isdigit() for c in span_text):
                        acc_num = span_text.replace("*", "").replace(" ", "")
                        break
                
                # Get balance from .integer span (first one is the main balance)
                balance_el = tile.locator(".integer").first
                balance = parse_amount(balance_el.inner_text())
                
                accounts.append({"type": acc_type, "account_number": acc_num, "balance": balance, "fds": []})
                log(f"  {acc_type} ({acc_num}): ₹{balance:,}")
            except Exception as e:
                log(f"  Error parsing tile: {e}")
        
        # Navigate to FD page
        log("Navigating to Fixed Deposits...")
        try_click(page, page.get_by_role("button", name="FD/RD"), "FD/RD button")
        page.wait_for_timeout(1000)
        try_click(page, page.get_by_role("link", name="Fixed Deposit"), "Fixed Deposit link")
        page.wait_for_timeout(3000)
        
        # Extract FDs
        fds = []
        log("Extracting FD details...")
        try:
            fd_text = page.inner_text("body")
            fd_matches = re.findall(r'₹([\d,]+\.?\d*)[^₹]*?Matures on (\d+ \w+ \d+)', fd_text)
            for principal_str, maturity_str in fd_matches:
                fds.append({
                    "principal": parse_amount(principal_str),
                    "maturity_date": parse_date(maturity_str)
                })
                log(f"  FD: ₹{parse_amount(principal_str):,} -> {parse_date(maturity_str)}")
        except Exception as e:
            log(f"  Could not extract FDs: {e}")
        
        # Attach FDs to savings account
        if accounts and fds:
            for acc in accounts:
                if acc["type"] == "Savings":
                    acc["fds"] = fds
                    break
        
        result = {"accounts": accounts}
        
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2)
        
        log(f"Done! Extracted {len(accounts)} accounts, {len(fds)} FDs")
        
        # Logout
        log("Logging out...")
        try_click(page, page.get_by_role("button", name="Logout"), "Logout button")
        try_click(page, page.get_by_role("button", name="Logout"), "Confirm logout", timeout=2000)
        
        browser.close()

if __name__ == "__main__":
    run()
