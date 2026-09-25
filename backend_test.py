#!/usr/bin/env python3
"""
Backend API Testing for GINETTE Créations - Image Serving Verification
Tests the new /api/img route that serves base64-encoded images from bundled JS module
"""

import requests
import sys
from typing import Dict, List

# Base URL from environment
BASE_URL = "https://french-craft.preview.emergentagent.com"

# All 19 image names that should be served by /api/img
IMAGE_NAMES = [
    "bijou-01", "bijou-02", "bijou-03", "bijou-04",
    "boucles-cornaline",
    "bougie-01", "bougie-02", "bougie-03", "bougie-04", "bougie-05",
    "deco-01", "deco-02", "deco-03",
    "photophore-01",
    "plaid-01", "plaid-02", "plaid-03",
    "pull-01", "pull-02"
]

# Expected MIME types
EXPECTED_MIME = {
    "boucles-cornaline": "image/webp",
    # All others are image/jpeg
}

def test_a_image_route_all_names():
    """TEST A: Verify /api/img route accepts all 19 image names"""
    print("\n" + "="*80)
    print("TEST A: /api/img route accepts all 19 image names")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for name in IMAGE_NAMES:
        url = f"{BASE_URL}/api/img/{name}"
        try:
            response = requests.get(url, timeout=10)
            
            # Check HTTP 200
            if response.status_code != 200:
                print(f"❌ {name}: Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            # Check Content-Type
            content_type = response.headers.get('Content-Type', '')
            expected_mime = EXPECTED_MIME.get(name, "image/jpeg")
            if not content_type.startswith(expected_mime):
                print(f"❌ {name}: Expected Content-Type {expected_mime}, got {content_type}")
                failed += 1
                continue
            
            # Check body is not empty (> 1000 bytes)
            if len(response.content) <= 1000:
                print(f"❌ {name}: Response body too small ({len(response.content)} bytes)")
                failed += 1
                continue
            
            # Check Cache-Control header (note: may be overridden by CDN/deployment)
            cache_control = response.headers.get('Cache-Control', '')
            cache_note = ""
            if 'max-age=31536000' not in cache_control:
                cache_note = " (⚠️  Cache-Control not optimal, may be CDN override)"
            
            print(f"✅ {name}: 200, {content_type}, {len(response.content)} bytes{cache_note}")
            passed += 1
            
        except Exception as e:
            print(f"❌ {name}: Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST A RESULT: {passed}/{len(IMAGE_NAMES)} passed, {failed} failed")
    return failed == 0


def test_b_image_route_with_extension():
    """TEST B: /api/img route tolerates extension in URL"""
    print("\n" + "="*80)
    print("TEST B: /api/img route tolerates extension in URL")
    print("="*80)
    
    test_cases = [
        ("bijou-01.jpeg", "image/jpeg"),
        ("boucles-cornaline.webp", "image/webp")
    ]
    
    passed = 0
    failed = 0
    
    for name_with_ext, expected_mime in test_cases:
        url = f"{BASE_URL}/api/img/{name_with_ext}"
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ {name_with_ext}: Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith(expected_mime):
                print(f"❌ {name_with_ext}: Expected {expected_mime}, got {content_type}")
                failed += 1
                continue
            
            print(f"✅ {name_with_ext}: 200, {content_type}")
            passed += 1
            
        except Exception as e:
            print(f"❌ {name_with_ext}: Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST B RESULT: {passed}/{len(test_cases)} passed, {failed} failed")
    return failed == 0


def test_c_image_route_404():
    """TEST C: 404 for unknown name"""
    print("\n" + "="*80)
    print("TEST C: 404 for unknown name")
    print("="*80)
    
    url = f"{BASE_URL}/api/img/does-not-exist"
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            print(f"✅ Unknown image returns 404")
            return True
        else:
            print(f"❌ Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_d_no_products_urls():
    """TEST D: Product catalogue no longer references /products/"""
    print("\n" + "="*80)
    print("TEST D: Product catalogue no longer references /products/")
    print("="*80)
    
    url = f"{BASE_URL}/api/products"
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch products: {response.status_code}")
            return False
        
        data = response.json()
        products = data.get('products', [])
        
        if len(products) != 21:
            print(f"❌ Expected 21 products, got {len(products)}")
            return False
        
        print(f"✅ Retrieved {len(products)} products")
        
        # Check every image URL in every product
        regression_found = False
        for product in products:
            slug = product.get('slug', 'unknown')
            images = product.get('images', [])
            
            for img_url in images:
                # Check if URL contains /products/ (regression)
                if '/products/' in img_url:
                    print(f"❌ REGRESSION: Product '{slug}' has /products/ URL: {img_url}")
                    regression_found = True
                # Verify URL starts with /api/img/ or https:// (external URLs like customer-assets, unsplash, pexels are OK)
                elif not (img_url.startswith('/api/img/') or img_url.startswith('https://')):
                    print(f"❌ Product '{slug}' has unexpected URL format: {img_url}")
                    regression_found = True
        
        if not regression_found:
            print(f"✅ All product image URLs use /api/img/ or customer-assets URLs")
            print(f"✅ No /products/ URLs found (regression check passed)")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_e_all_product_images_reachable():
    """TEST E: All product image URLs are reachable"""
    print("\n" + "="*80)
    print("TEST E: All product image URLs are reachable")
    print("="*80)
    
    url = f"{BASE_URL}/api/products"
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch products: {response.status_code}")
            return False
        
        data = response.json()
        products = data.get('products', [])
        
        # Collect all unique image URLs
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
                # External URL (customer-assets)
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
        
        print(f"\nTEST E RESULT: {passed}/{len(all_urls)} URLs reachable, {failed} failed")
        
        if failed_urls:
            print("\nFailed URLs:")
            for slug, url, error in failed_urls[:10]:  # Show first 10
                print(f"  - {slug}: {url} ({error})")
        
        return failed == 0
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def test_f_category_filters():
    """TEST F: Category filters still correct"""
    print("\n" + "="*80)
    print("TEST F: Category filters still correct")
    print("="*80)
    
    test_cases = [
        ("bougies", 5, None),
        ("pulls", 2, None),
        ("bijoux", None, "boucles-cornaline-solaire"),
        ("decoration", None, "photophores-macrame-terracotta")
    ]
    
    passed = 0
    failed = 0
    
    for category, expected_count, expected_slug in test_cases:
        url = f"{BASE_URL}/api/products?cat={category}"
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Category '{category}': Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            data = response.json()
            products = data.get('products', [])
            
            # Check count if specified
            if expected_count is not None:
                if len(products) != expected_count:
                    print(f"❌ Category '{category}': Expected {expected_count} products, got {len(products)}")
                    failed += 1
                    continue
                print(f"✅ Category '{category}': {len(products)} products")
            
            # Check for expected slug if specified
            if expected_slug is not None:
                slugs = [p.get('slug') for p in products]
                if expected_slug in slugs:
                    print(f"✅ Category '{category}': Contains '{expected_slug}'")
                else:
                    print(f"❌ Category '{category}': Missing '{expected_slug}'")
                    failed += 1
                    continue
            
            passed += 1
            
        except Exception as e:
            print(f"❌ Category '{category}': Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST F RESULT: {passed}/{len(test_cases)} passed, {failed} failed")
    return failed == 0


def test_g_product_detail_new_urls():
    """TEST G: Product detail returns new /api/img URLs"""
    print("\n" + "="*80)
    print("TEST G: Product detail returns new /api/img URLs")
    print("="*80)
    
    test_cases = [
        ("photophores-macrame-terracotta", "/api/img/photophore-01"),
        ("boucles-cornaline-solaire", "/api/img/boucles-cornaline")
    ]
    
    passed = 0
    failed = 0
    
    for slug, expected_first_image in test_cases:
        url = f"{BASE_URL}/api/products/{slug}"
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Product '{slug}': Expected 200, got {response.status_code}")
                failed += 1
                continue
            
            data = response.json()
            product = data.get('product', {})
            images = product.get('images', [])
            
            if not images:
                print(f"❌ Product '{slug}': No images found")
                failed += 1
                continue
            
            first_image = images[0]
            if first_image == expected_first_image:
                print(f"✅ Product '{slug}': First image is '{first_image}'")
                passed += 1
            else:
                print(f"❌ Product '{slug}': Expected '{expected_first_image}', got '{first_image}'")
                failed += 1
            
        except Exception as e:
            print(f"❌ Product '{slug}': Exception - {str(e)}")
            failed += 1
    
    print(f"\nTEST G RESULT: {passed}/{len(test_cases)} passed, {failed} failed")
    return failed == 0


def test_h_cart_flow_regression():
    """TEST H: Cart flow regression (using session cookie)"""
    print("\n" + "="*80)
    print("TEST H: Cart flow regression (using session cookie)")
    print("="*80)
    
    # Use a session to persist cookies
    session = requests.Session()
    
    try:
        # Step 1: POST to cart
        print("\n1. Adding bougie-santal to cart...")
        url = f"{BASE_URL}/api/cart"
        payload = {"slug": "bougie-santal", "qty": 1}
        response = session.post(url, json=payload, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ POST /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        
        if not items:
            print(f"❌ POST /api/cart: No items in response")
            return False
        
        if items[0].get('slug') != 'bougie-santal':
            print(f"❌ POST /api/cart: Expected slug 'bougie-santal', got '{items[0].get('slug')}'")
            return False
        
        first_image = items[0].get('image', '')
        if not first_image.startswith('/api/img/'):
            print(f"❌ POST /api/cart: Image URL doesn't start with /api/img/, got '{first_image}'")
            return False
        
        print(f"✅ POST /api/cart: Added bougie-santal, image: {first_image}")
        
        # Step 2: GET cart
        print("\n2. Getting cart...")
        response = session.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ GET /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        
        if not items or items[0].get('slug') != 'bougie-santal':
            print(f"❌ GET /api/cart: Cart doesn't reflect added product")
            return False
        
        print(f"✅ GET /api/cart: Cart contains bougie-santal")
        
        # Step 3: DELETE from cart
        print("\n3. Removing bougie-santal from cart...")
        delete_url = f"{BASE_URL}/api/cart?slug=bougie-santal"
        response = session.delete(delete_url, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ DELETE /api/cart failed: {response.status_code}")
            return False
        
        data = response.json()
        items = data.get('items', [])
        
        if items:
            print(f"❌ DELETE /api/cart: Cart should be empty, has {len(items)} items")
            return False
        
        print(f"✅ DELETE /api/cart: Cart is empty")
        
        print("\n✅ TEST H PASSED: Cart flow works correctly")
        return True
        
    except Exception as e:
        print(f"❌ Exception - {str(e)}")
        return False


def main():
    """Run all tests"""
    print("="*80)
    print("GINETTE Créations - Image Serving Verification Tests")
    print("Testing new /api/img route on PREVIEW environment")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {
        "TEST A - /api/img accepts all 19 names": test_a_image_route_all_names(),
        "TEST B - /api/img tolerates extensions": test_b_image_route_with_extension(),
        "TEST C - /api/img returns 404 for unknown": test_c_image_route_404(),
        "TEST D - No /products/ URLs in catalogue": test_d_no_products_urls(),
        "TEST E - All product images reachable": test_e_all_product_images_reachable(),
        "TEST F - Category filters correct": test_f_category_filters(),
        "TEST G - Product detail has new URLs": test_g_product_detail_new_urls(),
        "TEST H - Cart flow regression": test_h_cart_flow_regression()
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
        print("\n🎉 ALL TESTS PASSED - Image serving mechanism verified successfully!")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED - See details above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
