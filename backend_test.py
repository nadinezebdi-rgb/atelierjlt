#!/usr/bin/env python3
"""
Backend test for Atelier JLT - Image Fallback Feature + Regression Tests
Tests the new fallback feature for missing upload-* images
"""

import requests
import json
import sys

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

def test_1_real_image_no_fallback():
    """Test 1: Real image returns 200 with NO X-Fallback-Image header"""
    print_test(1, "GET /api/img/jlt-plaid-01 → 200, real image, NO X-Fallback-Image header")
    
    try:
        response = session.get(f"{BASE_URL}/img/jlt-plaid-01", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}")
        
        # Check Content-Type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return print_result(False, f"Expected image/* Content-Type, got '{content_type}'")
        
        # Check NO X-Fallback-Image header
        if 'X-Fallback-Image' in response.headers:
            return print_result(False, f"X-Fallback-Image header should NOT be present for real images")
        
        # Check non-empty body
        if len(response.content) < 1000:
            return print_result(False, f"Image content too small: {len(response.content)} bytes")
        
        return print_result(True, f"Real image served correctly: {len(response.content)} bytes, Content-Type: {content_type}, NO X-Fallback-Image header")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_2_upload_missing_fallback():
    """Test 2: Missing upload-* image returns 200 with fallback"""
    print_test(2, "GET /api/img/upload-a48de122 → 200 with fallback (X-Fallback-Image: 1)")
    
    try:
        response = session.get(f"{BASE_URL}/img/upload-a48de122", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200 (fallback), got {response.status_code}")
        
        # Check Content-Type
        content_type = response.headers.get('Content-Type', '')
        if content_type != 'image/jpeg':
            return print_result(False, f"Expected 'image/jpeg', got '{content_type}'")
        
        # Check X-Fallback-Image header
        fallback_header = response.headers.get('X-Fallback-Image', '')
        if fallback_header != '1':
            return print_result(False, f"Expected X-Fallback-Image: 1, got '{fallback_header}'")
        
        # Check non-empty body
        if len(response.content) < 1000:
            return print_result(False, f"Fallback image content too small: {len(response.content)} bytes")
        
        return print_result(True, f"Fallback served correctly: {len(response.content)} bytes, Content-Type: {content_type}, X-Fallback-Image: 1")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_3_upload_missing_fallback_2():
    """Test 3: Another missing upload-* image returns 200 with fallback"""
    print_test(3, "GET /api/img/upload-does-not-exist-xyz → 200 with fallback")
    
    try:
        response = session.get(f"{BASE_URL}/img/upload-does-not-exist-xyz", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200 (fallback), got {response.status_code}")
        
        # Check X-Fallback-Image header
        fallback_header = response.headers.get('X-Fallback-Image', '')
        if fallback_header != '1':
            return print_result(False, f"Expected X-Fallback-Image: 1, got '{fallback_header}'")
        
        # Check non-empty body
        if len(response.content) < 1000:
            return print_result(False, f"Fallback image content too small: {len(response.content)} bytes")
        
        return print_result(True, f"Fallback served correctly: {len(response.content)} bytes, X-Fallback-Image: 1")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_4_nonupload_missing_404():
    """Test 4: Missing non-upload-* image returns 404"""
    print_test(4, "GET /api/img/nonexistent-thing-no-upload-prefix → 404 (no fallback)")
    
    try:
        response = session.get(f"{BASE_URL}/img/nonexistent-thing-no-upload-prefix", timeout=30)
        
        if response.status_code != 404:
            return print_result(False, f"Expected 404, got {response.status_code}")
        
        # Should NOT have X-Fallback-Image header
        if 'X-Fallback-Image' in response.headers:
            return print_result(False, f"X-Fallback-Image header should NOT be present for 404 responses")
        
        return print_result(True, f"Correctly returns 404 for non-upload-* missing images")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_5_query_params():
    """Test 5: Real image with query params still works"""
    print_test(5, "GET /api/img/jlt-plaid-01?xyz=1 → 200 (query params ignored)")
    
    try:
        response = session.get(f"{BASE_URL}/img/jlt-plaid-01?xyz=1", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}")
        
        # Check Content-Type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return print_result(False, f"Expected image/* Content-Type, got '{content_type}'")
        
        # Check NO X-Fallback-Image header
        if 'X-Fallback-Image' in response.headers:
            return print_result(False, f"X-Fallback-Image header should NOT be present for real images")
        
        # Check non-empty body
        if len(response.content) < 1000:
            return print_result(False, f"Image content too small: {len(response.content)} bytes")
        
        return print_result(True, f"Real image served correctly with query params: {len(response.content)} bytes")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_6_products_api():
    """Test 6: GET /api/products returns products, no 'terre' category"""
    print_test(6, "REGRESSION: GET /api/products → 200, products returned, no 'terre' category")
    
    try:
        response = session.get(f"{BASE_URL}/products", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if 'products' not in data:
            return print_result(False, f"Missing 'products' in response")
        
        products = data.get('products', [])
        total = data.get('total', 0)
        
        if len(products) == 0:
            return print_result(False, f"No products returned")
        
        # Check no 'terre' category
        terre_products = [p for p in products if p.get('category') == 'terre']
        if len(terre_products) > 0:
            return print_result(False, f"Found {len(terre_products)} products with 'terre' category (should be hidden)")
        
        return print_result(True, f"Products API working: {len(products)} products returned (total: {total}), no 'terre' category")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_7_product_detail():
    """Test 7: GET /api/products/plaid-sylvestre returns product detail"""
    print_test(7, "REGRESSION: GET /api/products/plaid-sylvestre → 200")
    
    try:
        response = session.get(f"{BASE_URL}/products/plaid-sylvestre", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}")
        
        data = response.json()
        
        if 'product' not in data:
            return print_result(False, f"Missing 'product' in response")
        
        product = data.get('product', {})
        
        if product.get('slug') != 'plaid-sylvestre':
            return print_result(False, f"Expected slug 'plaid-sylvestre', got '{product.get('slug')}'")
        
        return print_result(True, f"Product detail working: {product.get('name', 'N/A')}, price: {product.get('price', 0)}€")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_8_reset_product_photos():
    """Test 8: POST /api/admin/reset-product-photos returns actionId"""
    print_test(8, "REGRESSION: POST /api/admin/reset-product-photos → 200 with actionId")
    
    try:
        response = session.post(
            f"{BASE_URL}/admin/reset-product-photos",
            json={"slug": "plaid-sylvestre"},
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code} - {response.text}")
        
        data = response.json()
        
        if not data.get('ok'):
            return print_result(False, f"Expected ok: true, got {data}")
        
        action_id = data.get('actionId')
        if not action_id:
            return print_result(False, f"Missing 'actionId' in response")
        
        # Store for next test
        global reset_action_id
        reset_action_id = action_id
        
        return print_result(True, f"Reset product photos working: actionId={action_id}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_9_undo_action():
    """Test 9: POST /api/chat/actions with actionId undoes the action"""
    print_test(9, "REGRESSION: POST /api/chat/actions (undo) → 200")
    
    try:
        if not reset_action_id:
            return print_result(False, "No actionId from test 8")
        
        response = session.post(
            f"{BASE_URL}/chat/actions",
            json={"actionId": reset_action_id},
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code} - {response.text}")
        
        data = response.json()
        
        if not data.get('ok'):
            return print_result(False, f"Expected ok: true, got {data}")
        
        return print_result(True, f"Undo action working: {data.get('message', 'Action annulée')}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ATELIER JLT - IMAGE FALLBACK FEATURE + REGRESSION TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing environment: Preview")
    print("="*80)
    
    # Initialize globals
    global reset_action_id
    reset_action_id = None
    
    results = []
    
    # Setup: Admin login
    if not admin_login():
        print("\n❌ FATAL: Admin login failed. Cannot continue tests.")
        sys.exit(1)
    
    # Run tests
    print("\n" + "="*80)
    print("PART 1: IMAGE FALLBACK FEATURE TESTS")
    print("="*80)
    results.append(("Test 1: Real image no fallback", test_1_real_image_no_fallback()))
    results.append(("Test 2: Missing upload-* with fallback", test_2_upload_missing_fallback()))
    results.append(("Test 3: Another missing upload-* with fallback", test_3_upload_missing_fallback_2()))
    results.append(("Test 4: Non-upload-* missing returns 404", test_4_nonupload_missing_404()))
    results.append(("Test 5: Query params work", test_5_query_params()))
    
    print("\n" + "="*80)
    print("PART 2: REGRESSION TESTS")
    print("="*80)
    results.append(("Test 6: Products API", test_6_products_api()))
    results.append(("Test 7: Product detail", test_7_product_detail()))
    results.append(("Test 8: Reset product photos", test_8_reset_product_photos()))
    results.append(("Test 9: Undo action", test_9_undo_action()))
    
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
        print("\n🎉 ALL TESTS PASSED - Image fallback feature working correctly, no regressions")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
