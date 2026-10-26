#!/usr/bin/env python3
"""
Shipping endpoints test suite for Atelier JLT
Tests new shipping label generation and order management endpoints
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
test_order_id = None

def print_test(name: str, passed: bool, details: str = ""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"    {details}")

def setup_admin_session():
    """Login as admin"""
    try:
        payload = {"password": ADMIN_PASSWORD}
        resp = admin_session.post(f"{API_URL}/auth/admin-login", json=payload)
        return resp.status_code == 200
    except Exception as e:
        print(f"Admin login failed: {e}")
        return False

def setup_customer_session():
    """Login as customer"""
    try:
        # First ensure user exists
        try:
            session.post(f"{API_URL}/auth/register", json={
                "email": CLIENT_EMAIL, 
                "password": CLIENT_PASSWORD, 
                "name": "Test Client"
            })
        except:
            pass
        
        payload = {"email": CLIENT_EMAIL, "password": CLIENT_PASSWORD}
        resp = session.post(f"{API_URL}/auth/login", json=payload)
        return resp.status_code == 200
    except Exception as e:
        print(f"Customer login failed: {e}")
        return False

def create_test_order():
    """Create a test order with full address"""
    global test_order_id
    try:
        # Add product to cart
        session.post(f"{API_URL}/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        
        # Create order with full address
        payload = {
            "address": {
                "firstName": "Test",
                "lastName": "Client",
                "name": "Test Client",
                "email": "client@example.com",
                "address": "1 rue Test",
                "city": "Lyon",
                "zip": "69001",
                "country": "France"
            }
        }
        resp = session.post(f"{API_URL}/orders", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            test_order_id = data.get('order', {}).get('_id')
            print(f"Created test order: {test_order_id}")
            return test_order_id
        return None
    except Exception as e:
        print(f"Failed to create test order: {e}")
        return None

# ==================== SHIPPING ENDPOINTS TESTS ====================

def test_shipping_status_no_auth():
    """Test 1: GET /api/admin/shipping without cookie → 401"""
    try:
        no_auth_session = requests.Session()
        resp = no_auth_session.get(f"{API_URL}/admin/shipping")
        passed = resp.status_code == 401
        print_test("Shipping Status (No Auth)", passed, f"Status: {resp.status_code} (expected 401)")
        return passed
    except Exception as e:
        print_test("Shipping Status (No Auth)", False, f"Error: {str(e)}")
        return False

def test_shipping_status_with_admin():
    """Test 2: GET /api/admin/shipping with admin → JSON {colissimo, boxtal, boxtalOffers, email}"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/shipping")
        data = resp.json()
        
        has_required_fields = all(k in data for k in ['colissimo', 'boxtal', 'boxtalOffers', 'email'])
        passed = resp.status_code == 200 and has_required_fields
        
        details = f"Status: {resp.status_code}, colissimo: {data.get('colissimo')}, boxtal: {data.get('boxtal')}, boxtalOffers: {data.get('boxtalOffers')}, email: {data.get('email')}"
        print_test("Shipping Status (Admin)", passed, details)
        return passed
    except Exception as e:
        print_test("Shipping Status (Admin)", False, f"Error: {str(e)}")
        return False

def test_shipping_create_unknown_order():
    """Test 3: POST /api/admin/shipping with unknown orderId → 404"""
    try:
        payload = {
            "orderId": "unknown-order-id-12345",
            "provider": "colissimo",
            "weight": 1.2
        }
        resp = admin_session.post(f"{API_URL}/admin/shipping", json=payload)
        passed = resp.status_code == 404
        print_test("Shipping Create (Unknown Order)", passed, f"Status: {resp.status_code} (expected 404)")
        return passed
    except Exception as e:
        print_test("Shipping Create (Unknown Order)", False, f"Error: {str(e)}")
        return False

