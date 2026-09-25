#!/usr/bin/env python3
"""
Bug Fix Verification for Atelier JLT
Tests the 3 reported 404 errors and verifies site restructuring to 3 collections (15 products)
"""

import requests
import sys
from typing import Dict, List, Tuple

# Base URL from environment
BASE_URL = "https://french-craft.preview.emergentagent.com"

def test_a_404_fixes():
    """TEST A: Verify all 3 reported 404s are fixed"""
    print("\n" + "="*80)
    print("TEST A: 404-fix verification")
    print("="*80)
    
    passed = 0
    failed = 0
    
    # Test 1: /favicon.ico should return 200
    print("\n1. Testing /favicon.ico...")
    try:
        response = requests.get(f"{BASE_URL}/favicon.ico", timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'image/' in content_type:
                print(f"✅ /favicon.ico returns 200 with Content-Type: {content_type}")
                passed += 1
            else:
                print(f"❌ /favicon.ico returns 200 but Content-Type is not image/*: {content_type}")
                failed += 1
        else:
            print(f"❌ /favicon.ico returns {response.status_code}, expected 200")
            failed += 1
    except Exception as e:
        print(f"❌ /favicon.ico - Exception: {str(e)}")
        failed += 1
    
    # Test 2: /wishlist should return 200 (page renders)
    print("\n2. Testing /wishlist...")
    try:
        response = requests.get(f"{BASE_URL}/wishlist", timeout=10)
        if response.status_code == 200:
            if 'text/html' in response.headers.get('Content-Type', ''):
                print(f"✅ /wishlist returns 200 with HTML content")
                passed += 1
            else:
                print(f"❌ /wishlist returns 200 but not HTML")
                failed += 1
        else:
            print(f"❌ /wishlist returns {response.status_code}, expected 200")
            failed += 1
    except Exception as e:
        print(f"❌ /wishlist - Exception: {str(e)}")
        failed += 1
    
    # Test 3: Old broken Pexels URL should be 404 (confirming it's no longer used)
    print("\n3. Testing old broken Pexels URL (should be 404)...")
    try:
        response = requests.get("https://images.pexels.com/photos/6207359/pexels-photo-6207359.jpeg", timeout=10)
        if response.status_code == 404:
            print(f"✅ Old broken Pexels URL (6207359) returns 404 (confirming it's bad)")
            passed += 1
        else:
            print(f"⚠️  Old Pexels URL returns {response.status_code} (expected 404, but not critical)")
            # Don't fail on this - it's just confirming the URL is bad
            passed += 1
    except Exception as e:
        print(f"⚠️  Old Pexels URL - Exception: {str(e)} (not critical)")
        passed += 1
    
    # Test 4: Homepage HTML should NOT contain "6207359"
    print("\n4. Testing homepage HTML for old image reference...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code == 200:
            html = response.text
            if '6207359' in html:
                print(f"❌ Homepage HTML still contains reference to '6207359'")
                failed += 1
            else:
                print(f"✅ Homepage HTML does NOT contain '6207359' (old broken image removed)")
                passed += 1
        else:
            print(f"❌ Homepage returns {response.status_code}, expected 200")
            failed += 1
    except Exception as e:
        print(f"❌ Homepage check - Exception: {str(e)}")
        failed += 1
    
    print(f"\nTEST A RESULT: {passed}/4 checks passed, {failed} failed")
    return failed == 0


def test_b_all_product_images():
    """TEST B: All product image URLs must return 200"""
    print("\n" + "="*80)
    print("TEST B: All product image URLs must return 200")
    print("="*80)
    
    try:
        # Get all products
        response = requests.get(f"{BASE_URL}/api/products", timeout=10)
        if response.status_code != 200:
            print(f"❌ Failed to fetch products: {response.status_code}")
            return False
        
        data = response.json()
        products = data.get('products', [])
        
        print(f"Retrieved {len(products)} products")
        
        # Collect all image URLs
        all_urls = []
        for product in products:
            slug = product.get('slug', 'unknown')
            images = product.get('images', [])
            for img_url in images:
                all_urls.append((slug, img_url))
        
        print(f"Testing {len(all_urls)} image URLs...")
        
        passed = 0
        failed_count = 0
        failed_urls = []
        
        for slug, img_url in all_urls:
            # Construct full URL
            if img_url.startswith('/api/img/'):
                full_url = f"{BASE_URL}{img_url}"
            elif img_url.startswith('https://'):
                full_url = img_url
            else:
                print(f"❌ Product '{slug}': Unexpected URL format: {img_url}")
                failed_count += 1
                failed_urls.append((slug, img_url, "Invalid format"))
                continue
            
            try:
                resp = requests.head(full_url, timeout=10, allow_redirects=True)
                if resp.status_code == 200:
                    passed += 1
                else:
                    print(f"❌ Product '{slug}': {full_url} returned {resp.status_code}")
                    failed_count += 1
                    failed_urls.append((slug, full_url, resp.status_code))
            except Exception as e:
                print(f"❌ Product '{slug}': {full_url} - {str(e)}")
                failed_count += 1
                failed_urls.append((slug, full_url, str(e)))
        
        print(f"\nTEST B RESULT: {passed}/{len(all_urls)} URLs return 200, {failed_count} failed (404s)")
        
        if failed_urls:
            print("\n⚠️  Failed URLs (404s found):")
            for slug, url, error in failed_urls:
                print(f"  - {slug}: {url} ({error})")
        
        return failed_count == 0
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_c_local_image_api():
    """TEST C: Local image API endpoints"""
    print("\n" + "="*80)
    print("TEST C: Local image API endpoints")
    print("="*80)
    
    image_names = [
        'jlt-couv-decli',
        'jlt-couv-fluffy',
        'jlt-couv-fluffy2',
        'jlt-photophore',
        'jlt-terra',
        'jlt-hero-deco'
    ]
    
    passed = 0
    failed = 0
    
    for name in image_names:
        url = f"{BASE_URL}/api/img/{name}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'image/' in content_type:
                    print(f"✅ /api/img/{name} returns 200, {content_type}")
                    passed += 1
                else:
                    print(f"❌ /api/img/{name} returns 200 but not an image: {content_type}")
                    failed += 1
            else:
                print(f"❌ /api/img/{name} returns {response.status_code}, expected 200")
                failed += 1
        except Exception as e:
            print(f"❌ /api/img/{name} - Exception: {str(e)}")
            failed += 1
    
    print(f"\nTEST C RESULT: {passed}/{len(image_names)} images passed, {failed} failed")
    return failed == 0


def test_d_products_by_collection():
    """TEST D: Products endpoint by collection"""
    print("\n" + "="*80)
    print("TEST D: Products endpoint by collection")
    print("="*80)
    
    test_cases = [
        ('racine', 6),
        ('empreinte', 5),
        ('terre', 4),
        (None, 15),  # All products
        ('sacs', 0),  # Should be removed
        ('bougies', 0),  # Should be removed
        ('bijoux', 0),  # Should be removed
    ]
    
    passed = 0
    failed = 0
    
    for category, expected_count in test_cases:
        if category is None:
            url = f"{BASE_URL}/api/products"
            label = "all products"
        else:
            url = f"{BASE_URL}/api/products?cat={category}"
            label = f"category '{category}'"
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                print(f"❌ {label}: Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            data = response.json()
            products = data.get('products', [])
            count = len(products)
            
            if count == expected_count:
                print(f"✅ {label}: {count} products (expected {expected_count})")
                passed += 1
            else:
                print(f"❌ {label}: {count} products, expected {expected_count}")
                failed += 1
        except Exception as e:
            print(f"❌ {label} - Exception: {str(e)}")
            failed += 1
    
    print(f"\nTEST D RESULT: {passed}/{len(test_cases)} checks passed, {failed} failed")
    return failed == 0


def test_e_homepage_content():
    """TEST E: Homepage content check"""
    print("\n" + "="*80)
    print("TEST E: Homepage content check")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code != 200:
            print(f"❌ Homepage returns {response.status_code}, expected 200")
            return False
        
        html = response.text.lower()
        
        # Required strings (case-insensitive)
        required = [
            'art discret',
            'nouvelle collection',
            'découvrir la collection',
            'racine',
            'empreinte',
            'terre'
        ]
        
        # Forbidden strings (case-insensitive)
        forbidden = [
            'bougie',
            'sac crochet',
            'bijou',
            'atelierginette'
        ]
        
        passed = 0
        failed = 0
        
        print("\nChecking required strings...")
        for text in required:
            if text in html:
                print(f"✅ Found: '{text}'")
                passed += 1
            else:
                print(f"❌ Missing: '{text}'")
                failed += 1
        
        print("\nChecking forbidden strings (should NOT be present)...")
        for text in forbidden:
            if text not in html:
                print(f"✅ Not found (good): '{text}'")
                passed += 1
            else:
                print(f"❌ Found (bad): '{text}'")
                failed += 1
        
        total_checks = len(required) + len(forbidden)
        print(f"\nTEST E RESULT: {passed}/{total_checks} checks passed, {failed} failed")
        return failed == 0
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_f_sitemap():
    """TEST F: Sitemap verification"""
    print("\n" + "="*80)
    print("TEST F: Sitemap verification")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/sitemap.xml", timeout=10)
        if response.status_code != 200:
            print(f"❌ Sitemap returns {response.status_code}, expected 200")
            return False
        
        sitemap = response.text
        
        # Required URLs
        required_urls = [
            'https://atelierjlt.fr/produit/plaid-sylvestre',
            'https://atelierjlt.fr/produit/macrame-mural-grand',
            'https://atelierjlt.fr/produit/vase-tourne-grand'
        ]
        
        # Forbidden patterns
        forbidden_patterns = [
            '/sac-crochet',
            '/bougie-'
        ]
        
        passed = 0
        failed = 0
        
        print("\nChecking required URLs...")
        for url in required_urls:
            if url in sitemap:
                print(f"✅ Found: {url}")
                passed += 1
            else:
                print(f"❌ Missing: {url}")
                failed += 1
        
        print("\nChecking forbidden patterns (should NOT be present)...")
        for pattern in forbidden_patterns:
            if pattern not in sitemap:
                print(f"✅ Not found (good): {pattern}")
                passed += 1
            else:
                print(f"❌ Found (bad): {pattern}")
                failed += 1
        
        total_checks = len(required_urls) + len(forbidden_patterns)
        print(f"\nTEST F RESULT: {passed}/{total_checks} checks passed, {failed} failed")
        return failed == 0
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_g_cart_and_auth():
    """TEST G: Cart + auth flows (no regressions)"""
    print("\n" + "="*80)
    print("TEST G: Cart + auth flows (no regressions)")
    print("="*80)
    
    session = requests.Session()
    
    try:
        # Test 1: Cart flow
        print("\n1. Testing cart flow...")
        
        # POST to cart
        response = session.post(
            f"{BASE_URL}/api/cart",
            json={"slug": "plaid-sylvestre", "qty": 1},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ POST /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        if data.get('count') != 1:
            print(f"❌ POST /api/cart: Expected count=1, got {data.get('count')}")
            return False
        
        print(f"✅ POST /api/cart: Added plaid-sylvestre")
        
        # GET cart
        response = session.get(f"{BASE_URL}/api/cart", timeout=10)
        if response.status_code != 200:
            print(f"❌ GET /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        if not items or items[0].get('slug') != 'plaid-sylvestre':
            print(f"❌ GET /api/cart: Cart doesn't contain plaid-sylvestre")
            return False
        
        print(f"✅ GET /api/cart: Cart contains plaid-sylvestre")
        
        # Test 2: Auth flow
        print("\n2. Testing auth flow...")
        
        # Register a new user
        test_email = f"test-{int(requests.get('https://httpbin.org/uuid').json()['uuid'][:8], 16)}@atelierjlt.fr"
        
        response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "MonSecret123",
                "name": "Test User"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ POST /api/auth/register: User created")
        elif response.status_code == 409:
            # User already exists, try login
            print(f"⚠️  User already exists, trying login...")
            response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": "test@atelierjlt.fr",
                    "password": "MonSecret123"
                },
                timeout=10
            )
            if response.status_code != 200:
                print(f"❌ POST /api/auth/login failed: {response.status_code}")
                return False
            print(f"✅ POST /api/auth/login: Logged in")
        else:
            print(f"❌ POST /api/auth/register failed: {response.status_code}")
            return False
        
        # GET /api/auth/me
        response = session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        if response.status_code != 200:
            print(f"❌ GET /api/auth/me failed: {response.status_code}")
            return False
        
        data = response.json()
        user = data.get('user')
        if not user or not user.get('email'):
            print(f"❌ GET /api/auth/me: No user data")
            return False
        
        print(f"✅ GET /api/auth/me: User data returned (email: {user.get('email')})")
        
        print("\n✅ TEST G PASSED: Cart and auth flows working")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def main():
    """Run all tests"""
    print("="*80)
    print("Atelier JLT - Bug Fix Verification")
    print("Testing 404 fixes and site restructuring (3 collections, 15 products)")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {
        "TEST A - 404-fix verification": test_a_404_fixes(),
        "TEST B - All product images return 200": test_b_all_product_images(),
        "TEST C - Local image API endpoints": test_c_local_image_api(),
        "TEST D - Products by collection": test_d_products_by_collection(),
        "TEST E - Homepage content check": test_e_homepage_content(),
        "TEST F - Sitemap verification": test_f_sitemap(),
        "TEST G - Cart + auth flows": test_g_cart_and_auth()
    }
    
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    failed = len(results) - passed
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{len(results)} tests passed, {failed} failed")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED - Bug fixes verified successfully!")
        print("   - No 404 errors remain")
        print("   - Site restructured to 3 collections (15 products)")
        print("   - All product images accessible")
        print("   - No regressions in cart/auth flows")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED - See details above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
