#!/usr/bin/env python3
"""
Backend test for Atelier JLT - Media Persistence & Recovery Tool
Tests the CRITICAL fix for media persistence + recovery tool
"""

import requests
import json
import os
import sys
from pathlib import Path

# Base URL from environment
BASE_URL = "https://french-craft.preview.emergentagent.com/api"
ADMIN_PASSWORD = "Juliette99*"

# Session for cookie persistence
session = requests.Session()

def print_test(test_num, description):
    """Print test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print('='*80)

def print_result(success, message):
    """Print test result"""
    status = "✅ PASSED" if success else "❌ FAILED"
    print(f"{status}: {message}")
    return success

def admin_login():
    """Login as admin and store cookie"""
    print_test("SETUP", "Admin Login")
    try:
        response = session.post(
            f"{BASE_URL}/auth/admin-login",
            json={"password": ADMIN_PASSWORD},
            timeout=30
        )
        if response.status_code == 200:
            print_result(True, f"Admin login successful, cookie set")
            return True
        else:
            print_result(False, f"Admin login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_result(False, f"Admin login error: {str(e)}")
        return False

def test_1_upload_stores_in_mongodb():
    """Test 1: Upload endpoint stores in MongoDB"""
    print_test(1, "Upload endpoint stores in MongoDB")
    
    try:
        # Use an existing test image
        test_image_path = "/app/lib/product-images/ambiance-canape.jpeg"
        
        if not os.path.exists(test_image_path):
            return print_result(False, f"Test image not found: {test_image_path}")
        
        with open(test_image_path, 'rb') as f:
            files = {'file': ('test-upload.jpg', f, 'image/jpeg')}
            response = session.post(
                f"{BASE_URL}/admin/upload",
                files=files,
                timeout=60
            )
        
        if response.status_code != 200:
            return print_result(False, f"Upload failed: {response.status_code} - {response.text}")
        
        data = response.json()
        
        # Verify response structure
        required_fields = ['ok', 'url', 'filename', 'kind', 'size', 'originalName']
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return print_result(False, f"Missing fields in response: {missing_fields}")
        
        if not data.get('ok'):
            return print_result(False, f"Upload returned ok=false")
        
        if data.get('kind') != 'image':
            return print_result(False, f"Expected kind='image', got '{data.get('kind')}'")
        
        filename = data.get('filename', '')
        if not filename.startswith('upload-'):
            return print_result(False, f"Filename doesn't start with 'upload-': {filename}")
        
        # Store filename for later tests
        global uploaded_filename, uploaded_url
        uploaded_filename = filename
        uploaded_url = data.get('url', '')
        
        # Verify the image is accessible
        img_name = uploaded_url.replace('/api/img/', '')
        img_response = session.get(f"{BASE_URL}/img/{img_name}", timeout=30)
        
        if img_response.status_code != 200:
            return print_result(False, f"Uploaded image not accessible: {img_response.status_code}")
        
        if len(img_response.content) < 1000:
            return print_result(False, f"Image content too small: {len(img_response.content)} bytes")
        
        return print_result(True, f"Upload successful: {filename}, URL: {uploaded_url}, size: {data.get('size')} bytes, accessible via GET")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_2_mongodb_fallback_after_disk_deletion():
    """Test 2: MongoDB fallback after disk deletion"""
    print_test(2, "MongoDB fallback after disk deletion")
    
    try:
        if not uploaded_filename:
            return print_result(False, "No uploaded file from test 1")
        
        # Get the image first to verify it works
        img_name = uploaded_url.replace('/api/img/', '')
        response1 = session.get(f"{BASE_URL}/img/{img_name}", timeout=30)
        
        if response1.status_code != 200:
            return print_result(False, f"Image not accessible before deletion: {response1.status_code}")
        
        original_size = len(response1.content)
        
        # Delete the file from disk
        disk_path = f"/app/lib/product-images/{uploaded_filename}"
        if os.path.exists(disk_path):
            os.remove(disk_path)
            print(f"   Deleted file from disk: {disk_path}")
        else:
            print(f"   File not on disk (already in MongoDB only): {disk_path}")
        
        # Try to access again - should fallback to MongoDB
        response2 = session.get(f"{BASE_URL}/img/{img_name}", timeout=30)
        
        if response2.status_code != 200:
            return print_result(False, f"MongoDB fallback failed: {response2.status_code}")
        
        fallback_size = len(response2.content)
        
        if fallback_size != original_size:
            return print_result(False, f"Size mismatch: original={original_size}, fallback={fallback_size}")
        
        return print_result(True, f"MongoDB fallback working: {fallback_size} bytes served from MongoDB after disk deletion")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_3_nonexistent_file_returns_404():
    """Test 3: Non-existent file returns 404"""
    print_test(3, "Non-existent file returns 404")
    
    try:
        # Test /api/img
        response1 = session.get(f"{BASE_URL}/img/definitely-not-a-file", timeout=30)
        if response1.status_code != 404:
            return print_result(False, f"/api/img returned {response1.status_code} instead of 404")
        
        # Test /api/file
        response2 = session.get(f"{BASE_URL}/file/definitely-not-a-file.mp4", timeout=30)
        if response2.status_code != 404:
            return print_result(False, f"/api/file returned {response2.status_code} instead of 404")
        
        return print_result(True, "Both /api/img and /api/file return 404 for non-existent files")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_4_path_traversal_blocked():
    """Test 4: Path traversal blocked"""
    print_test(4, "Path traversal blocked")
    
    try:
        # Test various path traversal attempts
        traversal_attempts = [
            "../etc/passwd",
            "..%2F..%2Fetc%2Fpasswd",
            "../secret",
            "../../secret",
        ]
        
        for attempt in traversal_attempts:
            response = session.get(f"{BASE_URL}/img/{attempt}", timeout=30)
            if response.status_code != 404:
                return print_result(False, f"Path traversal not blocked for '{attempt}': returned {response.status_code}")
        
        return print_result(True, "All path traversal attempts correctly blocked (404)")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_5_get_broken_media():
    """Test 5: GET /api/admin/broken-media"""
    print_test(5, "GET /api/admin/broken-media")
    
    try:
        # Test without admin (should be 401)
        no_auth_session = requests.Session()
        response_no_auth = no_auth_session.get(f"{BASE_URL}/admin/broken-media", timeout=30)
        if response_no_auth.status_code != 401:
            return print_result(False, f"Expected 401 without admin, got {response_no_auth.status_code}")
        
        print("   ✓ Returns 401 without admin auth")
        
        # Test with admin
        response = session.get(f"{BASE_URL}/admin/broken-media", timeout=60)
        if response.status_code != 200:
            return print_result(False, f"Failed with admin: {response.status_code} - {response.text}")
        
        data = response.json()
        
        # Verify structure
        if 'products' not in data or 'summary' not in data:
            return print_result(False, f"Missing 'products' or 'summary' in response")
        
        summary = data.get('summary', {})
        if 'productsWithMissing' not in summary or 'totalMissing' not in summary:
            return print_result(False, f"Missing fields in summary")
        
        print(f"   ✓ Response structure correct")
        print(f"   ✓ Products with missing media: {summary['productsWithMissing']}")
        print(f"   ✓ Total missing: {summary['totalMissing']}")
        
        # On healthy DB, should be 0
        if summary['totalMissing'] == 0:
            print(f"   ✓ Healthy state: no broken media")
        
        # Store for later tests
        global initial_broken_count
        initial_broken_count = summary['totalMissing']
        
        return print_result(True, f"Endpoint working correctly, found {summary['totalMissing']} broken media")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_5b_trigger_broken_state():
    """Test 5b: Trigger broken state by updating product with non-existent images"""
    print_test("5b", "Trigger broken state")
    
    try:
        # Apply command to break plaid-sylvestre images
        command = {
            "command": {
                "id": "test-break",
                "type": "update_product",
                "label": "break images for test",
                "severity": "light",
                "patch": {
                    "images": [
                        "/api/img/upload-NOTEXIST-1",
                        "/api/img/upload-NOTEXIST-2"
                    ]
                },
                "targetId": "plaid-sylvestre"
            },
            "session_id": "break-test"
        }
        
        response = session.post(
            f"{BASE_URL}/chat/apply",
            json=command,
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Failed to apply break command: {response.status_code} - {response.text}")
        
        print("   ✓ Applied command to break plaid-sylvestre images")
        
        # Check broken-media again
        response2 = session.get(f"{BASE_URL}/admin/broken-media", timeout=60)
        if response2.status_code != 200:
            return print_result(False, f"Failed to get broken-media: {response2.status_code}")
        
        data = response2.json()
        summary = data.get('summary', {})
        
        if summary.get('totalMissing', 0) < 2:
            return print_result(False, f"Expected at least 2 broken images, got {summary.get('totalMissing')}")
        
        # Find plaid-sylvestre in products
        products = data.get('products', [])
        plaid = next((p for p in products if p['slug'] == 'plaid-sylvestre'), None)
        
        if not plaid:
            return print_result(False, "plaid-sylvestre not found in broken products")
        
        broken = plaid.get('broken', [])
        if len(broken) < 2:
            return print_result(False, f"Expected 2 broken slots, got {len(broken)}")
        
        # Verify slots are images:0 and images:1
        slots = [b['slot'] for b in broken]
        if 'images:0' not in slots or 'images:1' not in slots:
            return print_result(False, f"Expected images:0 and images:1, got {slots}")
        
        return print_result(True, f"Broken state triggered: plaid-sylvestre has {len(broken)} broken images at slots {slots}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_6_post_broken_media_replace():
    """Test 6: POST /api/admin/broken-media (replace)"""
    print_test(6, "POST /api/admin/broken-media (replace)")
    
    try:
        # Test without admin (should be 401)
        no_auth_session = requests.Session()
        test_image_path = "/app/lib/product-images/ambiance-lin.jpeg"
        with open(test_image_path, 'rb') as f:
            files = {'file': ('replacement.jpg', f, 'image/jpeg')}
            data = {'slug': 'plaid-sylvestre', 'slot': 'images:0'}
            response_no_auth = no_auth_session.post(
                f"{BASE_URL}/admin/broken-media",
                files=files,
                data=data,
                timeout=60
            )
        
        if response_no_auth.status_code != 401:
            return print_result(False, f"Expected 401 without admin, got {response_no_auth.status_code}")
        
        print("   ✓ Returns 401 without admin auth")
        
        # Test with admin - replace images:0
        with open(test_image_path, 'rb') as f:
            files = {'file': ('replacement.jpg', f, 'image/jpeg')}
            data = {'slug': 'plaid-sylvestre', 'slot': 'images:0'}
            response = session.post(
                f"{BASE_URL}/admin/broken-media",
                files=files,
                data=data,
                timeout=60
            )
        
        if response.status_code != 200:
            return print_result(False, f"Replace failed: {response.status_code} - {response.text}")
        
        result = response.json()
        
        if not result.get('ok'):
            return print_result(False, f"Replace returned ok=false")
        
        new_url = result.get('url', '')
        if not new_url.startswith('/api/img/'):
            return print_result(False, f"Invalid URL returned: {new_url}")
        
        print(f"   ✓ Replace successful: {new_url}")
        
        # Verify the new URL is accessible
        img_name = new_url.replace('/api/img/', '')
        img_response = session.get(f"{BASE_URL}/img/{img_name}", timeout=30)
        if img_response.status_code != 200:
            return print_result(False, f"New image not accessible: {img_response.status_code}")
        
        print(f"   ✓ New image accessible via GET")
        
        # Verify the product was updated
        # Check via broken-media endpoint
        response2 = session.get(f"{BASE_URL}/admin/broken-media", timeout=60)
        if response2.status_code != 200:
            return print_result(False, f"Failed to verify update: {response2.status_code}")
        
        data2 = response2.json()
        products = data2.get('products', [])
        plaid = next((p for p in products if p['slug'] == 'plaid-sylvestre'), None)
        
        if plaid:
            broken = plaid.get('broken', [])
            # Should now have only 1 broken image (images:1)
            if len(broken) != 1:
                return print_result(False, f"Expected 1 broken image after replace, got {len(broken)}")
            if broken[0]['slot'] != 'images:1':
                return print_result(False, f"Expected images:1 to be broken, got {broken[0]['slot']}")
            print(f"   ✓ Product updated: 1 broken image remaining (images:1)")
        else:
            # If plaid not in broken products, it means all images are fixed (shouldn't happen yet)
            return print_result(False, "plaid-sylvestre not found in broken products (expected 1 broken)")
        
        # Test missing params
        response3 = session.post(f"{BASE_URL}/admin/broken-media", data={}, timeout=30)
        if response3.status_code != 400:
            return print_result(False, f"Expected 400 for missing params, got {response3.status_code}")
        
        print(f"   ✓ Returns 400 for missing params")
        
        # Test unsupported extension
        with open('/app/package.json', 'rb') as f:
            files = {'file': ('test.exe', f, 'application/octet-stream')}
            data = {'slug': 'plaid-sylvestre', 'slot': 'images:1'}
            response4 = session.post(
                f"{BASE_URL}/admin/broken-media",
                files=files,
                data=data,
                timeout=60
            )
        
        if response4.status_code != 400:
            return print_result(False, f"Expected 400 for unsupported extension, got {response4.status_code}")
        
        print(f"   ✓ Returns 400 for unsupported extension")
        
        return print_result(True, "Replace endpoint working correctly with all validations")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_7_cleanup_and_restore():
    """Test 7: Cleanup and restore"""
    print_test(7, "Cleanup and restore")
    
    try:
        # Restore plaid-sylvestre images
        command = {
            "command": {
                "id": "restore",
                "type": "update_product",
                "label": "restore images",
                "severity": "light",
                "patch": {
                    "images": [
                        "/api/img/jlt-plaid-01",
                        "/api/img/jlt-plaid-02",
                        "/api/img/jlt-plaid-03"
                    ]
                },
                "targetId": "plaid-sylvestre"
            },
            "session_id": "cleanup"
        }
        
        response = session.post(
            f"{BASE_URL}/chat/apply",
            json=command,
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Failed to restore: {response.status_code} - {response.text}")
        
        print("   ✓ Restore command applied")
        
        # Verify broken-media returns 0
        response2 = session.get(f"{BASE_URL}/admin/broken-media", timeout=60)
        if response2.status_code != 200:
            return print_result(False, f"Failed to verify: {response2.status_code}")
        
        data = response2.json()
        summary = data.get('summary', {})
        
        # Check if plaid-sylvestre still has broken images
        products = data.get('products', [])
        plaid = next((p for p in products if p['slug'] == 'plaid-sylvestre'), None)
        
        if plaid:
            broken = plaid.get('broken', [])
            return print_result(False, f"plaid-sylvestre still has {len(broken)} broken images after restore")
        
        print(f"   ✓ plaid-sylvestre no longer in broken products list")
        print(f"   ✓ Total missing media: {summary.get('totalMissing', 0)}")
        
        return print_result(True, f"Cleanup successful: plaid-sylvestre restored, total missing: {summary.get('totalMissing', 0)}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ATELIER JLT - MEDIA PERSISTENCE & RECOVERY TOOL - BACKEND TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing environment: Preview")
    print("="*80)
    
    # Initialize globals
    global uploaded_filename, uploaded_url, initial_broken_count
    uploaded_filename = None
    uploaded_url = None
    initial_broken_count = 0
    
    results = []
    
    # Setup: Admin login
    if not admin_login():
        print("\n❌ FATAL: Admin login failed. Cannot continue tests.")
        sys.exit(1)
    
    # Run tests
    results.append(("Test 1: Upload stores in MongoDB", test_1_upload_stores_in_mongodb()))
    results.append(("Test 2: MongoDB fallback after disk deletion", test_2_mongodb_fallback_after_disk_deletion()))
    results.append(("Test 3: Non-existent file returns 404", test_3_nonexistent_file_returns_404()))
    results.append(("Test 4: Path traversal blocked", test_4_path_traversal_blocked()))
    results.append(("Test 5: GET /api/admin/broken-media", test_5_get_broken_media()))
    results.append(("Test 5b: Trigger broken state", test_5b_trigger_broken_state()))
    results.append(("Test 6: POST /api/admin/broken-media (replace)", test_6_post_broken_media_replace()))
    results.append(("Test 7: Cleanup and restore", test_7_cleanup_and_restore()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({100*passed//total}%)")
    print("="*80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Media persistence & recovery tool is FULLY FUNCTIONAL")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