def test_shipping_create_no_weight():
    """Test 4: POST /api/admin/shipping without weight → 400"""
    try:
        if not test_order_id:
            print_test("Shipping Create (No Weight)", False, "No test order available")
            return False
        
        payload = {
            "orderId": test_order_id,
            "provider": "colissimo"
        }
        resp = admin_session.post(f"{API_URL}/admin/shipping", json=payload)
        passed = resp.status_code == 400
        details = f"Status: {resp.status_code} (expected 400), Message: {resp.json().get('error', 'N/A')}"
        print_test("Shipping Create (No Weight)", passed, details)
        return passed
    except Exception as e:
        print_test("Shipping Create (No Weight)", False, f"Error: {str(e)}")
        return False

def test_shipping_create_colissimo_not_configured():
    """Test 5: POST /api/admin/shipping with colissimo provider → 400 'pas encore connecté'"""
    try:
        if not test_order_id:
            print_test("Shipping Create (Colissimo Not Configured)", False, "No test order available")
            return False
        
        payload = {
            "orderId": test_order_id,
            "provider": "colissimo",
            "weight": 1.2
        }
        resp = admin_session.post(f"{API_URL}/admin/shipping", json=payload)
        data = resp.json()
        error_msg = data.get('error', '').lower()
        
        passed = resp.status_code == 400 and 'pas encore connecté' in error_msg
        details = f"Status: {resp.status_code} (expected 400), Error: {data.get('error', 'N/A')}"
        print_test("Shipping Create (Colissimo Not Configured)", passed, details)
        return passed
    except Exception as e:
        print_test("Shipping Create (Colissimo Not Configured)", False, f"Error: {str(e)}")
        return False

def test_shipping_create_boxtal_not_configured():
    """Test 6: POST /api/admin/shipping with boxtal provider → 400 'pas encore connecté'"""
    try:
        if not test_order_id:
            print_test("Shipping Create (Boxtal Not Configured)", False, "No test order available")
            return False
        
        payload = {
            "orderId": test_order_id,
            "provider": "boxtal",
            "weight": 1.2
        }
        resp = admin_session.post(f"{API_URL}/admin/shipping", json=payload)
        data = resp.json()
        error_msg = data.get('error', '').lower()
        
        passed = resp.status_code == 400 and 'pas encore connecté' in error_msg
        details = f"Status: {resp.status_code} (expected 400), Error: {data.get('error', 'N/A')}"
        print_test("Shipping Create (Boxtal Not Configured)", passed, details)
        return passed
    except Exception as e:
        print_test("Shipping Create (Boxtal Not Configured)", False, f"Error: {str(e)}")
        return False

def test_shipping_create_unknown_provider():
    """Test 7: POST /api/admin/shipping with unknown provider → 400"""
    try:
        if not test_order_id:
            print_test("Shipping Create (Unknown Provider)", False, "No test order available")
            return False
        
        payload = {
            "orderId": test_order_id,
            "provider": "xyz",
            "weight": 1.2
        }
        resp = admin_session.post(f"{API_URL}/admin/shipping", json=payload)
        passed = resp.status_code == 400
        details = f"Status: {resp.status_code} (expected 400), Error: {resp.json().get('error', 'N/A')}"
        print_test("Shipping Create (Unknown Provider)", passed, details)
        return passed
    except Exception as e:
        print_test("Shipping Create (Unknown Provider)", False, f"Error: {str(e)}")
        return False

