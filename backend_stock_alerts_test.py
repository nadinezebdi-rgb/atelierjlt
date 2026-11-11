#!/usr/bin/env python3
"""
Backend API Testing Script for Stock Alerts & Navbar
Tests new endpoints: /api/stock-alerts, /api/admin/stock-alerts, /api/site-pages/navbar
"""

import requests
import json
import sys
from pymongo import MongoClient
import os
import time

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log_test(test_name, passed, details=""):
    """Log test result with color coding"""
    status = f"{GREEN}✅ PASSED{RESET}" if passed else f"{RED}❌ FAILED{RESET}"
    print(f"\n{status} - {test_name}")
    if details:
        print(f"  {details}")
    return passed

def admin_login():
    """Login as admin and return session with cookie"""
    session = requests.Session()
    try:
        resp = session.post(f"{BASE_URL}/api/auth/admin-login", json={"password": ADMIN_PASSWORD}, timeout=10)
        if resp.status_code == 200:
            print(f"{GREEN}✅ Admin login successful{RESET}")
            return session
        else:
            print(f"{RED}❌ Admin login failed: {resp.status_code}{RESET}")
            return None
    except Exception as e:
        print(f"{RED}❌ Admin login error: {e}{RESET}")
        return None

def get_mongo_db():
    """Get MongoDB database connection"""
    try:
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.getenv('DB_NAME', 'ginette_creations')
        client = MongoClient(mongo_url)
        return client[db_name]
    except Exception as e:
        print(f"{RED}❌ MongoDB connection error: {e}{RESET}")
        return None

def test_stock_alerts_public_validation():
    """Test 1: POST /api/stock-alerts with bad email → 400"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 1: POST /api/stock-alerts - Email validation{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    all_passed = True
    
    # Test bad email
    try:
        resp = requests.post(f"{BASE_URL}/api/stock-alerts", 
                           json={"slug": "plaid-sylvestre", "variant": "Vert sylvestre", "email": "bademail"},
                           timeout=10)
        
        if resp.status_code == 400:
            data = resp.json()
            log_test("POST /api/stock-alerts (bad email)", True, 
                    f"Correctly returns 400: {data.get('error')}")
        else:
            log_test("POST /api/stock-alerts (bad email)", False, 
                    f"Expected 400, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("POST /api/stock-alerts (bad email)", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_stock_alerts_unknown_slug():
    """Test 2: POST /api/stock-alerts with unknown slug → 404"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 2: POST /api/stock-alerts - Unknown slug{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    try:
        resp = requests.post(f"{BASE_URL}/api/stock-alerts", 
                           json={"slug": "unknown-product-xyz", "email": "test@example.com"},
                           timeout=10)
        
        if resp.status_code == 404:
            data = resp.json()
            return log_test("POST /api/stock-alerts (unknown slug)", True, 
                          f"Correctly returns 404: {data.get('error')}")
        else:
            return log_test("POST /api/stock-alerts (unknown slug)", False, 
                          f"Expected 404, got {resp.status_code}")
    except Exception as e:
        return log_test("POST /api/stock-alerts (unknown slug)", False, f"Exception: {e}")

