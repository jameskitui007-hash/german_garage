"""
generate_secret.py
──────────────────
Run this once to generate a cryptographically strong SECRET_KEY.

Usage:
    python generate_secret.py

Then copy the output into your .env file:
    SECRET_KEY=<paste here>

Never commit your .env file to git.
"""
import secrets

key = secrets.token_hex(32)   # 32 bytes = 64 hex chars = 256 bits

print("\n✅ Your new SECRET_KEY (copy this into your .env file):\n")
print(f"SECRET_KEY={key}\n")
print("⚠️  Keep this secret. Never commit it to git.\n")