def test_shipping_label_get_not_found():
    """Test 8: GET /api/admin/shipping?label=<orderId> → 404"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/shipping?label=nonexistent-order-id")
        passed = resp.status_code == 404
        print_test("Shipping Label GET (Not Found)", passed, f"Status: {resp.status_code} (expected 404)")
        return passed
    except Exception as e:
        print_test("Shipping Label GET (Not Found)", False, f"Error: {str(e)}")
        return False

# ==================== ORDER MANAGEMENT TESTS ====================

def test_orders_patch_set_shipped():
    """Test 9: PATCH /api/admin/orders with status=shipped, trackingNumber, carrier"""
    try:
        if not test_order_id:
            print_test("Orders PATCH (Set Shipped)", False, "No test order available")
            return False
        
        payload = {
            "status": "shipped",
            "trackingNumber": "6A12345678901",
            "carrier": "colissimo"
        }
        resp = admin_session.patch(f"{API_URL}/admin/orders?id={test_order_id}", json=payload)
        data = resp.json()
        
        # Check response structure
        has_ok = data.get('ok') == True
        has_email = 'email' in data
        email_not_configured = data.get('email', {}).get('ok') == False and data.get('email', {}).get('error') == 'not_configured'
        
        passed = resp.status_code == 200 and has_ok and has_email and email_not_configured
        details = f"Status: {resp.status_code}, ok: {data.get('ok')}, email: {data.get('email')}"
        print_test("Orders PATCH (Set Shipped)", passed, details)
        return passed
    except Exception as e:
        print_test("Orders PATCH (Set Shipped)", False, f"Error: {str(e)}")
        return False

def test_orders_get_verify_shipped():
    """Test 10: GET /api/admin/orders - verify shippedAt, trackingNumber, carrier, emailConfigured"""
    try:
        resp = admin_session.get(f"{API_URL}/admin/orders")
        data = resp.json()
        
        orders = data.get('orders', [])
        email_configured = data.get('emailConfigured', False)
        
        # Find our test order
        test_order = None
        for order in orders:
            if order.get('_id') == test_order_id:
                test_order = order
                break
        
        if not test_order:
            print_test("Orders GET (Verify Shipped)", False, "Test order not found in orders list")
            return False
        
        has_shipped_at = 'shippedAt' in test_order and test_order['shippedAt'] is not None
        has_tracking = test_order.get('trackingNumber') == '6A12345678901'
        has_carrier = test_order.get('carrier') == 'colissimo'
        email_not_configured = email_configured == False
        
        passed = has_shipped_at and has_tracking and has_carrier and email_not_configured
        details = f"shippedAt: {test_order.get('shippedAt')}, trackingNumber: {test_order.get('trackingNumber')}, carrier: {test_order.get('carrier')}, emailConfigured: {email_configured}"
        print_test("Orders GET (Verify Shipped)", passed, details)
        return passed
    except Exception as e:
        print_test("Orders GET (Verify Shipped)", False, f"Error: {str(e)}")
        return False

def test_orders_patch_non_whitelisted_field():
    """Test 11: PATCH /api/admin/orders with non-whitelisted field (total) → should NOT change"""
    try:
        if not test_order_id:
            print_test("Orders PATCH (Non-Whitelisted Field)", False, "No test order available")
            return False
        
        # Get current total
        resp = admin_session.get(f"{API_URL}/admin/orders")
        orders = resp.json().get('orders', [])
        test_order = next((o for o in orders if o.get('_id') == test_order_id), None)
        if not test_order:
            print_test("Orders PATCH (Non-Whitelisted Field)", False, "Test order not found")
            return False
        
        original_total = test_order.get('total')
        
        # Try to change total (should be ignored)
        payload = {"total": 0}
        resp = admin_session.patch(f"{API_URL}/admin/orders?id={test_order_id}", json=payload)
        
        # Verify total didn't change
        resp = admin_session.get(f"{API_URL}/admin/orders")
        orders = resp.json().get('orders', [])
        test_order = next((o for o in orders if o.get('_id') == test_order_id), None)
        
        passed = test_order.get('total') == original_total
        details = f"Original total: {original_total}, Current total: {test_order.get('total')} (should be unchanged)"
        print_test("Orders PATCH (Non-Whitelisted Field)", passed, details)
        return passed
    except Exception as e:
        print_test("Orders PATCH (Non-Whitelisted Field)", False, f"Error: {str(e)}")
        return False

def test_orders_patch_set_delivered():
    """Test 12: PATCH /api/admin/orders with status=delivered → sets deliveredAt"""
    try:
        if not test_order_id:
            print_test("Orders PATCH (Set Delivered)", False, "No test order available")
            return False
        
        payload = {"status": "delivered"}
        resp = admin_session.patch(f"{API_URL}/admin/orders?id={test_order_id}", json=payload)
        
        # Verify deliveredAt is set
        resp = admin_session.get(f"{API_URL}/admin/orders")
        orders = resp.json().get('orders', [])
        test_order = next((o for o in orders if o.get('_id') == test_order_id), None)
        
        passed = test_order and 'deliveredAt' in test_order and test_order['deliveredAt'] is not None
        details = f"deliveredAt: {test_order.get('deliveredAt') if test_order else 'N/A'}"
        print_test("Orders PATCH (Set Delivered)", passed, details)
        return passed
    except Exception as e:
        print_test("Orders PATCH (Set Delivered)", False, f"Error: {str(e)}")
        return False

def test_orders_patch_resend_email():
    """Test 13: PATCH /api/admin/orders with resendEmail=true → email not_configured, no crash"""
    try:
        if not test_order_id:
            print_test("Orders PATCH (Resend Email)", False, "No test order available")
            return False
        
        payload = {"resendEmail": True}
        resp = admin_session.patch(f"{API_URL}/admin/orders?id={test_order_id}", json=payload)
        data = resp.json()
        
        # Should return 200 with email error (not crash)
        passed = resp.status_code == 200 and data.get('email', {}).get('error') == 'not_configured'
        details = f"Status: {resp.status_code}, email: {data.get('email')}"
        print_test("Orders PATCH (Resend Email)", passed, details)
        return passed
    except Exception as e:
        print_test("Orders PATCH (Resend Email)", False, f"Error: {str(e)}")
        return False

def test_orders_patch_unknown_id():
    """Test 14: PATCH /api/admin/orders with unknown id → 404"""
    try:
        payload = {"status": "shipped"}
        resp = admin_session.patch(f"{API_URL}/admin/orders?id=unknown-order-id", json=payload)
        passed = resp.status_code == 404
        print_test("Orders PATCH (Unknown ID)", passed, f"Status: {resp.status_code} (expected 404)")
        return passed
    except Exception as e:
        print_test("Orders PATCH (Unknown ID)", False, f"Error: {str(e)}")
        return False

# ==================== CUSTOMER ORDER VISIBILITY TESTS ====================

def test_customer_order_visibility():
    """Test 15: Customer GET /api/orders returns order with trackingNumber and carrier"""
    try:
        resp = session.get(f"{API_URL}/orders")
        data = resp.json()
        
        orders = data.get('orders', [])
        test_order = next((o for o in orders if o.get('_id') == test_order_id), None)
        
        if not test_order:
            print_test("Customer Order Visibility", False, "Test order not found in customer orders")
            return False
        
        has_tracking = test_order.get('trackingNumber') == '6A12345678901'
        has_carrier = test_order.get('carrier') == 'colissimo'
        
        passed = has_tracking and has_carrier
        details = f"trackingNumber: {test_order.get('trackingNumber')}, carrier: {test_order.get('carrier')}"
        print_test("Customer Order Visibility", passed, details)
        return passed
    except Exception as e:
        print_test("Customer Order Visibility", False, f"Error: {str(e)}")
        return False

# ==================== REGRESSION TESTS ====================

def test_regression_products():
    """Test 16: GET /api/products - regression check"""
    try:
        resp = session.get(f"{API_URL}/products")
        data = resp.json()
        passed = resp.status_code == 200 and 'products' in data and len(data['products']) > 0
        print_test("Regression: Products", passed, f"Status: {resp.status_code}, Count: {len(data.get('products', []))}")
        return passed
    except Exception as e:
        print_test("Regression: Products", False, f"Error: {str(e)}")
        return False

def test_regression_cart():
    """Test 17: GET /api/cart - regression check"""
    try:
        resp = session.get(f"{API_URL}/cart")
        data = resp.json()
        passed = resp.status_code == 200 and 'items' in data
        print_test("Regression: Cart", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Regression: Cart", False, f"Error: {str(e)}")
        return False

def test_regression_cart_delete():
    """Test 18: DELETE /api/cart?slug=... - regression check"""
    try:
        # Add item first
        session.post(f"{API_URL}/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        
        # Delete it
        resp = session.delete(f"{API_URL}/cart?slug=plaid-sylvestre")
        data = resp.json()
        passed = resp.status_code == 200
        print_test("Regression: Cart Delete", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Regression: Cart Delete", False, f"Error: {str(e)}")
        return False

def test_regression_site_content():
    """Test 19: GET /api/site-content - regression check"""
    try:
        resp = session.get(f"{API_URL}/site-content")
        data = resp.json()
        passed = resp.status_code == 200 and 'content' in data
        print_test("Regression: Site Content", passed, f"Status: {resp.status_code}")
        return passed
    except Exception as e:
        print_test("Regression: Site Content", False, f"Error: {str(e)}")
        return False

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all shipping endpoint tests"""
    print("\n" + "="*80)
    print("SHIPPING ENDPOINTS TEST SUITE")
    print("Testing new shipping label generation and order management endpoints")
    print("="*80 + "\n")
    
    # Setup
    print("Setting up test environment...")
    if not setup_admin_session():
        print("❌ Failed to setup admin session")
        return 0, 0, []
    
    if not setup_customer_session():
        print("❌ Failed to setup customer session")
        return 0, 0, []
    
    if not create_test_order():
        print("❌ Failed to create test order")
        return 0, 0, []
    
    print(f"✅ Test environment ready (Order ID: {test_order_id})\n")
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    tests = [
        ("Shipping Status (No Auth)", test_shipping_status_no_auth),
        ("Shipping Status (Admin)", test_shipping_status_with_admin),
        ("Shipping Create (Unknown Order)", test_shipping_create_unknown_order),
        ("Shipping Create (No Weight)", test_shipping_create_no_weight),
        ("Shipping Create (Colissimo Not Configured)", test_shipping_create_colissimo_not_configured),
        ("Shipping Create (Boxtal Not Configured)", test_shipping_create_boxtal_not_configured),
        ("Shipping Create (Unknown Provider)", test_shipping_create_unknown_provider),
        ("Shipping Label GET (Not Found)", test_shipping_label_get_not_found),
        ("Orders PATCH (Set Shipped)", test_orders_patch_set_shipped),
        ("Orders GET (Verify Shipped)", test_orders_get_verify_shipped),
        ("Orders PATCH (Non-Whitelisted Field)", test_orders_patch_non_whitelisted_field),
        ("Orders PATCH (Set Delivered)", test_orders_patch_set_delivered),
        ("Orders PATCH (Resend Email)", test_orders_patch_resend_email),
        ("Orders PATCH (Unknown ID)", test_orders_patch_unknown_id),
        ("Customer Order Visibility", test_customer_order_visibility),
        ("Regression: Products", test_regression_products),
        ("Regression: Cart", test_regression_cart),
        ("Regression: Cart Delete", test_regression_cart_delete),
        ("Regression: Site Content", test_regression_site_content),
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
        print("\n✅ ALL TESTS PASSED - SHIPPING ENDPOINTS WORKING CORRECTLY")
    
    print(f"\n📦 Test order created: {test_order_id}")
    print("Note: Test order left in database for inspection\n")
    
    print("="*80 + "\n")
    
    return passed_tests, total_tests, failed_tests

if __name__ == "__main__":
    passed, total, failed = run_all_tests()
    exit(0 if len(failed) == 0 else 1)