def test_stock_alerts_in_stock():
    """Test 3: POST /api/stock-alerts for in-stock variant → 409"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 3: POST /api/stock-alerts - In-stock variant{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    try:
        # plaid-sylvestre variant 'Vert sylvestre' should be in stock
        resp = requests.post(f"{BASE_URL}/api/stock-alerts", 
                           json={"slug": "plaid-sylvestre", "variant": "Vert sylvestre", "email": "test@example.com"},
                           timeout=10)
        
        if resp.status_code == 409:
            data = resp.json()
            return log_test("POST /api/stock-alerts (in-stock)", True, 
                          f"Correctly returns 409: {data.get('error')}")
        else:
            return log_test("POST /api/stock-alerts (in-stock)", False, 
                          f"Expected 409, got {resp.status_code}")
    except Exception as e:
        return log_test("POST /api/stock-alerts (in-stock)", False, f"Exception: {e}")

def test_stock_alerts_out_of_stock_flow():
    """Test 4-8: Complete out-of-stock alert flow"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 4-8: Complete stock alert flow{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    session = admin_login()
    if not session:
        return False
    
    all_passed = True
    original_product = None
    alert_id = None
    
    try:
        # Step 1: Get current product state
        print(f"\n{BLUE}Step 1: Get current product state{RESET}")
        resp = session.get(f"{BASE_URL}/api/admin/products", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/admin/products", False, f"Expected 200, got {resp.status_code}")
            return False
        
        data = resp.json()
        products = data.get('products', [])
        plaid = None
        
        for p in products:
            if p.get('slug') == 'plaid-sylvestre':
                plaid = p
                original_product = json.dumps(p)  # Save original state
                break
        
        if not plaid:
            log_test("Find plaid-sylvestre", False, "Product not found")
            return False
        
        log_test("GET /api/admin/products", True, 
                f"Found plaid-sylvestre with {len(plaid.get('variants', []))} variants")
        
        # Find Bordeaux variant
        bordeaux_variant = None
        for v in plaid.get('variants', []):
            if v.get('name') == 'Bordeaux':
                bordeaux_variant = v
                break
        
        if not bordeaux_variant:
            log_test("Find Bordeaux variant", False, "Variant not found")
            return False
        
        original_stock = bordeaux_variant.get('stock', 0)
        log_test("Find Bordeaux variant", True, f"Original stock: {original_stock}")
        
        # Step 2: Set Bordeaux variant stock to 0
        print(f"\n{BLUE}Step 2: Set Bordeaux variant stock to 0{RESET}")
        
        # Modify the variant stock
        modified_variants = []
        for v in plaid.get('variants', []):
            v_copy = v.copy()
            if v_copy.get('name') == 'Bordeaux':
                v_copy['stock'] = 0
            modified_variants.append(v_copy)
        
        patch_data = plaid.copy()
        patch_data['variants'] = modified_variants
        
        resp = session.patch(f"{BASE_URL}/api/admin/products?slug=plaid-sylvestre", 
                           json=patch_data, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH product (set stock to 0)", False, f"Expected 200, got {resp.status_code}")
            return False
        
        patch_resp = resp.json()
        if not patch_resp.get('ok'):
            log_test("PATCH product (set stock to 0)", False, f"Response ok != true: {patch_resp}")
            return False
        
        # Check if stockAlerts field is present
        stock_alerts_info = patch_resp.get('stockAlerts')
        log_test("PATCH product (set stock to 0)", True, 
                f"Stock set to 0, stockAlerts field present: {stock_alerts_info is not None}")
        
        # Step 3: Create stock alert for Bordeaux variant
        print(f"\n{BLUE}Step 3: Create stock alert for Bordeaux variant{RESET}")
        
        resp = requests.post(f"{BASE_URL}/api/stock-alerts", 
                           json={"slug": "plaid-sylvestre", "variant": "Bordeaux", "email": "alert@example.com"},
                           timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/stock-alerts (out-of-stock)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') and data.get('already') == False:
                log_test("POST /api/stock-alerts (out-of-stock)", True, 
                        f"Alert created: ok={data.get('ok')}, already={data.get('already')}")
            else:
                log_test("POST /api/stock-alerts (out-of-stock)", False, 
                        f"Unexpected response: {data}")
                all_passed = False
        
        # Step 4: Try to create same alert again (should return already=true)
        print(f"\n{BLUE}Step 4: Create same alert again (should return already=true){RESET}")
        
        resp = requests.post(f"{BASE_URL}/api/stock-alerts", 
                           json={"slug": "plaid-sylvestre", "variant": "Bordeaux", "email": "alert@example.com"},
                           timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/stock-alerts (duplicate)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') and data.get('already') == True:
                log_test("POST /api/stock-alerts (duplicate)", True, 
                        f"Duplicate detected: ok={data.get('ok')}, already={data.get('already')}")
            else:
                log_test("POST /api/stock-alerts (duplicate)", False, 
                        f"Expected already=true, got: {data}")
                all_passed = False
        
        # Step 5: GET /api/admin/stock-alerts (admin)
        print(f"\n{BLUE}Step 5: GET /api/admin/stock-alerts (admin){RESET}")
        
        resp = session.get(f"{BASE_URL}/api/admin/stock-alerts", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/admin/stock-alerts", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            alerts = data.get('alerts', [])
            summary = data.get('summary', [])
            email_configured = data.get('emailConfigured', False)
            
            # Find our alert
            our_alert = None
            for alert in alerts:
                if (alert.get('slug') == 'plaid-sylvestre' and 
                    alert.get('variant') == 'Bordeaux' and 
                    alert.get('email') == 'alert@example.com'):
                    our_alert = alert
                    alert_id = alert.get('_id')
                    break
            
            if our_alert:
                # Check summary
                plaid_summary = None
                for s in summary:
                    if s.get('slug') == 'plaid-sylvestre':
                        plaid_summary = s
                        break
                
                log_test("GET /api/admin/stock-alerts", True, 
                        f"Alert found: {len(alerts)} total alerts, "
                        f"plaid-sylvestre count={plaid_summary.get('count') if plaid_summary else 0}, "
                        f"emailConfigured={email_configured}")
            else:
                log_test("GET /api/admin/stock-alerts", False, 
                        f"Alert not found in list of {len(alerts)} alerts")
                all_passed = False
        
        # Step 6: GET /api/admin/stock-alerts without admin (should return 401)
        print(f"\n{BLUE}Step 6: GET /api/admin/stock-alerts without admin (401){RESET}")
        
        resp = requests.get(f"{BASE_URL}/api/admin/stock-alerts", timeout=10)
        
        if resp.status_code == 401:
            log_test("GET /api/admin/stock-alerts (no auth)", True, "Correctly returns 401")
        else:
            log_test("GET /api/admin/stock-alerts (no auth)", False, 
                    f"Expected 401, got {resp.status_code}")
            all_passed = False
        
        # Step 7: POST /api/admin/stock-alerts/notify
        print(f"\n{BLUE}Step 7: POST /api/admin/stock-alerts/notify{RESET}")
        
        resp = session.post(f"{BASE_URL}/api/admin/stock-alerts/notify?slug=plaid-sylvestre", timeout=10)
        
        if resp.status_code != 200:
            log_test("POST /api/admin/stock-alerts/notify", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            sent = data.get('sent', 0)
            configured = data.get('configured', False)
            
            log_test("POST /api/admin/stock-alerts/notify", True, 
                    f"Notify endpoint working: sent={sent}, configured={configured}")
        
        # Step 8: Restore product to original stock
        print(f"\n{BLUE}Step 8: Restore Bordeaux stock to original{RESET}")
        
        # Restore original variant stock
        restored_variants = []
        for v in plaid.get('variants', []):
            v_copy = v.copy()
            if v_copy.get('name') == 'Bordeaux':
                v_copy['stock'] = original_stock
            restored_variants.append(v_copy)
        
        restore_data = plaid.copy()
        restore_data['variants'] = restored_variants
        
        resp = session.patch(f"{BASE_URL}/api/admin/products?slug=plaid-sylvestre", 
                           json=restore_data, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH product (restore stock)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            restore_resp = resp.json()
            stock_alerts_info = restore_resp.get('stockAlerts')
            
            if stock_alerts_info:
                ready = stock_alerts_info.get('ready', 0)
                sent = stock_alerts_info.get('sent', 0)
                configured = stock_alerts_info.get('configured', False)
                
                log_test("PATCH product (restore stock)", True, 
                        f"Stock restored, stockAlerts: ready={ready}, sent={sent}, configured={configured}")
            else:
                log_test("PATCH product (restore stock)", True, 
                        f"Stock restored (no stockAlerts in response)")
        
        # Step 9: DELETE alert
        print(f"\n{BLUE}Step 9: DELETE /api/admin/stock-alerts{RESET}")
        
        if alert_id:
            resp = session.delete(f"{BASE_URL}/api/admin/stock-alerts?id={alert_id}", timeout=10)
            
            if resp.status_code != 200:
                log_test("DELETE /api/admin/stock-alerts", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
            else:
                data = resp.json()
                if data.get('ok'):
                    log_test("DELETE /api/admin/stock-alerts", True, "Alert deleted successfully")
                else:
                    log_test("DELETE /api/admin/stock-alerts", False, f"Response ok != true: {data}")
                    all_passed = False
        else:
            log_test("DELETE /api/admin/stock-alerts", False, "No alert_id to delete")
            all_passed = False
        
    except Exception as e:
        log_test("Stock alert flow", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_navbar_endpoints():
    """Test 9-11: Navbar endpoints"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 9-11: Navbar endpoints{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    all_passed = True
    
    # Test 9: GET /api/site-pages/navbar
    print(f"\n{BLUE}Test 9: GET /api/site-pages/navbar{RESET}")
    
    try:
        resp = requests.get(f"{BASE_URL}/api/site-pages/navbar", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/site-pages/navbar", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            navbar = data.get('navbar', {})
            items = navbar.get('items', [])
            
            if len(items) >= 7:
                # Check first item
                first_item = items[0]
                if first_item.get('label') == 'Accueil' and first_item.get('href') == '/':
                    # Check second item
                    second_item = items[1]
                    if second_item.get('label') == 'Produits' and second_item.get('href') == '/produits':
                        log_test("GET /api/site-pages/navbar", True, 
                                f"Returns {len(items)} items, first='Accueil' ('/'), second='Produits' ('/produits')")
                    else:
                        log_test("GET /api/site-pages/navbar", False, 
                                f"Second item incorrect: {second_item}")
                        all_passed = False
                else:
                    log_test("GET /api/site-pages/navbar", False, 
                            f"First item incorrect: {first_item}")
                    all_passed = False
            else:
                log_test("GET /api/site-pages/navbar", False, 
                        f"Expected >= 7 items, got {len(items)}")
                all_passed = False
    except Exception as e:
        log_test("GET /api/site-pages/navbar", False, f"Exception: {e}")
        all_passed = False
    
    # Test 10: PATCH /api/admin/site-pages/navbar
    print(f"\n{BLUE}Test 10: PATCH /api/admin/site-pages/navbar{RESET}")
    
    session = admin_login()
    if not session:
        return False
    
    try:
        # Test with valid data (href with /collections should be normalized to /produits)
        navbar_data = {
            'items': [
                {'label': 'Accueil', 'href': '/'},
                {'label': 'Boutique', 'href': '/collections?cat=nouveautes'}
            ]
        }
        
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/navbar", json=navbar_data, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH /api/admin/site-pages/navbar", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok'):
                # Verify the change
                resp2 = requests.get(f"{BASE_URL}/api/site-pages/navbar", timeout=10)
                if resp2.status_code == 200:
                    navbar_resp = resp2.json()
                    navbar = navbar_resp.get('navbar', {})
                    items = navbar.get('items', [])
                    
                    # Check if href was normalized from /collections to /produits
                    if len(items) >= 2:
                        second_item = items[1]
                        if second_item.get('label') == 'Boutique' and second_item.get('href') == '/produits?cat=nouveautes':
                            log_test("PATCH /api/admin/site-pages/navbar", True, 
                                    f"Updated successfully, href normalized: '/collections?cat=nouveautes' → '/produits?cat=nouveautes'")
                        else:
                            log_test("PATCH /api/admin/site-pages/navbar", False, 
                                    f"Second item incorrect after update: {second_item}")
                            all_passed = False
                    else:
                        log_test("PATCH /api/admin/site-pages/navbar", False, 
                                f"Expected >= 2 items after update, got {len(items)}")
                        all_passed = False
                else:
                    log_test("PATCH /api/admin/site-pages/navbar (verify)", False, 
                            f"Expected 200, got {resp2.status_code}")
                    all_passed = False
            else:
                log_test("PATCH /api/admin/site-pages/navbar", False, f"Response ok != true: {data}")
                all_passed = False
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/navbar", False, f"Exception: {e}")
        all_passed = False
    
    # Test 11: PATCH with invalid data
    print(f"\n{BLUE}Test 11: PATCH /api/admin/site-pages/navbar (validation){RESET}")
    
    try:
        # Test with empty items (should return 400)
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/navbar", json={'items': []}, timeout=10)
        
        if resp.status_code == 400:
            log_test("PATCH navbar (empty items)", True, "Correctly returns 400 for empty items")
        else:
            log_test("PATCH navbar (empty items)", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        
        # Test with javascript: href (should be dropped)
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/navbar", 
                           json={'items': [
                               {'label': 'Accueil', 'href': '/'},
                               {'label': 'Bad', 'href': 'javascript:alert(1)'}
                           ]}, timeout=10)
        
        if resp.status_code == 200:
            # Verify javascript: href was dropped
            resp2 = requests.get(f"{BASE_URL}/api/site-pages/navbar", timeout=10)
            if resp2.status_code == 200:
                navbar_resp = resp2.json()
                navbar = navbar_resp.get('navbar', {})
                items = navbar.get('items', [])
                
                # Should only have 1 item (javascript: href dropped)
                if len(items) == 1 and items[0].get('label') == 'Accueil':
                    log_test("PATCH navbar (javascript: href)", True, 
                            "javascript: href correctly dropped, only 1 valid item remains")
                else:
                    log_test("PATCH navbar (javascript: href)", False, 
                            f"Expected 1 item, got {len(items)}: {items}")
                    all_passed = False
            else:
                log_test("PATCH navbar (javascript: href verify)", False, 
                        f"Expected 200, got {resp2.status_code}")
                all_passed = False
        else:
            log_test("PATCH navbar (javascript: href)", False, 
                    f"Expected 200, got {resp.status_code}")
            all_passed = False
        
    except Exception as e:
        log_test("PATCH navbar validation", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_pages_render():
    """Test 12: Pages /produits, /produits?cat=nouveautes, /collections return 200"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 12: Pages render{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    pages = [
        '/produits',
        '/produits?cat=nouveautes',
        '/collections'
    ]
    
    all_passed = True
    
    for page in pages:
        try:
            resp = requests.get(f"{BASE_URL}{page}", timeout=10)
            
            if resp.status_code == 200:
                log_test(f"GET {page}", True, f"Returns 200 OK ({len(resp.text)} bytes)")
            else:
                log_test(f"GET {page}", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
        except Exception as e:
            log_test(f"GET {page}", False, f"Exception: {e}")
            all_passed = False
    
    return all_passed

def cleanup_mongodb():
    """Test 13: Cleanup MongoDB - restore product and delete test stock_alerts"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 13: CLEANUP - Restore MongoDB state{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    db = get_mongo_db()
    if db is None:
        return False
    
    all_passed = True
    
    try:
        # Check if product_overrides for plaid-sylvestre exists
        override = db.product_overrides.find_one({'slug': 'plaid-sylvestre'})
        
        if override:
            # Delete the override (restore to catalog default)
            result = db.product_overrides.delete_one({'slug': 'plaid-sylvestre'})
            log_test("Delete product_overrides for plaid-sylvestre", True, 
                    f"Deleted {result.deleted_count} document(s)")
        else:
            log_test("Check product_overrides for plaid-sylvestre", True, 
                    "No override found (already at catalog default)")
        
        # Delete test stock_alerts
        result = db.stock_alerts.delete_many({
            'slug': 'plaid-sylvestre',
            'email': 'alert@example.com'
        })
        
        log_test("Delete test stock_alerts", True, 
                f"Deleted {result.deleted_count} test alert(s)")
        
        # Delete navbar override
        result = db.site_pages.delete_one({'_id': 'navbar'})
        
        if result.deleted_count > 0:
            log_test("Delete navbar override", True, 
                    f"Deleted navbar override, restored to defaults")
        else:
            log_test("Check navbar override", True, 
                    "No navbar override found (already at defaults)")
        
        # Verify navbar is back to defaults
        resp = requests.get(f"{BASE_URL}/api/site-pages/navbar", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            navbar = data.get('navbar', {})
            items = navbar.get('items', [])
            
            if len(items) >= 7:
                log_test("Verify navbar defaults restored", True, 
                        f"Navbar has {len(items)} default items")
            else:
                log_test("Verify navbar defaults restored", False, 
                        f"Expected >= 7 items, got {len(items)}")
                all_passed = False
        else:
            log_test("Verify navbar defaults restored", False, 
                    f"Expected 200, got {resp.status_code}")
            all_passed = False
        
    except Exception as e:
        log_test("Cleanup MongoDB", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}BACKEND API TESTING - STOCK ALERTS & NAVBAR{RESET}")
    print(f"{YELLOW}Base URL: {BASE_URL}{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    results = []
    
    # Run all tests
    results.append(("Stock Alerts - Email Validation", test_stock_alerts_public_validation()))
    results.append(("Stock Alerts - Unknown Slug", test_stock_alerts_unknown_slug()))
    results.append(("Stock Alerts - In Stock", test_stock_alerts_in_stock()))
    results.append(("Stock Alerts - Complete Flow", test_stock_alerts_out_of_stock_flow()))
    results.append(("Navbar Endpoints", test_navbar_endpoints()))
    results.append(("Pages Render", test_pages_render()))
    results.append(("Cleanup MongoDB", cleanup_mongodb()))
    
    # Summary
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST SUMMARY{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}✅ PASSED{RESET}" if result else f"{RED}❌ FAILED{RESET}"
        print(f"{status} - {name}")
    
    print(f"\n{YELLOW}{'='*80}{RESET}")
    if passed == total:
        print(f"{GREEN}🎉 ALL TESTS PASSED: {passed}/{total}{RESET}")
        print(f"{YELLOW}{'='*80}{RESET}")
        return 0
    else:
        print(f"{RED}❌ SOME TESTS FAILED: {passed}/{total} passed{RESET}")
        print(f"{YELLOW}{'='*80}{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
