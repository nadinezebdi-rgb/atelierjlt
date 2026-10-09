#!/usr/bin/env python3
"""
Debug script to inspect the actual content structure
"""

import requests
import json

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

# Login as admin
print("Logging in as admin...")
login_resp = requests.post(
    f"{BASE_URL}/api/auth/admin-login",
    json={"password": ADMIN_PASSWORD},
    timeout=10
)
admin_cookies = login_resp.cookies

# Get admin content
print("\n" + "="*80)
print("ADMIN CONTENT (GET /api/admin/site-content)")
print("="*80)
resp = requests.get(
    f"{BASE_URL}/api/admin/site-content",
    cookies=admin_cookies,
    timeout=10
)
admin_content = resp.json()
print(json.dumps(admin_content, indent=2)[:2000])  # First 2000 chars

# Get public content
print("\n" + "="*80)
print("PUBLIC CONTENT (GET /api/site-content)")
print("="*80)
resp = requests.get(
    f"{BASE_URL}/api/site-content",
    timeout=10
)
public_content = resp.json()
print(json.dumps(public_content, indent=2)[:2000])  # First 2000 chars

# Check if they're the same
print("\n" + "="*80)
print("COMPARISON")
print("="*80)
print(f"Admin content keys: {list(admin_content.keys())}")
print(f"Public content keys: {list(public_content.keys())}")

if "content" in admin_content and "content" in public_content:
    admin_inner = admin_content["content"]
    public_inner = public_content["content"]
    
    if isinstance(admin_inner, dict) and isinstance(public_inner, dict):
        print(f"\nAdmin inner content keys: {list(admin_inner.keys())}")
        print(f"Public inner content keys: {list(public_inner.keys())}")
        
        if "sections" in admin_inner:
            print(f"\nAdmin sections count: {len(admin_inner['sections'])}")
            if admin_inner['sections']:
                print(f"First admin section: {json.dumps(admin_inner['sections'][0], indent=2)[:500]}")
        
        if "sections" in public_inner:
            print(f"\nPublic sections count: {len(public_inner['sections'])}")
            if public_inner['sections']:
                print(f"First public section: {json.dumps(public_inner['sections'][0], indent=2)[:500]}")
