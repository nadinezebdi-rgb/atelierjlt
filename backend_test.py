#!/usr/bin/env python3
"""
Backend test for shop closure feature (salesOpen:false)
Tests that the shop is fully closed for sales with no orders possible without payment.
"""

import requests
import json
import sys
from pymongo import MongoClient
from bson import Binary
import os

BASE_URL = "https://french-craft.preview.emergentagent.com/api"
ADMIN_PASSWORD = "Juliette99*"
CLIENT_EMAIL = "test@atelierjlt.fr"
CLIENT_PASSWORD = "MonSecret123"

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status}: {name}")
    if details:
        print(f"  {details}")
    return passed

def test_shop_status():
    """Test 1: GET /api/shop/status → {salesOpen:false}"""
    print("\n" + "="*80)
    print("TEST 1: Shop Status")
    print("="*80)
    
    try:
        r = requests.get(f"{BASE_URL}/shop/status")
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("salesOpen") == False
        )
        
        return print_test(
            "GET /api/shop/status returns salesOpen:false",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        return print_test("GET /api/shop/status", False, f"Error: {e}")

def test_cart_operations_closed():
    """Test 2: Cart operations should return 403 when sales are closed"""
    print("\n" + "="*80)
    print("TEST 2: Cart Operations (Sales Closed)")
    print("="*80)
    
    session = requests.Session()
    all_passed = True
    
    # Test 2a: POST /api/cart → 403
    try:
        r = session.post(f"{BASE_URL}/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        data = r.json()
        
        passed = (
            r.status_code == 403 and
            data.get("salesClosed") == True and
            "error" in data
        )
        
        all_passed &= print_test(
            "POST /api/cart returns 403 with salesClosed:true",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/cart", False, f"Error: {e}")
    
    # Test 2b: PATCH /api/cart → 403
    try:
        r = session.patch(f"{BASE_URL}/cart", json={"slug": "plaid-sylvestre", "qty": 2})
        data = r.json()
        
        passed = (
            r.status_code == 403 and
            data.get("salesClosed") == True
        )
        
        all_passed &= print_test(
            "PATCH /api/cart returns 403 with salesClosed:true",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("PATCH /api/cart", False, f"Error: {e}")
    
    # Test 2c: POST /api/cart/save → 403
    try:
        r = session.post(f"{BASE_URL}/cart/save", json={"email": "test@example.com"})
        data = r.json()
        
        passed = (
            r.status_code == 403 and
            data.get("salesClosed") == True
        )
        
        all_passed &= print_test(
            "POST /api/cart/save returns 403 with salesClosed:true",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/cart/save", False, f"Error: {e}")
    
    # Test 2d: POST /api/cart/checkout-email → 403
    try:
        r = session.post(f"{BASE_URL}/cart/checkout-email", json={"email": "test@example.com"})
        data = r.json()
        
        passed = (
            r.status_code == 403 and
            data.get("salesClosed") == True
        )
        
        all_passed &= print_test(
            "POST /api/cart/checkout-email returns 403 with salesClosed:true",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/cart/checkout-email", False, f"Error: {e}")
    
    # Test 2e: GET /api/cart still works (200)
    try:
        r = session.get(f"{BASE_URL}/cart")
        data = r.json()
        
        passed = r.status_code == 200
        
        all_passed &= print_test(
            "GET /api/cart still returns 200",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/cart", False, f"Error: {e}")
    
    # Test 2f: DELETE /api/cart still works
    try:
        r = session.delete(f"{BASE_URL}/cart?slug=plaid-sylvestre")
        data = r.json()
        
        passed = r.status_code == 200
        
        all_passed &= print_test(
            "DELETE /api/cart still returns 200",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("DELETE /api/cart", False, f"Error: {e}")
    
    return all_passed

def test_orders_closed():
    """Test 3: POST /api/orders → 403, no order created, no stock change, no email"""
    print("\n" + "="*80)
    print("TEST 3: Orders (Sales Closed)")
    print("="*80)
    
    # First, insert items directly into MongoDB for a test session
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "ginette_creations")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Create a test cart with items
        test_sid = "test-sales-closed-cart"
        db.carts.update_one(
            {"_id": test_sid},
            {
                "$set": {
                    "items": [
                        {
                            "slug": "plaid-sylvestre",
                            "name": "Plaid Sylvestre",
                            "price": 340,
                            "qty": 1,
                            "variant": None,
                            "size": None,
                            "image": None
                        }
                    ],
                    "updatedAt": "2024-01-01T00:00:00Z"
                }
            },
            upsert=True
        )
        
        # Get initial counts
        initial_orders = db.orders.count_documents({})
        initial_emails = db.email_logs.count_documents({})
        
        # Try to create an order with this cart
        session = requests.Session()
        session.cookies.set("ginette_sid", test_sid)
        
        r = session.post(f"{BASE_URL}/orders", json={
            "address": {
                "firstName": "Test",
                "lastName": "User",
                "email": "test@example.com",
                "address": "123 Test St",
                "zip": "75001",
                "city": "Paris",
                "country": "France",
                "phone": "0123456789",
                "shippingMethod": "standard"
            }
        })
        
        data = r.json()
        
        # Check response
        response_ok = (
            r.status_code == 403 and
            data.get("salesClosed") == True and
            "error" in data
        )
        
        # Check no order was created
        final_orders = db.orders.count_documents({})
        no_order_created = (final_orders == initial_orders)
        
        # Check no email was sent
        final_emails = db.email_logs.count_documents({})
        no_email_sent = (final_emails == initial_emails)
        
        # Cleanup
        db.carts.delete_one({"_id": test_sid})
        
        passed = response_ok and no_order_created and no_email_sent
        
        return print_test(
            "POST /api/orders returns 403, no order created, no email sent",
            passed,
            f"Status: {r.status_code}, Response: {data}, Orders: {initial_orders}→{final_orders}, Emails: {initial_emails}→{final_emails}"
        )
        
    except Exception as e:
        return print_test("POST /api/orders", False, f"Error: {e}")

def test_gift_cards_closed():
    """Test 4: POST /api/gift-cards → 403, no gift_cards doc created"""
    print("\n" + "="*80)
    print("TEST 4: Gift Cards (Sales Closed)")
    print("="*80)
    
    all_passed = True
    
    # Test 4a: POST /api/gift-cards → 403
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "ginette_creations")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        initial_count = db.gift_cards.count_documents({})
        
        r = requests.post(f"{BASE_URL}/gift-cards", json={"amount": 50})
        data = r.json()
        
        final_count = db.gift_cards.count_documents({})
        
        passed = (
            r.status_code == 403 and
            data.get("salesClosed") == True and
            final_count == initial_count
        )
        
        all_passed &= print_test(
            "POST /api/gift-cards returns 403, no gift card created",
            passed,
            f"Status: {r.status_code}, Response: {data}, Gift cards: {initial_count}→{final_count}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/gift-cards", False, f"Error: {e}")
    
    # Test 4b: POST /api/gift-cards/verify still works (404 for unknown)
    try:
        r = requests.post(f"{BASE_URL}/gift-cards/verify", json={"code": "UNKNOWN-CODE"})
        data = r.json()
        
        passed = (
            r.status_code == 404 and
            data.get("valid") == False
        )
        
        all_passed &= print_test(
            "POST /api/gift-cards/verify still works (404 for unknown)",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/gift-cards/verify", False, f"Error: {e}")
    
    return all_passed

def test_cart_restore_closed():
    """Test 5: GET /api/cart/restore?t=anything → 302 to site root"""
    print("\n" + "="*80)
    print("TEST 5: Cart Restore (Sales Closed)")
    print("="*80)
    
    try:
        r = requests.get(f"{BASE_URL}/cart/restore?t=anything", allow_redirects=False)
        
        passed = (
            r.status_code == 302 and
            r.headers.get("Location", "").endswith("/")
        )
        
        return print_test(
            "GET /api/cart/restore redirects to site root (302)",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location')}"
        )
    except Exception as e:
        return print_test("GET /api/cart/restore", False, f"Error: {e}")

def test_shop_notify():
    """Test 6: POST /api/shop/notify with email validation"""
    print("\n" + "="*80)
    print("TEST 6: Shop Notify (Waitlist)")
    print("="*80)
    
    all_passed = True
    
    # Test 6a: Bad email → 400
    try:
        r = requests.post(f"{BASE_URL}/shop/notify", json={"email": "bad"})
        data = r.json()
        
        passed = (
            r.status_code == 400 and
            "error" in data
        )
        
        all_passed &= print_test(
            "POST /api/shop/notify with bad email returns 400",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/shop/notify (bad email)", False, f"Error: {e}")
    
    # Test 6b: Valid email → 200
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "ginette_creations")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        test_email = "qa+notify@example.com"
        
        # Clean up first
        db.sales_waitlist.delete_one({"email": test_email})
        
        r = requests.post(f"{BASE_URL}/shop/notify", json={"email": test_email, "slug": "plaid-sylvestre"})
        data = r.json()
        
        # Check response
        response_ok = (r.status_code == 200 and data.get("ok") == True)
        
        # Check doc was created
        doc = db.sales_waitlist.find_one({"email": test_email})
        doc_created = (doc is not None and "plaid-sylvestre" in doc.get("slugs", []))
        
        passed = response_ok and doc_created
        
        all_passed &= print_test(
            "POST /api/shop/notify with valid email creates waitlist doc",
            passed,
            f"Status: {r.status_code}, Response: {data}, Doc created: {doc_created}"
        )
        
        # Test 6c: Same email with different slug → adds to slugs array
        r2 = requests.post(f"{BASE_URL}/shop/notify", json={"email": test_email, "slug": "plaid-boreal"})
        data2 = r2.json()
        
        doc2 = db.sales_waitlist.find_one({"email": test_email})
        both_slugs = (
            doc2 is not None and
            "plaid-sylvestre" in doc2.get("slugs", []) and
            "plaid-boreal" in doc2.get("slugs", [])
        )
        
        passed2 = (r2.status_code == 200 and both_slugs)
        
        all_passed &= print_test(
            "POST /api/shop/notify with same email adds to slugs array",
            passed2,
            f"Status: {r2.status_code}, Slugs: {doc2.get('slugs', []) if doc2 else []}"
        )
        
        # Cleanup
        db.sales_waitlist.delete_one({"email": test_email})
        
    except Exception as e:
        all_passed &= print_test("POST /api/shop/notify (valid email)", False, f"Error: {e}")
    
    return all_passed

def test_admin_shop():
    """Test 7: Admin GET /api/admin/shop and PATCH operations"""
    print("\n" + "="*80)
    print("TEST 7: Admin Shop Endpoints")
    print("="*80)
    
    all_passed = True
    
    # Login as admin
    session = requests.Session()
    try:
        r = session.post(f"{BASE_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        if r.status_code != 200:
            return print_test("Admin login", False, f"Failed to login: {r.status_code}")
    except Exception as e:
        return print_test("Admin login", False, f"Error: {e}")
    
    # Test 7a: GET /api/admin/shop → {salesOpen:false, paymentReady:false, waitlist:>=1}
    try:
        r = session.get(f"{BASE_URL}/admin/shop")
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("salesOpen") == False and
            data.get("paymentReady") == False and
            "waitlist" in data
        )
        
        all_passed &= print_test(
            "GET /api/admin/shop returns correct status",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/admin/shop", False, f"Error: {e}")
    
    # Test 7b: PATCH {salesOpen:true} → 409 (cannot open without payment)
    try:
        r = session.patch(f"{BASE_URL}/admin/shop", json={"salesOpen": True})
        data = r.json()
        
        passed = (
            r.status_code == 409 and
            "error" in data
        )
        
        all_passed &= print_test(
            "PATCH /api/admin/shop {salesOpen:true} returns 409",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("PATCH /api/admin/shop (open)", False, f"Error: {e}")
    
    # Test 7c: PATCH {salesOpen:false} → 200
    try:
        r = session.patch(f"{BASE_URL}/admin/shop", json={"salesOpen": False})
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") == True and
            data.get("salesOpen") == False
        )
        
        all_passed &= print_test(
            "PATCH /api/admin/shop {salesOpen:false} returns 200",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("PATCH /api/admin/shop (close)", False, f"Error: {e}")
    
    # Test 7d: Without admin → 401
    try:
        r = requests.get(f"{BASE_URL}/admin/shop")
        
        passed = r.status_code == 401
        
        all_passed &= print_test(
            "GET /api/admin/shop without admin returns 401",
            passed,
            f"Status: {r.status_code}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/admin/shop (no auth)", False, f"Error: {e}")
    
    return all_passed

def test_admin_reminders_closed():
    """Test 8: Admin POST /api/admin/emails/run-reminders → salesClosed:true"""
    print("\n" + "="*80)
    print("TEST 8: Admin Email Reminders (Sales Closed)")
    print("="*80)
    
    # Login as admin
    session = requests.Session()
    try:
        r = session.post(f"{BASE_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        if r.status_code != 200:
            return print_test("Admin login", False, f"Failed to login: {r.status_code}")
    except Exception as e:
        return print_test("Admin login", False, f"Error: {e}")
    
    try:
        r = session.post(f"{BASE_URL}/admin/emails/run-reminders")
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("salesClosed") == True and
            data.get("sent", 0) == 0
        )
        
        return print_test(
            "POST /api/admin/emails/run-reminders returns salesClosed:true, sent:0",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        return print_test("POST /api/admin/emails/run-reminders", False, f"Error: {e}")

def test_regression():
    """Test 9: Regression - basic endpoints still work"""
    print("\n" + "="*80)
    print("TEST 9: Regression Tests")
    print("="*80)
    
    all_passed = True
    
    # Test 9a: GET /api/products
    try:
        r = requests.get(f"{BASE_URL}/products")
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "products" in data and
            len(data.get("products", [])) > 0
        )
        
        all_passed &= print_test(
            "GET /api/products still works",
            passed,
            f"Status: {r.status_code}, Products count: {len(data.get('products', []))}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products", False, f"Error: {e}")
    
    # Test 9b: GET /api/products/plaid-sylvestre
    try:
        r = requests.get(f"{BASE_URL}/products/plaid-sylvestre")
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "product" in data
        )
        
        all_passed &= print_test(
            "GET /api/products/plaid-sylvestre still works",
            passed,
            f"Status: {r.status_code}, Product: {data.get('product', {}).get('name', 'N/A')}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products/plaid-sylvestre", False, f"Error: {e}")
    
    # Test 9c: Login
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        data = r.json()
        
        passed = r.status_code == 200
        
        all_passed &= print_test(
            "POST /api/auth/login still works",
            passed,
            f"Status: {r.status_code}"
        )
    except Exception as e:
        all_passed &= print_test("POST /api/auth/login", False, f"Error: {e}")
    
    # Test 9d: GET /api/admin/products (with admin auth)
    session = requests.Session()
    try:
        r = session.post(f"{BASE_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        if r.status_code == 200:
            r = session.get(f"{BASE_URL}/admin/products")
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                "products" in data
            )
            
            all_passed &= print_test(
                "GET /api/admin/products still works",
                passed,
                f"Status: {r.status_code}, Products count: {len(data.get('products', []))}"
            )
        else:
            all_passed &= print_test("GET /api/admin/products", False, "Admin login failed")
    except Exception as e:
        all_passed &= print_test("GET /api/admin/products", False, f"Error: {e}")
    
    return all_passed

def cleanup():
    """Cleanup test data"""
    print("\n" + "="*80)
    print("CLEANUP")
    print("="*80)
    
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "ginette_creations")
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Delete test waitlist docs
        result = db.sales_waitlist.delete_many({"email": {"$regex": "^qa\\+"}})
        print(f"✅ Deleted {result.deleted_count} test sales_waitlist docs")
        
        # Delete test carts
        result = db.carts.delete_many({"_id": {"$regex": "^test-"}})
        print(f"✅ Deleted {result.deleted_count} test carts")
        
    except Exception as e:
        print(f"⚠️  Cleanup error: {e}")

def main():
    print("="*80)
    print("SHOP CLOSURE BACKEND TESTING")
    print("Testing that shop is fully closed for sales (no orders without payment)")
    print("="*80)
    
    results = []
    
    # Run all tests
    results.append(("Shop Status", test_shop_status()))
    results.append(("Cart Operations (Closed)", test_cart_operations_closed()))
    results.append(("Orders (Closed)", test_orders_closed()))
    results.append(("Gift Cards (Closed)", test_gift_cards_closed()))
    results.append(("Cart Restore (Closed)", test_cart_restore_closed()))
    results.append(("Shop Notify", test_shop_notify()))
    results.append(("Admin Shop", test_admin_shop()))
    results.append(("Admin Reminders (Closed)", test_admin_reminders_closed()))
    results.append(("Regression", test_regression()))
    
    # Cleanup
    cleanup()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
