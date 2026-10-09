#!/usr/bin/env python3
"""
Comprehensive backend API test suite for Atelier JLT after refactoring
Tests all endpoints to verify no regressions were introduced
"""

import requests
import json
import os
from typing import Dict, Any

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://french-craft.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
CLIENT_EMAIL = "test@atelierjlt.fr"
CLIENT_PASSWORD = "MonSecret123"
ADMIN_PASSWORD = "Juliette99*"

# Session storage
session = requests.Session()
admin_session = requests.Session()

def print_test(name: str, passed: bool, details: str = ""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"    {details}")

def test_api_root():
    """Test 0: API root health check"""
    try:
        resp = session.get(f"{API_URL}/")
        passed = resp.status_code == 200 and resp.json().get('message') == 'Atelier JLT API'
        print_test("API Root Health Check", passed, f"Status: {resp.status_code}, Message: {resp.json().get('message')}")
        return passed
    except Exception as e:
        print_test("API Root Health Check", False, f"Error: {str(e)}")
        return False

# ==================== PRODUCTS API (PUBLIC) ====================

def test_products_list():
    """Test 1: GET /api/products - should return product list"""
    try:
        resp = session.get(f"{API_URL}/products")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data and len(data['products']) > 0
        print_test("Products List", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed, data
    except Exception as e:
        print_test("Products List", False, f"Error: {str(e)}")
        return False, {}

def test_products_by_category():
    """Test 2: GET /api/products?cat=intemporels"""
    try:
        resp = session.get(f"{API_URL}/products?cat=intemporels")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data
        print_test("Products by Category (intemporels)", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed
    except Exception as e:
        print_test("Products by Category", False, f"Error: {str(e)}")
        return False

def test_products_search():
    """Test 3: GET /api/products?q=plaid"""
    try:
        resp = session.get(f"{API_URL}/products?q=plaid")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data
        print_test("Products Search (plaid)", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed
    except Exception as e:
        print_test("Products Search", False, f"Error: {str(e)}")
        return False

def test_products_sort():
    """Test 4: GET /api/products?sort=price-asc"""
    try:
        resp = session.get(f"{API_URL}/products?sort=price-asc")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data
        print_test("Products Sort (price-asc)", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed
    except Exception as e:
        print_test("Products Sort", False, f"Error: {str(e)}")
        return False

def test_product_detail(slug: str = "plaid-sylvestre"):
    """Test 5: GET /api/products/{slug}"""
    try:
        resp = session.get(f"{API_URL}/products/{slug}")
        data = resp.json()
        passed = resp.status_code == 200 and 'product' in data
        print_test(f"Product Detail ({slug})", passed, f"Status: {resp.status_code}, Name: {data.get('product', {}).get('name', 'N/A')}")
        return passed
    except Exception as e:
        print_test(f"Product Detail ({slug})", False, f"Error: {str(e)}")
        return False

# ==================== CART API (SESSION COOKIE) ====================

def test_cart_get_empty():
    """Test 6: GET /api/cart - should return empty cart initially"""
    try:
        resp = session.get(f"{API_URL}/cart")
        data = resp.json()
        passed = resp.status_code == 200 and 'items' in data
        print_test("Cart GET (empty)", passed, f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        return passed
    except Exception as e:
        print_test("Cart GET (empty)", False, f"Error: {str(e)}")
        return False

def test_cart_add_item():
    """Test 7: POST /api/cart - add item to cart"""
    try:
        payload = {"slug": "plaid-sylvestre", "qty": 1}
        resp = session.post(f"{API_URL}/cart", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('count', 0) >= 1
        print_test("Cart POST (add item)", passed, f"Status: {resp.status_code}, Count: {data.get('count', 0)}")
        return passed
    except Exception as e:
        print_test("Cart POST (add item)", False, f"Error: {str(e)}")
        return False

def test_cart_add_with_variant():
    """Test 8: POST /api/cart - add item with variant and size"""
    try:
        payload = {"slug": "coussin-noyau", "qty": 2, "variant": "beige", "size": "40x40"}
        resp = session.post(f"{API_URL}/cart", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('count', 0) >= 2
        print_test("Cart POST (with variant)", passed, f"Status: {resp.status_code}, Count: {data.get('count', 0)}")
        return passed
    except Exception as e:
        print_test("Cart POST (with variant)", False, f"Error: {str(e)}")
        return False

def test_cart_update():
    """Test 9: PATCH /api/cart - update cart item"""
    try:
        payload = {"slug": "plaid-sylvestre", "qty": 2}
        resp = session.patch(f"{API_URL}/cart", json=payload)
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Cart PATCH (update)", passed, f"Status: {resp.status_code}, Count: {data.get('count', 0)}")
        return passed
    except Exception as e:
        print_test("Cart PATCH (update)", False, f"Error: {str(e)}")
        return False

def test_cart_delete():
    """Test 10: DELETE /api/cart?slug=plaid-sylvestre"""
    try:
        resp = session.delete(f"{API_URL}/cart?slug=plaid-sylvestre")
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Cart DELETE", passed, f"Status: {resp.status_code}, Count: {data.get('count', 0)}")
        return passed
    except Exception as e:
        print_test("Cart DELETE", False, f"Error: {str(e)}")
        return False

# ==================== AUTH CLIENT ====================

def test_auth_register():
    """Test 11: POST /api/auth/register"""
    try:
        import random
        email = f"newtest{random.randint(1000, 9999)}@example.com"
        payload = {"email": email, "password": "Test1234", "name": "Test User"}
        resp = session.post(f"{API_URL}/auth/register", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and 'user' in data
        print_test("Auth Register", passed, f"Status: {resp.status_code}, Email: {email}")
        return passed
    except Exception as e:
        print_test("Auth Register", False, f"Error: {str(e)}")
        return False

def test_auth_login():
    """Test 12: POST /api/auth/login"""
    try:
        # First ensure user exists by registering (will fail if exists, that's ok)
        try:
            session.post(f"{API_URL}/auth/register", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD, "name": "Test User"})
        except:
            pass
        
        payload = {"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
        resp = session.post(f"{API_URL}/auth/login", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and 'user' in data
        print_test("Auth Login", passed, f"Status: {resp.status_code}, Email: {data.get('user', {}).get('email', 'N/A')}")
        return passed
    except Exception as e:
        print_test("Auth Login", False, f"Error: {str(e)}")
        return False

def test_auth_me():
    """Test 13: GET /api/auth/me"""
    try:
        resp = session.get(f"{API_URL}/auth/me")
        data = resp.json()
        passed = resp.status_code == 200 and 'user' in data
        print_test("Auth Me", passed, f"Status: {resp.status_code}, Email: {data.get('user', {}).get('email', 'N/A')}")
        return passed
    except Exception as e:
        print_test("Auth Me", False, f"Error: {str(e)}")
        return False

def test_auth_logout():
    """Test 14: POST /api/auth/logout"""
    try:
        resp = session.post(f"{API_URL}/auth/logout")
        passed = resp.status_code == 200
        print_test("Auth Logout", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Auth Logout", False, f"Error: {str(e)}")
        return False

# ==================== AUTH ADMIN ====================

def test_admin_login():
    """Test 15: POST /api/auth/admin-login"""
    try:
        payload = {"password": ADMIN_PASSWORD}
        resp = admin_session.post(f"{API_URL}/auth/admin-login", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('ok') == True
        print_test("Admin Login", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Admin Login", False, f"Error: {str(e)}")
        return False

def test_admin_status():
    """Test 16: GET /api/auth/admin-status"""
    try:
        resp = admin_session.get(f"{API_URL}/auth/admin-status")
        data = resp.json()
        passed = resp.status_code == 200 and data.get('isAdmin') == True
        print_test("Admin Status", passed, f"Status: {resp.status_code}, isAdmin: {data.get('isAdmin')}")
        return passed
    except Exception as e:
        print_test("Admin Status", False, f"Error: {str(e)}")
        return False

def test_admin_logout():
    """Test 17: POST /api/auth/admin-logout"""
    try:
        resp = admin_session.post(f"{API_URL}/auth/admin-logout")
        passed = resp.status_code == 200
        print_test("Admin Logout", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Admin Logout", False, f"Error: {str(e)}")
        return False

# ==================== WISHLIST (REQUIRES AUTH) ====================

def test_wishlist_get():
    """Test 18: GET /api/wishlist"""
    try:
        # Re-login to ensure auth
        session.post(f"{API_URL}/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD})
        resp = session.get(f"{API_URL}/wishlist")
        data = resp.json()
        passed = resp.status_code == 200 and 'items' in data
        print_test("Wishlist GET", passed, f"Status: {resp.status_code}, Items: {len(data.get('items', []))}")
        return passed
    except Exception as e:
        print_test("Wishlist GET", False, f"Error: {str(e)}")
        return False

def test_wishlist_add():
    """Test 19: POST /api/wishlist"""
    try:
        payload = {"slug": "plaid-sylvestre"}
        resp = session.post(f"{API_URL}/wishlist", json=payload)
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Wishlist POST (add)", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Wishlist POST (add)", False, f"Error: {str(e)}")
        return False

def test_wishlist_delete():
    """Test 20: DELETE /api/wishlist?slug=plaid-sylvestre"""
    try:
        resp = session.delete(f"{API_URL}/wishlist?slug=plaid-sylvestre")
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Wishlist DELETE", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Wishlist DELETE", False, f"Error: {str(e)}")
        return False

# ==================== ORDERS ====================

def test_orders_list():
    """Test 21: GET /api/orders"""
    try:
        resp = session.get(f"{API_URL}/orders")
        data = resp.json()
        passed = resp.status_code == 200 and 'orders' in data
        print_test("Orders List", passed, f"Status: {resp.status_code}, Count: {len(data.get('orders', []))}")
        return passed
    except Exception as e:
        print_test("Orders List", False, f"Error: {str(e)}")
        return False

def test_orders_create():
    """Test 22: POST /api/orders - create order (requires items in cart)"""
    try:
        # First add item to cart
        session.post(f"{API_URL}/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        
        payload = {
            "shippingAddress": {
                "name": "Test User",
                "address": "123 Test St",
                "city": "Paris",
                "postalCode": "75001",
                "country": "France"
            },
            "paymentMethod": "card"
        }
        resp = session.post(f"{API_URL}/orders", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and 'order' in data
        print_test("Orders Create", passed, f"Status: {resp.status_code}, Order ID: {data.get('order', {}).get('_id', 'N/A')}")
        return passed
    except Exception as e:
        print_test("Orders Create", False, f"Error: {str(e)}")
        return False

# ==================== COUPONS / GIFT CARDS ====================

def test_coupon_verify():
    """Test 23: POST /api/coupons/verify"""
    try:
        payload = {"code": "FAKECODE"}
        resp = session.post(f"{API_URL}/coupons/verify", json=payload)
        # Should return 404 or error for invalid code
        passed = resp.status_code in [400, 404]
        print_test("Coupon Verify (invalid)", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Coupon Verify", False, f"Error: {str(e)}")
        return False

def test_gift_card_verify():
    """Test 24: POST /api/gift-cards/verify"""
    try:
        payload = {"code": "FAKECODE"}
        resp = session.post(f"{API_URL}/gift-cards/verify", json=payload)
        # Should return 404 or error for invalid code
        passed = resp.status_code in [400, 404]
        print_test("Gift Card Verify (invalid)", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Gift Card Verify", False, f"Error: {str(e)}")
        return False

# ==================== ADMIN ENDPOINTS ====================

def test_admin_stats():
    """Test 25: GET /api/admin/stats"""
    try:
        # Re-login admin
        admin_session.post(f"{API_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        resp = admin_session.get(f"{API_URL}/admin/stats")
        data = resp.json()
        # Stats returns data directly (orderCount, userCount, etc.) not wrapped in 'stats'
        passed = resp.status_code == 200 and ('orderCount' in data or 'userCount' in data)
        print_test("Admin Stats", passed, f"Status: {resp.status_code}, Orders: {data.get('orderCount', 'N/A')}, Users: {data.get('userCount', 'N/A')}")
        return passed
    except Exception as e:
        print_test("Admin Stats", False, f"Error: {str(e)}")
        return False

def test_admin_products():
    """Test 26: GET /api/admin/products"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/products")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data
        print_test("Admin Products", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed
    except Exception as e:
        print_test("Admin Products", False, f"Error: {str(e)}")
        return False

def test_admin_orders():
    """Test 27: GET /api/admin/orders"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/orders")
        data = resp.json()
        passed = resp.status_code == 200 and 'orders' in data
        print_test("Admin Orders", passed, f"Status: {resp.status_code}, Count: {len(data.get('orders', []))}")
        return passed
    except Exception as e:
        print_test("Admin Orders", False, f"Error: {str(e)}")
        return False

def test_admin_users():
    """Test 28: GET /api/admin/users"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/users")
        data = resp.json()
        # Returns {'list': [...]} not {'users': [...]}
        passed = resp.status_code == 200 and 'list' in data
        print_test("Admin Users", passed, f"Status: {resp.status_code}, Count: {len(data.get('list', []))}")
        return passed
    except Exception as e:
        print_test("Admin Users", False, f"Error: {str(e)}")
        return False

def test_admin_coupons():
    """Test 29: GET /api/admin/coupons"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/coupons")
        data = resp.json()
        passed = resp.status_code == 200 and 'coupons' in data
        print_test("Admin Coupons", passed, f"Status: {resp.status_code}, Count: {len(data.get('coupons', []))}")
        return passed
    except Exception as e:
        print_test("Admin Coupons", False, f"Error: {str(e)}")
        return False

def test_admin_gift_cards():
    """Test 30: GET /api/admin/gift-cards"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/gift-cards")
        data = resp.json()
        # Returns {'list': [...]} not {'giftCards': [...]}
        passed = resp.status_code == 200 and 'list' in data
        print_test("Admin Gift Cards", passed, f"Status: {resp.status_code}, Count: {len(data.get('list', []))}")
        return passed
    except Exception as e:
        print_test("Admin Gift Cards", False, f"Error: {str(e)}")
        return False

def test_admin_newsletters():
    """Test 31: GET /api/admin/newsletters"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/newsletters")
        data = resp.json()
        # Returns {'list': [...]} not {'subscribers': [...]}
        passed = resp.status_code == 200 and 'list' in data
        print_test("Admin Newsletters", passed, f"Status: {resp.status_code}, Count: {len(data.get('list', []))}")
        return passed
    except Exception as e:
        print_test("Admin Newsletters", False, f"Error: {str(e)}")
        return False

def test_admin_contacts():
    """Test 32: GET /api/admin/contacts"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/contacts")
        data = resp.json()
        # Returns {'list': [...]} not {'contacts': [...]}
        passed = resp.status_code == 200 and 'list' in data
        print_test("Admin Contacts", passed, f"Status: {resp.status_code}, Count: {len(data.get('list', []))}")
        return passed
    except Exception as e:
        print_test("Admin Contacts", False, f"Error: {str(e)}")
        return False

def test_admin_blog():
    """Test 33: GET /api/admin/blog"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/blog")
        data = resp.json()
        passed = resp.status_code == 200 and 'posts' in data
        print_test("Admin Blog", passed, f"Status: {resp.status_code}, Count: {len(data.get('posts', []))}")
        return passed
    except Exception as e:
        print_test("Admin Blog", False, f"Error: {str(e)}")
        return False

def test_admin_site_content():
    """Test 34: GET /api/admin/site-content"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/site-content")
        data = resp.json()
        passed = resp.status_code == 200 and 'content' in data
        print_test("Admin Site Content GET", passed, f"Status: {resp.status_code}")
        return passed, data
    except Exception as e:
        print_test("Admin Site Content GET", False, f"Error: {str(e)}")
        return False, {}

def test_admin_site_content_patch():
    """Test 35: PATCH /api/admin/site-content"""
    try:
        payload = {"hero": {"title": "Test Refactoring"}}
        resp = admin_session.patch(f"{API_URL}/admin/site-content", json=payload)
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Admin Site Content PATCH", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Admin Site Content PATCH", False, f"Error: {str(e)}")
        return False

def test_admin_settings():
    """Test 36: GET /api/admin/settings"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/settings")
        data = resp.json()
        passed = resp.status_code == 200 and 'settings' in data
        print_test("Admin Settings GET", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Admin Settings GET", False, f"Error: {str(e)}")
        return False

def test_admin_settings_patch():
    """Test 37: PATCH /api/admin/settings"""
    try:
        payload = {"brand": {"name": "Atelier JLT"}}
        resp = admin_session.patch(f"{API_URL}/admin/settings", json=payload)
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Admin Settings PATCH", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Admin Settings PATCH", False, f"Error: {str(e)}")
        return False

def test_admin_files():
    """Test 38: GET /api/admin/files"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/files")
        data = resp.json()
        # Returns {'orphans': [...], 'total': N, 'referenced': N, ...} not {'files': [...]}
        passed = resp.status_code == 200 and ('total' in data or 'orphans' in data)
        print_test("Admin Files", passed, f"Status: {resp.status_code}, Total: {data.get('total', 'N/A')}, Orphans: {len(data.get('orphans', []))}")
        return passed
    except Exception as e:
        print_test("Admin Files", False, f"Error: {str(e)}")
        return False

# ==================== BLOG PUBLIC ====================

def test_blog_public():
    """Test 39: GET /api/blog"""
    try:
        resp = session.get(f"{API_URL}/blog")
        data = resp.json()
        passed = resp.status_code == 200 and 'posts' in data
        print_test("Blog Public", passed, f"Status: {resp.status_code}, Count: {len(data.get('posts', []))}")
        return passed
    except Exception as e:
        print_test("Blog Public", False, f"Error: {str(e)}")
        return False

# ==================== SITE CONTENT PUBLIC ====================

def test_site_content_public():
    """Test 40: GET /api/site-content"""
    try:
        resp = session.get(f"{API_URL}/site-content")
        data = resp.json()
        passed = resp.status_code == 200 and 'content' in data
        print_test("Site Content Public", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Site Content Public", False, f"Error: {str(e)}")
        return False

def test_site_settings_public():
    """Test 41: GET /api/site-settings"""
    try:
        resp = session.get(f"{API_URL}/site-settings")
        data = resp.json()
        passed = resp.status_code == 200 and 'settings' in data
        print_test("Site Settings Public", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Site Settings Public", False, f"Error: {str(e)}")
        return False

# ==================== NEWSLETTER / CONTACT ====================

def test_newsletter_subscribe():
    """Test 42: POST /api/newsletter"""
    try:
        import random
        email = f"test{random.randint(1000, 9999)}@newsletter.fr"
        payload = {"email": email}
        resp = session.post(f"{API_URL}/newsletter", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('ok') == True
        print_test("Newsletter Subscribe", passed, f"Status: {resp.status_code}, Email: {email}")
        return passed
    except Exception as e:
        print_test("Newsletter Subscribe", False, f"Error: {str(e)}")
        return False

def test_contact_submit():
    """Test 43: POST /api/contact"""
    try:
        payload = {
            "name": "Test User",
            "email": "test@contact.fr",
            "message": "Test message after refactoring"
        }
        resp = session.post(f"{API_URL}/contact", json=payload)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('ok') == True
        print_test("Contact Submit", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Contact Submit", False, f"Error: {str(e)}")
        return False

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("BACKEND API COMPREHENSIVE TEST SUITE - POST REFACTORING")
    print("Testing all endpoints after splitting route.js into handlers")
    print("="*80 + "\n")
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    tests = [
        ("API Root", test_api_root),
        ("Products List", test_products_list),
        ("Products by Category", test_products_by_category),
        ("Products Search", test_products_search),
        ("Products Sort", test_products_sort),
        ("Product Detail", test_product_detail),
        ("Cart GET Empty", test_cart_get_empty),
        ("Cart Add Item", test_cart_add_item),
        ("Cart Add with Variant", test_cart_add_with_variant),
        ("Cart Update", test_cart_update),
        ("Cart Delete", test_cart_delete),
        ("Auth Register", test_auth_register),
        ("Auth Login", test_auth_login),
        ("Auth Me", test_auth_me),
        ("Auth Logout", test_auth_logout),
        ("Admin Login", test_admin_login),
        ("Admin Status", test_admin_status),
        ("Admin Logout", test_admin_logout),
        ("Wishlist GET", test_wishlist_get),
        ("Wishlist Add", test_wishlist_add),
        ("Wishlist Delete", test_wishlist_delete),
        ("Orders List", test_orders_list),
        ("Orders Create", test_orders_create),
        ("Coupon Verify", test_coupon_verify),
        ("Gift Card Verify", test_gift_card_verify),
        ("Admin Stats", test_admin_stats),
        ("Admin Products", test_admin_products),
        ("Admin Orders", test_admin_orders),
        ("Admin Users", test_admin_users),
        ("Admin Coupons", test_admin_coupons),
        ("Admin Gift Cards", test_admin_gift_cards),
        ("Admin Newsletters", test_admin_newsletters),
        ("Admin Contacts", test_admin_contacts),
        ("Admin Blog", test_admin_blog),
        ("Admin Site Content GET", lambda: test_admin_site_content()[0]),
        ("Admin Site Content PATCH", test_admin_site_content_patch),
        ("Admin Settings GET", test_admin_settings),
        ("Admin Settings PATCH", test_admin_settings_patch),
        ("Admin Files", test_admin_files),
        ("Blog Public", test_blog_public),
        ("Site Content Public", test_site_content_public),
        ("Site Settings Public", test_site_settings_public),
        ("Newsletter Subscribe", test_newsletter_subscribe),
        ("Contact Submit", test_contact_submit),
    ]
    
    for test_name, test_func in tests:
        total_tests += 1
        try:
            result = test_func()
            if result:
                passed_tests += 1
            else:
                failed_tests.append(test_name)
        except Exception as e:
            print_test(test_name, False, f"Exception: {str(e)}")
            failed_tests.append(test_name)
    
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {passed_tests}/{total_tests} tests passed")
    print("="*80)
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"  - {test}")
    else:
        print("\n✅ ALL TESTS PASSED - NO REGRESSIONS DETECTED")
    
    print("\n" + "="*80 + "\n")
    
    return passed_tests, total_tests, failed_tests

if __name__ == "__main__":
    passed, total, failed = run_all_tests()
    exit(0 if len(failed) == 0 else 1)
