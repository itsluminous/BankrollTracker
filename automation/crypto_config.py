#!/usr/bin/env python3
"""Encrypt/decrypt config.json with a password. Data stays in memory only."""

import base64
import json
import sys
from getpass import getpass
from pathlib import Path
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

CONFIG_FILE = Path(__file__).parent / "config.json"
ENCRYPTED_FILE = Path(__file__).parent / "config.json.enc"


def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=480000)
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def encrypt_config(password: str = None):
    """Encrypt config.json -> config.json.enc, then delete plaintext."""
    if not CONFIG_FILE.exists():
        print("config.json not found")
        sys.exit(1)

    if not password:
        password = getpass("Set encryption password: ")
        confirm = getpass("Confirm password: ")
        if password != confirm:
            print("Passwords don't match")
            sys.exit(1)

    import os
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    fernet = Fernet(key)

    plaintext = CONFIG_FILE.read_bytes()
    encrypted = fernet.encrypt(plaintext)

    # Store salt + encrypted data
    ENCRYPTED_FILE.write_bytes(salt + encrypted)
    CONFIG_FILE.unlink()
    print(f"Encrypted to {ENCRYPTED_FILE.name} and deleted config.json")


def decrypt_config(password: str = None) -> dict:
    """Decrypt config.json.enc and return dict (never writes to disk)."""
    if not ENCRYPTED_FILE.exists():
        print("config.json.enc not found. Run: python crypto_config.py encrypt")
        sys.exit(1)

    if not password:
        password = getpass("Enter config password: ")

    raw = ENCRYPTED_FILE.read_bytes()
    salt, encrypted = raw[:16], raw[16:]
    key = _derive_key(password, salt)
    fernet = Fernet(key)

    try:
        plaintext = fernet.decrypt(encrypted)
    except InvalidToken:
        print("Wrong password")
        sys.exit(1)

    return json.loads(plaintext)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "encrypt":
        encrypt_config()
    elif len(sys.argv) > 1 and sys.argv[1] == "decrypt":
        # Print to stdout (for debugging only)
        data = decrypt_config()
        print(json.dumps(data, indent=2))
    else:
        print("Usage: python crypto_config.py encrypt|decrypt")
