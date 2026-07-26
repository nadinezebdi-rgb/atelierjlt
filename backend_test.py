#!/usr/bin/env python3
"""
GINETTE Créations Backend Test Suite
Tests all backend API endpoints on PREVIEW environment
"""

import requests
import sys
from typing import Dict, List, Any

# Base URL from .env
BASE_URL = "https://french-craft.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test results tracking
test_results = []
failed_tests = []

def log_test(test_num: int, description: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"Test {test_num}: {status} - {description}"
    if details:
        result += f"\n  Details: {details}"
    print(result)
    test_results.append((test_num, passed, description, details))
    if not passed:
        failed_tests.append((test_num, description, details))

def test_1_health_check():
    """Test 1: GET /api/ -> should return {message:"Ginette Créations API", ok:true} with 200"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("message") == "Ginette Créations API" and
            data.get("ok") is True
        )
        
        details = f"Status: {response.status_code}, Response: {data}"
        log_test(1, "Health check endpoint", passed, details)
        return passed
    except Exception as e:
        log_test(1, "Health check endpoint", False, f"Exception: {str(e)}")
        return False

def test_2_all_products():
    """Test 2: GET /api/products -> should return { products: [...], total: 21 }"""
    try:
        response = requests.get(f"{API_BASE}/products", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        total = data.get("total", 0)
        
        passed = (
            response.status_code == 200 and
            len(products) == 21 and
            total == 21
        )
        
        details = f"Status: {response.status_code}, Products count: {len(products)}, Total: {total}"
        log_test(2, "Get all products (21 expected)", passed, details)
        return products if passed else []
    except Exception as e:
        log_test(2, "Get all products (21 expected)", False, f"Exception: {str(e)}")
        return []

def test_3_verify_all_images(products: List[Dict]):
    """Test 3: For EACH of the 21 products, verify EVERY image URL returns 200"""
    if not products:
        log_test(3, "Verify all product images", False, "No products to test")
        return False
    
    all_passed = True
    failed_images = []
    total_images = 0
    
    for product in products:
        slug = product.get("slug", "unknown")
        images = product.get("images", [])
        
        for img_url in images:
            total_images += 1
            try:
                # Handle relative URLs
                if img_url.startswith("/"):
                    full_url = f"{BASE_URL}{img_url}"
                else:
                    full_url = img_url
                
                # Use HEAD request for efficiency
                response = requests.head(full_url, timeout=10, allow_redirects=True)
                
                if response.status_code != 200:
                    all_passed = False
                    failed_images.append({
                        "slug": slug,
                        "url": img_url,
                        "status": response.status_code
                    })
            except Exception as e:
                all_passed = False
                failed_images.append({
                    "slug": slug,
                    "url": img_url,
                    "error": str(e)
                })
    
    if all_passed:
        details = f"All {total_images} images from {len(products)} products returned 200"
    else:
        details = f"Failed images: {failed_images}"
    
    log_test(3, f"Verify all product images ({total_images} total)", all_passed, details)
    return all_passed

def test_4_category_bougies():
    """Test 4: GET /api/products?cat=bougies -> should return exactly 5 products"""
    try:
        response = requests.get(f"{API_BASE}/products?cat=bougies", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        expected_slugs = ["bougie-santal", "bougie-ylang-ylang", "bougie-bergamote", "bougie-figue", "coffret-bougies"]
        actual_slugs = [p.get("slug") for p in products]
        
        passed = (
            response.status_code == 200 and
            len(products) == 5 and
            set(actual_slugs) == set(expected_slugs)
        )
        
        details = f"Status: {response.status_code}, Count: {len(products)}, Slugs: {actual_slugs}"
        log_test(4, "Category filter: bougies (5 expected)", passed, details)
        return passed
    except Exception as e:
        log_test(4, "Category filter: bougies (5 expected)", False, f"Exception: {str(e)}")
        return False

def test_5_category_pulls():
    """Test 5: GET /api/products?cat=pulls -> should return exactly 2 products"""
    try:
        response = requests.get(f"{API_BASE}/products?cat=pulls", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        expected_slugs = ["pull-crochet-argile", "pull-crochet-safran-raye"]
        actual_slugs = [p.get("slug") for p in products]
        
        passed = (
            response.status_code == 200 and
            len(products) == 2 and
            set(actual_slugs) == set(expected_slugs)
        )
        
        details = f"Status: {response.status_code}, Count: {len(products)}, Slugs: {actual_slugs}"
        log_test(5, "Category filter: pulls (2 expected)", passed, details)
        return passed
    except Exception as e:
        log_test(5, "Category filter: pulls (2 expected)", False, f"Exception: {str(e)}")
        return False

def test_6_category_bijoux():
    """Test 6: GET /api/products?cat=bijoux -> should return exactly 5 products including boucles-cornaline-solaire"""
    try:
        response = requests.get(f"{API_BASE}/products?cat=bijoux", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        actual_slugs = [p.get("slug") for p in products]
        
        passed = (
            response.status_code == 200 and
            len(products) == 5 and
            "boucles-cornaline-solaire" in actual_slugs
        )
        
        details = f"Status: {response.status_code}, Count: {len(products)}, Slugs: {actual_slugs}"
        log_test(6, "Category filter: bijoux (5 expected, includes boucles-cornaline-solaire)", passed, details)
        return passed
    except Exception as e:
        log_test(6, "Category filter: bijoux (5 expected, includes boucles-cornaline-solaire)", False, f"Exception: {str(e)}")
        return False

def test_7_category_decoration():
    """Test 7: GET /api/products?cat=decoration -> should include photophores-macrame-terracotta"""
    try:
        response = requests.get(f"{API_BASE}/products?cat=decoration", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        actual_slugs = [p.get("slug") for p in products]
        
        passed = (
            response.status_code == 200 and
            "photophores-macrame-terracotta" in actual_slugs
        )
        
        details = f"Status: {response.status_code}, Count: {len(products)}, Slugs: {actual_slugs}"
        log_test(7, "Category filter: decoration (includes photophores-macrame-terracotta)", passed, details)
        return passed
    except Exception as e:
        log_test(7, "Category filter: decoration (includes photophores-macrame-terracotta)", False, f"Exception: {str(e)}")
        return False

def test_8_category_nouveautes():
    """Test 8: GET /api/products?cat=nouveautes -> should return only products with isNew=true (at least 10)"""
    try:
        response = requests.get(f"{API_BASE}/products?cat=nouveautes", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        all_new = all(p.get("isNew", False) for p in products)
        
        passed = (
            response.status_code == 200 and
            len(products) >= 10 and
            all_new
        )
        
        details = f"Status: {response.status_code}, Count: {len(products)}, All isNew: {all_new}"
        log_test(8, "Category filter: nouveautes (at least 10, all isNew=true)", passed, details)
        return passed
    except Exception as e:
        log_test(8, "Category filter: nouveautes (at least 10, all isNew=true)", False, f"Exception: {str(e)}")
        return False

def test_9_product_detail_boucles_cornaline():
    """Test 9: GET /api/products/boucles-cornaline-solaire -> should return product with /products/boucles-cornaline.webp"""
    try:
        response = requests.get(f"{API_BASE}/products/boucles-cornaline-solaire", timeout=10)
        data = response.json()
        
        product = data.get("product", {})
        related = data.get("related", [])
        images = product.get("images", [])
        
        passed = (
            response.status_code == 200 and
            product.get("slug") == "boucles-cornaline-solaire" and
            len(images) > 0 and
            images[0] == "/products/boucles-cornaline.webp" and
            isinstance(related, list)
        )
        
        details = f"Status: {response.status_code}, First image: {images[0] if images else 'none'}, Related count: {len(related)}"
        log_test(9, "Product detail: boucles-cornaline-solaire", passed, details)
        return passed
    except Exception as e:
        log_test(9, "Product detail: boucles-cornaline-solaire", False, f"Exception: {str(e)}")
        return False

def test_10_product_detail_photophores():
    """Test 10: GET /api/products/photophores-macrame-terracotta -> should have /products/photophore-01.jpeg"""
    try:
        response = requests.get(f"{API_BASE}/products/photophores-macrame-terracotta", timeout=10)
        data = response.json()
        
        product = data.get("product", {})
        images = product.get("images", [])
        
        passed = (
            response.status_code == 200 and
            product.get("slug") == "photophores-macrame-terracotta" and
            len(images) > 0 and
            images[0] == "/products/photophore-01.jpeg"
        )
        
        details = f"Status: {response.status_code}, First image: {images[0] if images else 'none'}"
        log_test(10, "Product detail: photophores-macrame-terracotta", passed, details)
        return passed
    except Exception as e:
        log_test(10, "Product detail: photophores-macrame-terracotta", False, f"Exception: {str(e)}")
        return False

def test_11_search():
    """Test 11: GET /api/products?q=cornaline -> should return at least 2 products"""
    try:
        response = requests.get(f"{API_BASE}/products?q=cornaline", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        
        passed = (
            response.status_code == 200 and
            len(products) >= 2
        )
        
        slugs = [p.get("slug") for p in products]
        details = f"Status: {response.status_code}, Count: {len(products)}, Slugs: {slugs}"
        log_test(11, "Search: cornaline (at least 2 results)", passed, details)
        return passed
    except Exception as e:
        log_test(11, "Search: cornaline (at least 2 results)", False, f"Exception: {str(e)}")
        return False

def test_12_sort_price_asc():
    """Test 12: GET /api/products?sort=price-asc -> confirm first product has lowest price"""
    try:
        response = requests.get(f"{API_BASE}/products?sort=price-asc", timeout=10)
        data = response.json()
        
        products = data.get("products", [])
        
        if len(products) < 2:
            log_test(12, "Sort: price-asc", False, "Not enough products")
            return False
        
        prices = [p.get("price", 0) for p in products]
        is_sorted = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
        
        passed = (
            response.status_code == 200 and
            is_sorted
        )
        
        details = f"Status: {response.status_code}, First 5 prices: {prices[:5]}, Sorted: {is_sorted}"
        log_test(12, "Sort: price-asc", passed, details)
        return passed
    except Exception as e:
        log_test(12, "Sort: price-asc", False, f"Exception: {str(e)}")
        return False

def test_13_cart_flow():
    """Test 13: Complete cart flow with session cookie"""
    session = requests.Session()
    
    try:
        # 13a: GET /api/cart with no cookie -> returns {items:[], count:0, subtotal:0}
        response = session.get(f"{API_BASE}/cart", timeout=10)
        data = response.json()
        
        passed_a = (
            response.status_code == 200 and
            data.get("items") == [] and
            data.get("count") == 0 and
            data.get("subtotal") == 0
        )
        log_test("13a", "Cart: GET empty cart", passed_a, f"Response: {data}")
        
        # 13b: POST /api/cart {"slug":"bracelet-oeil-de-tigre","qty":1}
        response = session.post(f"{API_BASE}/cart", json={"slug": "bracelet-oeil-de-tigre", "qty": 1}, timeout=10)
        data = response.json()
        
        passed_b = (
            response.status_code == 200 and
            len(data.get("items", [])) == 1 and
            data.get("count") == 1 and
            data.get("subtotal") == 89
        )
        
        # Check if cookie was set
        cookie_set = "ginette_sid" in session.cookies
        log_test("13b", "Cart: POST bracelet-oeil-de-tigre", passed_b and cookie_set, 
                f"Response: {data}, Cookie set: {cookie_set}")
        
        # 13c: POST /api/cart {"slug":"bougie-santal","qty":2}
        response = session.post(f"{API_BASE}/cart", json={"slug": "bougie-santal", "qty": 2}, timeout=10)
        data = response.json()
        
        passed_c = (
            response.status_code == 200 and
            len(data.get("items", [])) == 2 and
            data.get("count") == 3 and
            data.get("subtotal") == 173  # 89 + 2*42
        )
        log_test("13c", "Cart: POST bougie-santal qty=2", passed_c, f"Response: {data}")
        
        # 13d: PATCH /api/cart {"slug":"bougie-santal","qty":1}
        response = session.patch(f"{API_BASE}/cart", json={"slug": "bougie-santal", "qty": 1}, timeout=10)
        data = response.json()
        
        passed_d = (
            response.status_code == 200 and
            data.get("count") == 2 and
            data.get("subtotal") == 131  # 89 + 42
        )
        log_test("13d", "Cart: PATCH bougie-santal qty=1", passed_d, f"Response: {data}")
        
        # 13e: DELETE /api/cart?slug=bracelet-oeil-de-tigre
        response = session.delete(f"{API_BASE}/cart?slug=bracelet-oeil-de-tigre", timeout=10)
        data = response.json()
        
        passed_e = (
            response.status_code == 200 and
            len(data.get("items", [])) == 1 and
            data.get("subtotal") == 42
        )
        log_test("13e", "Cart: DELETE bracelet-oeil-de-tigre", passed_e, f"Response: {data}")
        
        return passed_a and passed_b and passed_c and passed_d and passed_e and cookie_set
        
    except Exception as e:
        log_test(13, "Cart flow", False, f"Exception: {str(e)}")
        return False

def test_14_newsletter():
    """Test 14: POST /api/newsletter {"email":"test-ginette@example.com"} -> returns {ok:true}"""
    try:
        response = requests.post(
            f"{API_BASE}/newsletter",
            json={"email": "test-ginette@example.com"},
            timeout=10
        )
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") is True
        )
        
        details = f"Status: {response.status_code}, Response: {data}"
        log_test(14, "Newsletter signup", passed, details)
        return passed
    except Exception as e:
        log_test(14, "Newsletter signup", False, f"Exception: {str(e)}")
        return False

def test_15_contact():
    """Test 15: POST /api/contact -> returns {ok:true}"""
    try:
        response = requests.post(
            f"{API_BASE}/contact",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "message": "Bonjour, une commande spéciale pour un cadeau d'anniversaire."
            },
            timeout=10
        )
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("ok") is True
        )
        
        details = f"Status: {response.status_code}, Response: {data}"
        log_test(15, "Contact form submission", passed, details)
        return passed
    except Exception as e:
        log_test(15, "Contact form submission", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=" * 80)
    print("GINETTE Créations Backend Test Suite")
    print(f"Testing: {BASE_URL}")
    print("=" * 80)
    print()
    
    # Run tests in order
    test_1_health_check()
    products = test_2_all_products()
    test_3_verify_all_images(products)
    test_4_category_bougies()
    test_5_category_pulls()
    test_6_category_bijoux()
    test_7_category_decoration()
    test_8_category_nouveautes()
    test_9_product_detail_boucles_cornaline()
    test_10_product_detail_photophores()
    test_11_search()
    test_12_sort_price_asc()
    test_13_cart_flow()
    test_14_newsletter()
    test_15_contact()
    
    # Summary
    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed_count = sum(1 for _, passed, _, _ in test_results if passed)
    total_count = len(test_results)
    
    print(f"Total: {passed_count}/{total_count} tests passed")
    print()
    
    if failed_tests:
        print("FAILED TESTS:")
        for test_num, description, details in failed_tests:
            print(f"  ❌ Test {test_num}: {description}")
            if details:
                print(f"     {details}")
        print()
        sys.exit(1)
    else:
        print("✅ All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
