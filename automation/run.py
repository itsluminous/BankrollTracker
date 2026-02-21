#!/usr/bin/env python3
"""
Bank Balance Automation - Main Runner
Reads bank credentials, runs recorded scripts, collects balances, updates BankrollTracker.
"""

import json
import os
import sys
from datetime import date
from pathlib import Path
from supabase import create_client

OUTPUT_DIR = Path(__file__).parent / "output"
CONFIG_FILE = Path(__file__).parent / "config.json"


def load_config():
    if not CONFIG_FILE.exists():
        print(f"Error: {CONFIG_FILE} not found. Copy config.example.json to config.json and fill in your details.")
        sys.exit(1)
    with open(CONFIG_FILE) as f:
        return json.load(f)


def get_today_output_file():
    OUTPUT_DIR.mkdir(exist_ok=True)
    return OUTPUT_DIR / f"{date.today().isoformat()}.json"


def load_today_data():
    output_file = get_today_output_file()
    if output_file.exists():
        with open(output_file) as f:
            return json.load(f)
    return {"date": date.today().isoformat(), "accounts": []}


def save_today_data(data):
    with open(get_today_output_file(), "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved to {get_today_output_file()}")


def run_bank_script(bank_config):
    """
    Run the bank script based on bank name.
    """
    bank_name = bank_config["name"]
    recording_file = Path(__file__).parent / "recordings" / f"{bank_name}.py"
    
    if not recording_file.exists():
        print(f"Script not found: {recording_file}")
        return None

    # Create temp file for script output
    temp_output = Path(__file__).parent / "temp_result.json"
    
    # Set environment variables for the script
    env = os.environ.copy()
    env["BANK_USERNAME"] = bank_config["username"]
    env["BANK_PASSWORD"] = bank_config["password"]
    env["OUTPUT_FILE"] = str(temp_output)
    
    import subprocess
    result = subprocess.run(
        [sys.executable, str(recording_file)],
        env=env
    )
    
    if result.returncode != 0:
        print(f"Script failed for {bank_name}")
        return None
    
    if temp_output.exists():
        with open(temp_output) as f:
            data = json.load(f)
        temp_output.unlink()
        return data
    
    return None


def upload_to_supabase(config, data):
    """Upload collected data to Supabase (BankrollTracker backend)."""
    from supabase import create_client, Client
    
    client: Client = create_client(config["supabase_url"], config["supabase_key"])
    
    # Debug: print credentials (masked)
    email = config["supabase_email"]
    password = config["supabase_password"]
    print(f"Signing in as: {email}")
    
    # Sign in
    try:
        auth_response = client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
    except Exception as e:
        print(f"Auth error: {e}")
        print(f"Password length: {len(password)}, first/last char: {password[0]}...{password[-1]}")
        raise
    user_id = auth_response.user.id
    
    date_str = data["date"]
    
    # Check if record exists
    existing = client.table("daily_records").select("id").eq("user_id", user_id).eq("record_date", date_str).execute()
    
    if existing.data:
        daily_record_id = existing.data[0]["id"]
        # Delete existing accounts for this record
        client.table("accounts").delete().eq("daily_record_id", daily_record_id).execute()
    else:
        # Create new daily record
        insert_result = client.table("daily_records").insert({
            "user_id": user_id,
            "record_date": date_str
        }).execute()
        daily_record_id = insert_result.data[0]["id"]
    
    # Insert accounts and FDs
    for account in data["accounts"]:
        acc_result = client.table("accounts").insert({
            "daily_record_id": daily_record_id,
            "user_id": user_id,
            "holder_name": account["holder_name"],
            "bank_name": account["bank_name"],
            "account_number": account["account_number"],
            "balance": account["balance"]
        }).execute()
        
        account_id = acc_result.data[0]["id"]
        
        for fd in account.get("fds", []):
            client.table("fixed_deposits").insert({
                "account_id": account_id,
                "user_id": user_id,
                "principal": fd["principal"],
                "maturity_date": fd["maturity_date"]
            }).execute()
    
    print(f"Uploaded {len(data['accounts'])} accounts to BankrollTracker")


def main():
    config = load_config()
    data = load_today_data()
    
    print(f"=== Bank Balance Automation - {date.today().isoformat()} ===\n")
    
    for bank in config["banks"]:
        print(f"Processing: {bank['name']} - {bank['holder_name']} ({bank['id']})")
        
        result = run_bank_script(bank)
        
        if result:
            # Get account mapping from config - by last 4 digits of account number
            account_map = {a["account_number"][-4:]: a for a in bank.get("accounts", [])}
            
            # Collect all FDs from all extracted accounts
            all_fds = []
            for acc in result.get("accounts", []):
                all_fds.extend(acc.get("fds", []))
            
            for acc in result.get("accounts", []):
                # Match by last 4 digits of extracted account number
                extracted_num = acc.get("account_number", "")
                config_acc = account_map.get(extracted_num[-4:], {})
                
                # Skip if not in config for this bank
                if not config_acc:
                    continue
                
                full_acc_num = config_acc.get("account_number", extracted_num)
                label = config_acc.get("label", f"{bank['holder_name']} {acc['type']}")
                
                account_entry = {
                    "holder_name": bank["holder_name"],
                    "bank_name": bank["name"],
                    "account_number": full_acc_num,
                    "balance": acc.get("balance", 0),
                    "fds": all_fds  # Attach all FDs to matched account
                }
                
                # Replace if exists, else append
                existing_idx = next(
                    (i for i, a in enumerate(data["accounts"]) 
                     if a["account_number"] == full_acc_num),
                    None
                )
                if existing_idx is not None:
                    data["accounts"][existing_idx] = account_entry
                else:
                    data["accounts"].append(account_entry)
                
                print(f"  {label}: ₹{acc.get('balance', 0):,}, FDs: {len(acc.get('fds', []))}")
            
            save_today_data(data)
        else:
            print(f"  Failed to get data")
        
        print()
    
    # Ask to upload
    if data["accounts"]:
        response = input("Upload to BankrollTracker? (y/n): ")
        if response.lower() == "y":
            upload_to_supabase(config, data)


if __name__ == "__main__":
    main()
