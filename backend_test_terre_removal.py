#!/usr/bin/env python3
"""
Backend test for Atelier JLT - Terre Collection Removal + Reset Product Photos Feature
Tests the removal of 'terre' category from public API and the new reset-product-photos endpoint
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

# ============ TERRE COLLECTION REMOVAL TESTS ============

def test_1_products_count_and_no_terre():
    """Test 1: GET /api/products returns 11 products (no terre)"""
    print_test(1, "GET /api/products returns 11 products (no terre category)")
    
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        
        # Count products by category
        categories = {}
        for p in products:
            cat = p.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        print(f"   Total products: {total}")
        print(f"   Categories distribution: {categories}")
        
        # Check no terre products
        if 'terre' in categories:
            return print_result(False, f"Found {categories['terre']} products with category 'terre' (should be 0)")
        
        # Check total is 11 (15 - 4 terre products)
        if total != 11:
            return print_result(False, f"Expected 11 products, got {total}")
        
        if len(products) != 11:
            return print_result(False, f"Expected 11 products in array, got {len(products)}")
        
        return print_result(True, f"Correct: 11 products returned, 0 terre products. Distribution: {categories}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_2_filter_by_terre_empty():
    """Test 2: GET /api/products?cat=terre returns empty array"""
    print_test(2, "GET /api/products?cat=terre returns empty array")
    
    try:
        response = requests.get(f"{BASE_URL}/products?cat=terre", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        
        if total != 0:
            return print_result(False, f"Expected total=0, got {total}")
        
        if len(products) != 0:
            return print_result(False, f"Expected empty array, got {len(products)} products")
        
        return print_result(True, "Correct: empty array returned for cat=terre")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_3_terre_product_photophore_404():
    """Test 3: GET /api/products/photophore-terre returns 404"""
    print_test(3, "GET /api/products/photophore-terre returns 404")
    
    try:
        response = requests.get(f"{BASE_URL}/products/photophore-terre", timeout=30)
        
        if response.status_code != 404:
            return print_result(False, f"Expected 404, got {response.status_code}")
        
        return print_result(True, "Correct: 404 returned for photophore-terre")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_4_terre_product_vase_404():
    """Test 4: GET /api/products/vase-tourne-grand returns 404"""
    print_test(4, "GET /api/products/vase-tourne-grand returns 404")
    
    try:
        response = requests.get(f"{BASE_URL}/products/vase-tourne-grand", timeout=30)
        
        if response.status_code != 404:
            return print_result(False, f"Expected 404, got {response.status_code}")
        
        return print_result(True, "Correct: 404 returned for vase-tourne-grand")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_5_terre_product_bol_404():
    """Test 5: GET /api/products/bol-racine returns 404"""
    print_test(5, "GET /api/products/bol-racine returns 404")
    
    try:
        response = requests.get(f"{BASE_URL}/products/bol-racine", timeout=30)
        
        if response.status_code != 404:
            return print_result(False, f"Expected 404, got {response.status_code}")
        
        return print_result(True, "Correct: 404 returned for bol-racine")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_6_terre_product_coupe_404():
    """Test 6: GET /api/products/coupe-ecorce returns 404"""
    print_test(6, "GET /api/products/coupe-ecorce returns 404")
    
    try:
        response = requests.get(f"{BASE_URL}/products/coupe-ecorce", timeout=30)
        
        if response.status_code != 404:
            return print_result(False, f"Expected 404, got {response.status_code}")
        
        return print_result(True, "Correct: 404 returned for coupe-ecorce")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_7_racine_still_works():
    """Test 7: GET /api/products?cat=racine still returns products"""
    print_test(7, "GET /api/products?cat=racine still returns products")
    
    try:
        response = requests.get(f"{BASE_URL}/products?cat=racine", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        
        if total == 0:
            return print_result(False, "Expected products, got 0")
        
        # Should have 6 racine products
        if total != 6:
            return print_result(False, f"Expected 6 racine products, got {total}")
        
        # Verify all are racine
        for p in products:
            if p.get('category') != 'racine':
                return print_result(False, f"Found non-racine product: {p.get('slug')}")
        
        return print_result(True, f"Correct: {total} racine products returned")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_8_empreinte_still_works():
    """Test 8: GET /api/products?cat=empreinte still returns products"""
    print_test(8, "GET /api/products?cat=empreinte still returns products")
    
    try:
        response = requests.get(f"{BASE_URL}/products?cat=empreinte", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        
        if total == 0:
            return print_result(False, "Expected products, got 0")
        
        # Should have 5 empreinte products
        if total != 5:
            return print_result(False, f"Expected 5 empreinte products, got {total}")
        
        # Verify all are empreinte
        for p in products:
            if p.get('category') != 'empreinte':
                return print_result(False, f"Found non-empreinte product: {p.get('slug')}")
        
        return print_result(True, f"Correct: {total} empreinte products returned")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_9_site_content_still_works():
    """Test 9: GET /api/site-content still works"""
    print_test(9, "GET /api/site-content still works")
    
    try:
        response = requests.get(f"{BASE_URL}/site-content", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        
        if 'content' not in data:
            return print_result(False, "Missing 'content' in response")
        
        return print_result(True, "site-content endpoint working correctly")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============ RESET PRODUCT PHOTOS FEATURE TESTS ============

def test_10_reset_photos_without_admin_401():
    """Test 10: POST /api/admin/reset-product-photos without admin returns 401"""
    print_test(10, "POST /api/admin/reset-product-photos without admin returns 401")
    
    try:
        no_auth_session = requests.Session()
        response = no_auth_session.post(
            f"{BASE_URL}/admin/reset-product-photos",
            json={"slug": "plaid-sylvestre"},
            timeout=30
        )
        
        if response.status_code != 401:
            return print_result(False, f"Expected 401, got {response.status_code}")
        
        return print_result(True, "Correct: 401 returned without admin auth")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_11_reset_photos_with_admin():
    """Test 11: POST /api/admin/reset-product-photos with admin cookie works"""
    print_test(11, "POST /api/admin/reset-product-photos with admin cookie")
    
    try:
        response = session.post(
            f"{BASE_URL}/admin/reset-product-photos",
            json={"slug": "plaid-sylvestre"},
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        
        # Verify response structure
        if not data.get('ok'):
            return print_result(False, f"Response ok=false: {data.get('error', 'unknown error')}")
        
        # Should have actionId for undo
        action_id = data.get('actionId')
        if not action_id:
            return print_result(False, "Missing actionId in response")
        
        # Should have before and after
        before = data.get('before')
        after = data.get('after')
        
        if before is None:
            return print_result(False, "Missing 'before' in response")
        
        if after is None:
            return print_result(False, "Missing 'after' in response")
        
        print(f"   ✓ actionId: {action_id}")
        print(f"   ✓ before: {type(before).__name__}")
        print(f"   ✓ after: {type(after).__name__}")
        
        # Store actionId for undo test
        global reset_action_id
        reset_action_id = action_id
        
        return print_result(True, f"Reset successful with actionId={action_id}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_12_product_still_works_after_reset():
    """Test 12: GET /api/products/plaid-sylvestre still works after reset"""
    print_test(12, "GET /api/products/plaid-sylvestre still works after reset")
    
    try:
        response = requests.get(f"{BASE_URL}/products/plaid-sylvestre", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        product = data.get('product')
        
        if not product:
            return print_result(False, "Missing 'product' in response")
        
        # Verify product has images
        images = product.get('images', [])
        if len(images) == 0:
            return print_result(False, "Product has no images after reset")
        
        # Verify images are catalog images (should start with /api/img/jlt-)
        first_image = images[0]
        if not first_image.startswith('/api/img/jlt-'):
            return print_result(False, f"First image is not a catalog image: {first_image}")
        
        print(f"   ✓ Product has {len(images)} images")
        print(f"   ✓ First image: {first_image}")
        
        return print_result(True, f"Product working correctly after reset with {len(images)} catalog images")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_13_reset_photos_nonexistent_slug():
    """Test 13: POST /api/admin/reset-product-photos with non-existent slug"""
    print_test(13, "POST /api/admin/reset-product-photos with non-existent slug")
    
    try:
        response = session.post(
            f"{BASE_URL}/admin/reset-product-photos",
            json={"slug": "nonexistent-product-slug-12345"},
            timeout=30
        )
        
        # Should return 200 with ok:true or 400 with error (both are acceptable)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Returned 200 with ok={data.get('ok')}")
            return print_result(True, f"Handled non-existent slug gracefully: {response.status_code}")
        elif response.status_code == 400:
            print(f"   ✓ Returned 400 (product not found)")
            return print_result(True, f"Handled non-existent slug with 400 error")
        else:
            return print_result(False, f"Unexpected status code: {response.status_code}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_14_undo_reset_action():
    """Test 14: POST /api/chat/actions to undo reset"""
    print_test(14, "POST /api/chat/actions to undo reset")
    
    try:
        if not reset_action_id:
            return print_result(False, "No actionId from test 11")
        
        response = session.post(
            f"{BASE_URL}/chat/actions",
            json={"actionId": reset_action_id},
            timeout=30
        )
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code} - {response.text}")
        
        data = response.json()
        
        if not data.get('ok'):
            return print_result(False, f"Undo failed: {data.get('error', 'unknown error')}")
        
        print(f"   ✓ Undo successful for actionId={reset_action_id}")
        
        return print_result(True, "Undo action successful")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

# ============ GENERAL REGRESSION TESTS ============

def test_15_products_endpoint():
    """Test 15: GET /api/products returns 200"""
    print_test(15, "GET /api/products returns 200 (regression)")
    
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code}")
        
        data = response.json()
        if 'products' not in data or 'total' not in data:
            return print_result(False, "Missing required fields in response")
        
        return print_result(True, f"Products endpoint working: {data.get('total')} products")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_16_product_detail_endpoint():
    """Test 16: GET /api/products/plaid-sylvestre returns 200"""
    print_test(16, "GET /api/products/plaid-sylvestre returns 200 (regression)")
    
    try:
        response = requests.get(f"{BASE_URL}/products/plaid-sylvestre", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code}")
        
        data = response.json()
        if 'product' not in data:
            return print_result(False, "Missing 'product' in response")
        
        product = data['product']
        if product.get('slug') != 'plaid-sylvestre':
            return print_result(False, f"Wrong product returned: {product.get('slug')}")
        
        return print_result(True, f"Product detail working: {product.get('name')}")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_17_cart_endpoint():
    """Test 17: GET /api/cart returns 200"""
    print_test(17, "GET /api/cart returns 200 (regression)")
    
    try:
        response = requests.get(f"{BASE_URL}/cart", timeout=30)
        
        if response.status_code != 200:
            return print_result(False, f"Failed: {response.status_code}")
        
        data = response.json()
        if 'items' not in data or 'count' not in data or 'subtotal' not in data:
            return print_result(False, "Missing required fields in response")
        
        return print_result(True, f"Cart endpoint working: {data.get('count')} items")
        
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ATELIER JLT - TERRE COLLECTION REMOVAL + RESET PRODUCT PHOTOS - BACKEND TESTS")
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
    print("PART 1: TERRE COLLECTION REMOVAL TESTS")
    print("="*80)
    
    results.append(("Test 1: Products count (11, no terre)", test_1_products_count_and_no_terre()))
    results.append(("Test 2: Filter cat=terre returns empty", test_2_filter_by_terre_empty()))
    results.append(("Test 3: photophore-terre returns 404", test_3_terre_product_photophore_404()))
    results.append(("Test 4: vase-tourne-grand returns 404", test_4_terre_product_vase_404()))
    results.append(("Test 5: bol-racine returns 404", test_5_terre_product_bol_404()))
    results.append(("Test 6: coupe-ecorce returns 404", test_6_terre_product_coupe_404()))
    results.append(("Test 7: cat=racine still works", test_7_racine_still_works()))
    results.append(("Test 8: cat=empreinte still works", test_8_empreinte_still_works()))
    results.append(("Test 9: site-content still works", test_9_site_content_still_works()))
    
    print("\n" + "="*80)
    print("PART 2: RESET PRODUCT PHOTOS FEATURE TESTS")
    print("="*80)
    
    results.append(("Test 10: Reset without admin (401)", test_10_reset_photos_without_admin_401()))
    results.append(("Test 11: Reset with admin", test_11_reset_photos_with_admin()))
    results.append(("Test 12: Product works after reset", test_12_product_still_works_after_reset()))
    results.append(("Test 13: Reset non-existent slug", test_13_reset_photos_nonexistent_slug()))
    results.append(("Test 14: Undo reset action", test_14_undo_reset_action()))
    
    print("\n" + "="*80)
    print("PART 3: GENERAL REGRESSION TESTS")
    print("="*80)
    
    results.append(("Test 15: GET /api/products", test_15_products_endpoint()))
    results.append(("Test 16: GET /api/products/plaid-sylvestre", test_16_product_detail_endpoint()))
    results.append(("Test 17: GET /api/cart", test_17_cart_endpoint()))
    
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
        print("\n🎉 ALL TESTS PASSED")
        print("✅ Terre collection successfully hidden from public API")
        print("✅ Reset product photos feature working correctly")
        print("✅ No regressions in core functionality")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
