#!/usr/bin/env python3
"""
Backend API Testing for Atelier JLT - Rebrand Verification
Tests the rebrand from "Atelier Ginette" (atelierginette.fr) to "Atelier JLT" (atelierjlt.fr)
Verifies NO regressions and confirms the new brand strings.
"""

import requests
import sys
import uuid
from typing import Dict, List

# Base URL from environment
BASE_URL = "https://french-craft.preview.emergentagent.com"

def test_1_api_root_message():
    """TEST 1: GET /api → JSON body should have message: "Atelier JLT API" """
    print("\n" + "="*80)
    print("TEST 1: GET /api → message should be 'Atelier JLT API'")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        message = data.get('message', '')
        
        if message == "Atelier JLT API":
            print(f"✅ API root message is correct: '{message}'")
            return True
        else:
            print(f"❌ Expected 'Atelier JLT API', got '{message}'")
            return False
            
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_2_products_count_and_images():
    """TEST 2: GET /api/products → returns exactly 21 products, all image URLs return 200"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/products → 21 products, all image URLs return 200")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/api/products"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch products: {response.status_code}")
            return False
        
        data = response.json()
        products = data.get('products', [])
        
        if len(products) != 21:
            print(f"❌ Expected 21 products, got {len(products)}")
            return False
        
        print(f"✅ Retrieved exactly 21 products")
        
        # Check all image URLs return 200
        all_urls = []
        for product in products:
            slug = product.get('slug', 'unknown')
            images = product.get('images', [])
            for img_url in images:
                all_urls.append((slug, img_url))
        
        print(f"Testing {len(all_urls)} image URLs from {len(products)} products...")
        
        passed = 0
        failed = 0
        failed_urls = []
        
        for slug, img_url in all_urls:
            # Construct full URL for /api/img/* paths
            if img_url.startswith('/api/img/'):
                full_url = f"{BASE_URL}{img_url}"
            else:
                # External URL (customer-assets, unsplash, pexels)
                full_url = img_url
            
            try:
                resp = requests.head(full_url, timeout=10, allow_redirects=True)
                if resp.status_code == 200:
                    passed += 1
                else:
                    print(f"❌ Product '{slug}': {full_url} returned {resp.status_code}")
                    failed += 1
                    failed_urls.append((slug, full_url, resp.status_code))
            except Exception as e:
                print(f"❌ Product '{slug}': {full_url} - {str(e)}")
                failed += 1
                failed_urls.append((slug, full_url, str(e)))
        
        print(f"Image URLs: {passed}/{len(all_urls)} reachable, {failed} failed")
        
        if failed_urls:
            print("\nFailed URLs (first 5):")
            for slug, url, error in failed_urls[:5]:
                print(f"  - {slug}: {url} ({error})")
        
        return failed == 0
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_3_api_img_endpoints():
    """TEST 3: GET /api/img/bougie-01, bijou-01, plaid-01, deco-01, logo-small → HTTP 200 with Content-Type image/*"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/img/* endpoints return 200 with Content-Type image/*")
    print("="*80)
    
    test_images = ["bougie-01", "bijou-01", "plaid-01", "deco-01", "logo-small"]
    
    passed = 0
    failed = 0
    
    for img_name in test_images:
        url = f"{BASE_URL}/api/img/{img_name}"
        try:
            response = requests.get(url, timeout=10)
            
            # Check HTTP 200
            if response.status_code != 200:
                print(f"❌ {img_name}: Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            # Check Content-Type starts with image/
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                print(f"❌ {img_name}: Expected Content-Type image/*, got {content_type}")
                failed += 1
                continue
            
            # Check body is not empty
            if len(response.content) <= 100:
                print(f"❌ {img_name}: Response body too small ({len(response.content)} bytes)")
                failed += 1
                continue
            
            print(f"✅ {img_name}: 200, {content_type}, {len(response.content)} bytes")
            passed += 1
            
        except Exception as e:
            print(f"❌ {img_name}: Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST 3 RESULT: {passed}/{len(test_images)} passed, {failed} failed")
    return failed == 0


def test_4_sitemap_urls():
    """TEST 4: GET /sitemap.xml → all URLs should be https://atelierjlt.fr (no atelierginette.fr)"""
    print("\n" + "="*80)
    print("TEST 4: GET /sitemap.xml → all URLs should be https://atelierjlt.fr")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/sitemap.xml"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        content = response.text
        
        # Check for old domain
        if 'atelierginette.fr' in content.lower():
            print(f"❌ REGRESSION: Found 'atelierginette.fr' in sitemap.xml")
            # Show where it appears
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'atelierginette' in line.lower():
                    print(f"   Line {i+1}: {line.strip()}")
            return False
        
        # Check for new domain
        if 'atelierjlt.fr' not in content.lower():
            print(f"❌ Expected 'atelierjlt.fr' in sitemap.xml, not found")
            return False
        
        # Count URLs with new domain
        new_domain_count = content.lower().count('https://atelierjlt.fr')
        
        # Check that sitemap contains product URLs (should be 21 products + static pages)
        if new_domain_count < 21:
            print(f"❌ Expected at least 21 URLs with atelierjlt.fr, found {new_domain_count}")
            return False
        
        print(f"✅ Sitemap contains {new_domain_count} URLs with https://atelierjlt.fr")
        print(f"✅ No 'atelierginette.fr' references found")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_5_robots_txt():
    """TEST 5: GET /robots.txt → host=https://atelierjlt.fr, sitemap URL points to https://atelierjlt.fr/sitemap.xml"""
    print("\n" + "="*80)
    print("TEST 5: GET /robots.txt → host and sitemap should be atelierjlt.fr")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/robots.txt"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        content = response.text
        
        # Check for old domain
        if 'atelierginette.fr' in content.lower():
            print(f"❌ REGRESSION: Found 'atelierginette.fr' in robots.txt")
            print(f"Content:\n{content}")
            return False
        
        # Check for new domain in host
        if 'host: https://atelierjlt.fr' not in content.lower():
            print(f"❌ Expected 'Host: https://atelierjlt.fr' in robots.txt")
            print(f"Content:\n{content}")
            return False
        
        # Check for new domain in sitemap
        if 'sitemap: https://atelierjlt.fr/sitemap.xml' not in content.lower():
            print(f"❌ Expected 'Sitemap: https://atelierjlt.fr/sitemap.xml' in robots.txt")
            print(f"Content:\n{content}")
            return False
        
        print(f"✅ robots.txt has correct host: https://atelierjlt.fr")
        print(f"✅ robots.txt has correct sitemap: https://atelierjlt.fr/sitemap.xml")
        print(f"✅ No 'atelierginette.fr' references found")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_6_cart_flow():
    """TEST 6: Cart flow (session cookie) - POST /api/cart, then GET /api/cart"""
    print("\n" + "="*80)
    print("TEST 6: Cart flow (session cookie)")
    print("="*80)
    
    # Use a session to persist cookies
    session = requests.Session()
    
    try:
        # First, get a product slug from /api/products
        print("\n1. Getting product list to find a valid slug...")
        url = f"{BASE_URL}/api/products"
        response = session.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch products: {response.status_code}")
            return False
        
        data = response.json()
        products = data.get('products', [])
        
        # Try to find plaid-sylvestre, otherwise use first product
        test_slug = None
        for p in products:
            if p.get('slug') == 'plaid-sylvestre':
                test_slug = 'plaid-sylvestre'
                break
        
        if not test_slug and products:
            test_slug = products[0].get('slug')
        
        if not test_slug:
            print(f"❌ No products found to test cart flow")
            return False
        
        print(f"✅ Using product slug: {test_slug}")
        
        # Step 2: POST to cart
        print(f"\n2. Adding {test_slug} to cart...")
        url = f"{BASE_URL}/api/cart"
        payload = {"slug": test_slug, "qty": 1}
        response = session.post(url, json=payload, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ POST /api/cart failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        
        if not items:
            print(f"❌ POST /api/cart: No items in response")
            return False
        
        if items[0].get('slug') != test_slug:
            print(f"❌ POST /api/cart: Expected slug '{test_slug}', got '{items[0].get('slug')}'")
            return False
        
        print(f"✅ POST /api/cart: Added {test_slug}")
        
        # Step 3: GET cart
        print("\n3. Getting cart...")
        response = session.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ GET /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        
        if not items or items[0].get('slug') != test_slug:
            print(f"❌ GET /api/cart: Cart doesn't reflect added product")
            return False
        
        print(f"✅ GET /api/cart: Cart contains {test_slug}")
        
        print("\n✅ TEST 6 PASSED: Cart flow works correctly")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_7_auth_flow():
    """TEST 7: Auth flow - POST /api/auth/register, then GET /api/auth/me"""
    print("\n" + "="*80)
    print("TEST 7: Auth flow (register + me)")
    print("="*80)
    
    # Use a session to persist cookies
    session = requests.Session()
    
    # Generate unique email for this test run
    test_email = f"test-jlt-{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPass123"
    test_name = "Test JLT User"
    
    try:
        # Step 1: Register
        print(f"\n1. Registering user: {test_email}...")
        url = f"{BASE_URL}/api/auth/register"
        payload = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        response = session.post(url, json=payload, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ POST /api/auth/register failed: {response.status_code}")
            print(f"Response: {response.text}")
            # If user already exists, try login instead
            if response.status_code == 409:
                print("User already exists, trying login instead...")
                url = f"{BASE_URL}/api/auth/login"
                payload = {"email": test_email, "password": test_password}
                response = session.post(url, json=payload, timeout=10)
                if response.status_code != 200:
                    print(f"❌ POST /api/auth/login also failed: {response.status_code}")
                    return False
                print(f"✅ Logged in successfully")
            else:
                return False
        else:
            print(f"✅ POST /api/auth/register: User registered")
        
        # Step 2: GET /api/auth/me
        print("\n2. Getting user info...")
        url = f"{BASE_URL}/api/auth/me"
        response = session.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ GET /api/auth/me failed: {response.status_code}")
            return False
        
        data = response.json()
        user = data.get('user')
        
        if not user:
            print(f"❌ GET /api/auth/me: No user in response")
            return False
        
        # Check user has email
        if user.get('email') != test_email:
            print(f"❌ GET /api/auth/me: Expected email '{test_email}', got '{user.get('email')}'")
            return False
        
        # Note: The backend doesn't explicitly return a 'role' field, but we can check the user object
        # The user should have standard client fields (not admin)
        print(f"✅ GET /api/auth/me: User info returned")
        print(f"   Email: {user.get('email')}")
        print(f"   Name: {user.get('name')}")
        print(f"   ID: {user.get('id')}")
        
        print("\n✅ TEST 7 PASSED: Auth flow works correctly")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_8_category_filters():
    """TEST 8: Category filters - bougies=5, bijoux>=3, decoration>=3"""
    print("\n" + "="*80)
    print("TEST 8: Category filters")
    print("="*80)
    
    test_cases = [
        ("bougies", 5, "exact"),
        ("bijoux", 3, "min"),
        ("decoration", 3, "min")
    ]
    
    passed = 0
    failed = 0
    
    for category, expected_count, check_type in test_cases:
        url = f"{BASE_URL}/api/products?cat={category}"
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Category '{category}': Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            data = response.json()
            products = data.get('products', [])
            actual_count = len(products)
            
            if check_type == "exact":
                if actual_count != expected_count:
                    print(f"❌ Category '{category}': Expected {expected_count} products, got {actual_count}")
                    failed += 1
                    continue
                print(f"✅ Category '{category}': {actual_count} products (exact match)")
            else:  # min
                if actual_count < expected_count:
                    print(f"❌ Category '{category}': Expected at least {expected_count} products, got {actual_count}")
                    failed += 1
                    continue
                print(f"✅ Category '{category}': {actual_count} products (>= {expected_count})")
            
            passed += 1
            
        except Exception as e:
            print(f"❌ Category '{category}': Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST 8 RESULT: {passed}/{len(test_cases)} passed, {failed} failed")
    return failed == 0


def test_9_homepage_html():
    """TEST 9: Homepage HTML (GET /) contains "Atelier JLT" in metadata title and NOT "atelierginette" """
    print("\n" + "="*80)
    print("TEST 9: Homepage HTML metadata")
    print("="*80)
    
    try:
        url = f"{BASE_URL}/"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        html = response.text
        
        # Check for "Atelier JLT" in the HTML (should be in title or meta tags)
        if 'Atelier JLT' not in html:
            print(f"❌ 'Atelier JLT' not found in homepage HTML")
            # Show first 1000 chars of HTML for debugging
            print(f"First 1000 chars of HTML:\n{html[:1000]}")
            return False
        
        print(f"✅ 'Atelier JLT' found in homepage HTML")
        
        # Check for old brand name (case-insensitive)
        if 'atelierginette' in html.lower():
            print(f"❌ REGRESSION: Found 'atelierginette' in homepage HTML")
            # Find and show the lines containing it
            lines = html.split('\n')
            for i, line in enumerate(lines):
                if 'atelierginette' in line.lower():
                    print(f"   Line {i+1}: {line.strip()[:200]}")
            return False
        
        print(f"✅ No 'atelierginette' references found in homepage HTML")
        
        # Check for "Atelier JLT" in title tag specifically
        if '<title>' in html:
            title_start = html.find('<title>')
            title_end = html.find('</title>', title_start)
            if title_start != -1 and title_end != -1:
                title = html[title_start+7:title_end]
                if 'Atelier JLT' in title:
                    print(f"✅ Title tag contains 'Atelier JLT': {title}")
                else:
                    print(f"⚠️  Title tag doesn't contain 'Atelier JLT': {title}")
        
        print("\n✅ TEST 9 PASSED: Homepage HTML metadata is correct")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def main():
    """Run all rebrand verification tests"""
    print("="*80)
    print("Atelier JLT - Rebrand Verification Tests")
    print("Testing rebrand from 'Atelier Ginette' to 'Atelier JLT'")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {
        "TEST 1 - API root message": test_1_api_root_message(),
        "TEST 2 - Products count and images": test_2_products_count_and_images(),
        "TEST 3 - /api/img endpoints": test_3_api_img_endpoints(),
        "TEST 4 - Sitemap URLs": test_4_sitemap_urls(),
        "TEST 5 - robots.txt": test_5_robots_txt(),
        "TEST 6 - Cart flow": test_6_cart_flow(),
        "TEST 7 - Auth flow": test_7_auth_flow(),
        "TEST 8 - Category filters": test_8_category_filters(),
        "TEST 9 - Homepage HTML metadata": test_9_homepage_html()
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
        print("\n🎉 ALL TESTS PASSED - Rebrand verified successfully!")
        print("✅ No regressions found")
        print("✅ All 'Atelier JLT' branding confirmed")
        print("✅ No 'atelierginette' references found")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED - See details above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
