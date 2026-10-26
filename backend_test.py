#!/usr/bin/env python3
"""
Backend API Testing Script for Site Pages & Order Tracking
Tests new endpoints: /api/site-pages/* and /api/orders/track
"""

import requests
import json
import sys
from pymongo import MongoClient
import os

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
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

def test_site_pages_footer():
    """Test 1: GET /api/site-pages/footer"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 1: GET /api/site-pages/footer{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    try:
        resp = requests.get(f"{BASE_URL}/api/site-pages/footer", timeout=10)
        
        if resp.status_code != 200:
            return log_test("GET /api/site-pages/footer", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check structure
        if 'footer' not in data:
            return log_test("GET /api/site-pages/footer", False, "Missing 'footer' key in response")
        
        footer = data['footer']
        required_keys = ['tagline', 'email', 'instagram', 'facebook', 'copyright', 'bottomNote', 'clientLinks']
        missing_keys = [k for k in required_keys if k not in footer]
        
        if missing_keys:
            return log_test("GET /api/site-pages/footer", False, f"Missing keys in footer: {missing_keys}")
        
        # Check clientLinks structure
        client_links = footer['clientLinks']
        required_link_keys = ['cgv', 'livraison', 'suivi', 'confidentialite']
        missing_link_keys = [k for k in required_link_keys if k not in client_links]
        
        if missing_link_keys:
            return log_test("GET /api/site-pages/footer", False, f"Missing keys in clientLinks: {missing_link_keys}")
        
        # Verify each link has label and show
        for link_key in required_link_keys:
            link = client_links[link_key]
            if 'label' not in link or 'show' not in link:
                return log_test("GET /api/site-pages/footer", False, f"Link {link_key} missing 'label' or 'show'")
        
        return log_test("GET /api/site-pages/footer", True, 
                       f"Footer structure correct with all required fields")
        
    except Exception as e:
        return log_test("GET /api/site-pages/footer", False, f"Exception: {e}")

def test_site_pages_legal():
    """Test 2: GET /api/site-pages/{cgv,livraison,suivi,confidentialite}"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 2: GET /api/site-pages/{{cgv,livraison,suivi,confidentialite}}{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    slugs = ['cgv', 'livraison', 'suivi', 'confidentialite']
    all_passed = True
    
    for slug in slugs:
        try:
            resp = requests.get(f"{BASE_URL}/api/site-pages/{slug}", timeout=10)
            
            if resp.status_code != 200:
                log_test(f"GET /api/site-pages/{slug}", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
                continue
            
            data = resp.json()
            
            if 'page' not in data:
                log_test(f"GET /api/site-pages/{slug}", False, "Missing 'page' key in response")
                all_passed = False
                continue
            
            page = data['page']
            
            # Check required fields
            if 'title' not in page or 'sections' not in page:
                log_test(f"GET /api/site-pages/{slug}", False, "Missing 'title' or 'sections' in page")
                all_passed = False
                continue
            
            # Verify sections is an array
            if not isinstance(page['sections'], list):
                log_test(f"GET /api/site-pages/{slug}", False, "sections is not an array")
                all_passed = False
                continue
            
            log_test(f"GET /api/site-pages/{slug}", True, 
                    f"Page has title='{page['title'][:50]}...' and {len(page['sections'])} sections")
            
        except Exception as e:
            log_test(f"GET /api/site-pages/{slug}", False, f"Exception: {e}")
            all_passed = False
    
    return all_passed

def test_site_pages_404():
    """Test 3: GET /api/site-pages/nope → 404"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 3: GET /api/site-pages/nope (should return 404){RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    try:
        resp = requests.get(f"{BASE_URL}/api/site-pages/nope", timeout=10)
        
        if resp.status_code == 404:
            return log_test("GET /api/site-pages/nope", True, "Correctly returns 404 for unknown page")
        else:
            return log_test("GET /api/site-pages/nope", False, f"Expected 404, got {resp.status_code}")
        
    except Exception as e:
        return log_test("GET /api/site-pages/nope", False, f"Exception: {e}")

def test_admin_site_pages_auth():
    """Test 4: GET /api/admin/site-pages without/with cookie"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 4: GET /api/admin/site-pages (auth check){RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    # Test without auth
    try:
        resp = requests.get(f"{BASE_URL}/api/admin/site-pages", timeout=10)
        
        if resp.status_code != 401:
            log_test("GET /api/admin/site-pages (no auth)", False, f"Expected 401, got {resp.status_code}")
            return False
        
        log_test("GET /api/admin/site-pages (no auth)", True, "Correctly returns 401 without admin cookie")
        
    except Exception as e:
        log_test("GET /api/admin/site-pages (no auth)", False, f"Exception: {e}")
        return False
    
    # Test with auth
    session = admin_login()
    if not session:
        return False
    
    try:
        resp = session.get(f"{BASE_URL}/api/admin/site-pages", timeout=10)
        
        if resp.status_code != 200:
            return log_test("GET /api/admin/site-pages (with auth)", False, f"Expected 200, got {resp.status_code}")
        
        data = resp.json()
        
        # Check structure
        if 'pages' not in data or 'footer' not in data:
            return log_test("GET /api/admin/site-pages (with auth)", False, "Missing 'pages' or 'footer' in response")
        
        pages = data['pages']
        required_pages = ['cgv', 'livraison', 'suivi', 'confidentialite']
        missing_pages = [p for p in required_pages if p not in pages]
        
        if missing_pages:
            return log_test("GET /api/admin/site-pages (with auth)", False, f"Missing pages: {missing_pages}")
        
        return log_test("GET /api/admin/site-pages (with auth)", True, 
                       f"Returns pages + footer correctly (pages: {list(pages.keys())})")
        
    except Exception as e:
        return log_test("GET /api/admin/site-pages (with auth)", False, f"Exception: {e}")

def test_patch_site_pages():
    """Test 5: PATCH /api/admin/site-pages/cgv and /footer"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 5: PATCH /api/admin/site-pages/cgv and /footer{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    session = admin_login()
    if not session:
        return False
    
    all_passed = True
    
    # Test PATCH cgv
    try:
        cgv_data = {
            'title': 'CGV test',
            'intro': 'x',
            'sections': [
                {'title': 'A', 'text': '- un\n- deux'}
            ]
        }
        
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/cgv", json=cgv_data, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH /api/admin/site-pages/cgv", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') != True:
                log_test("PATCH /api/admin/site-pages/cgv", False, f"Response ok != true: {data}")
                all_passed = False
            else:
                log_test("PATCH /api/admin/site-pages/cgv", True, "Successfully updated CGV")
                
                # Verify the change
                resp2 = requests.get(f"{BASE_URL}/api/site-pages/cgv", timeout=10)
                if resp2.status_code == 200:
                    page_data = resp2.json()
                    page = page_data.get('page', {})
                    
                    if page.get('title') == 'CGV test' and page.get('intro') == 'x':
                        log_test("GET /api/site-pages/cgv (verify update)", True, 
                                f"Title and intro updated correctly, updatedAt: {page.get('updatedAt')}")
                    else:
                        log_test("GET /api/site-pages/cgv (verify update)", False, 
                                f"Title or intro not updated: title={page.get('title')}, intro={page.get('intro')}")
                        all_passed = False
                    
                    # Check HTML page contains the new title
                    resp3 = requests.get(f"{BASE_URL}/cgv", timeout=10)
                    if resp3.status_code == 200:
                        html = resp3.text
                        if 'CGV test' in html:
                            log_test("GET /cgv HTML (verify update)", True, "HTML contains 'CGV test'")
                        else:
                            log_test("GET /cgv HTML (verify update)", False, "HTML does not contain 'CGV test'")
                            all_passed = False
                    else:
                        log_test("GET /cgv HTML", False, f"Expected 200, got {resp3.status_code}")
                        all_passed = False
                else:
                    log_test("GET /api/site-pages/cgv (verify update)", False, f"Expected 200, got {resp2.status_code}")
                    all_passed = False
        
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/cgv", False, f"Exception: {e}")
        all_passed = False
    
    # Test PATCH footer
    try:
        footer_data = {
            'clientLinks': {
                'cgv': {'label': 'Conditions', 'show': False}
            },
            'tagline': 'T'
        }
        
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/footer", json=footer_data, timeout=10)
        
        if resp.status_code != 200:
            log_test("PATCH /api/admin/site-pages/footer", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') != True:
                log_test("PATCH /api/admin/site-pages/footer", False, f"Response ok != true: {data}")
                all_passed = False
            else:
                log_test("PATCH /api/admin/site-pages/footer", True, "Successfully updated footer")
                
                # Verify the change
                resp2 = requests.get(f"{BASE_URL}/api/site-pages/footer", timeout=10)
                if resp2.status_code == 200:
                    footer_resp = resp2.json()
                    footer = footer_resp.get('footer', {})
                    
                    cgv_link = footer.get('clientLinks', {}).get('cgv', {})
                    
                    if cgv_link.get('label') == 'Conditions' and cgv_link.get('show') == False:
                        log_test("GET /api/site-pages/footer (verify update)", True, 
                                f"Footer updated: cgv.label='Conditions', cgv.show=False, tagline='{footer.get('tagline')}'")
                    else:
                        log_test("GET /api/site-pages/footer (verify update)", False, 
                                f"Footer not updated correctly: cgv={cgv_link}")
                        all_passed = False
                else:
                    log_test("GET /api/site-pages/footer (verify update)", False, f"Expected 200, got {resp2.status_code}")
                    all_passed = False
        
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/footer", False, f"Exception: {e}")
        all_passed = False
    
    # Test PATCH unknown slug
    try:
        resp = session.patch(f"{BASE_URL}/api/admin/site-pages/unknown-slug", json={'title': 'test'}, timeout=10)
        
        if resp.status_code == 400:
            log_test("PATCH /api/admin/site-pages/unknown-slug", True, "Correctly returns 400 for unknown slug")
        else:
            log_test("PATCH /api/admin/site-pages/unknown-slug", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/unknown-slug", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_orders_track():
    """Test 6: GET /api/orders/track"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 6: GET /api/orders/track{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    all_passed = True
    
    # Test missing params
    try:
        resp = requests.get(f"{BASE_URL}/api/orders/track", timeout=10)
        
        if resp.status_code == 400:
            log_test("GET /api/orders/track (missing params)", True, "Correctly returns 400 for missing params")
        else:
            log_test("GET /api/orders/track (missing params)", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        
    except Exception as e:
        log_test("GET /api/orders/track (missing params)", False, f"Exception: {e}")
        all_passed = False
    
    # Test wrong email
    try:
        resp = requests.get(f"{BASE_URL}/api/orders/track?number=GIN-123&email=wrong@example.com", timeout=10)
        
        if resp.status_code == 404:
            log_test("GET /api/orders/track (wrong email)", True, "Correctly returns 404 for wrong email")
        else:
            log_test("GET /api/orders/track (wrong email)", False, f"Expected 404, got {resp.status_code}")
            all_passed = False
        
    except Exception as e:
        log_test("GET /api/orders/track (wrong email)", False, f"Exception: {e}")
        all_passed = False
    
    # Test with correct order (need to find an existing order first)
    session = admin_login()
    if session:
        try:
            # Get an existing order
            resp = session.get(f"{BASE_URL}/api/admin/orders", timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                orders = data.get('orders', [])
                
                if orders:
                    # Find an order with an email address
                    test_order = None
                    for order in orders:
                        if order.get('address', {}).get('email'):
                            test_order = order
                            break
                    
                    if test_order:
                        order_number = test_order.get('orderNumber')
                        email = test_order.get('address', {}).get('email')
                        
                        # Test with correct params (case insensitive)
                        # Use lowercase order number and uppercase email variant
                        resp2 = requests.get(
                            f"{BASE_URL}/api/orders/track?number={order_number.lower()}&email={email.upper()}", 
                            timeout=10
                        )
                        
                        if resp2.status_code == 200:
                            track_data = resp2.json()
                            order_info = track_data.get('order', {})
                            
                            # Verify response structure
                            required_keys = ['orderNumber', 'status', 'trackingNumber', 'itemsCount']
                            missing_keys = [k for k in required_keys if k not in order_info]
                            
                            # Verify NO sensitive data
                            forbidden_keys = ['address', 'items']
                            present_forbidden = [k for k in forbidden_keys if k in order_info]
                            
                            if missing_keys:
                                log_test("GET /api/orders/track (correct params)", False, 
                                        f"Missing keys: {missing_keys}")
                                all_passed = False
                            elif present_forbidden:
                                log_test("GET /api/orders/track (correct params)", False, 
                                        f"Sensitive data exposed: {present_forbidden}")
                                all_passed = False
                            else:
                                log_test("GET /api/orders/track (correct params)", True, 
                                        f"Returns order info correctly (status={order_info.get('status')}, "
                                        f"itemsCount={order_info.get('itemsCount')}, NO sensitive data)")
                        else:
                            log_test("GET /api/orders/track (correct params)", False, 
                                    f"Expected 200, got {resp2.status_code}")
                            all_passed = False
                    else:
                        log_test("GET /api/orders/track (correct params)", False, 
                                "No orders with email address found for testing")
                        all_passed = False
                else:
                    log_test("GET /api/orders/track (correct params)", False, 
                            "No orders found in database for testing")
                    all_passed = False
            else:
                log_test("GET /api/admin/orders", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
            
        except Exception as e:
            log_test("GET /api/orders/track (correct params)", False, f"Exception: {e}")
            all_passed = False
    else:
        log_test("GET /api/orders/track (correct params)", False, "Admin login failed")
        all_passed = False
    
    return all_passed

def test_legal_pages_html():
    """Test 7: Pages /cgv /livraison /suivi /confidentialite return 200"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 7: HTML Pages /cgv /livraison /suivi /confidentialite{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    pages = ['/cgv', '/livraison', '/suivi', '/confidentialite']
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

def cleanup_test_data():
    """Test 8: Cleanup - Delete test documents from MongoDB"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 8: CLEANUP - Restore defaults by deleting test documents{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    try:
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.getenv('DB_NAME', 'ginette_creations')
        
        client = MongoClient(mongo_url)
        db = client[db_name]
        
        # Delete cgv and footer documents
        result_cgv = db.site_pages.delete_one({'_id': 'cgv'})
        result_footer = db.site_pages.delete_one({'_id': 'footer'})
        
        log_test("Delete site_pages documents", True, 
                f"Deleted cgv (count={result_cgv.deleted_count}) and footer (count={result_footer.deleted_count})")
        
        # Verify defaults are restored
        resp = requests.get(f"{BASE_URL}/api/site-pages/cgv", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            page = data.get('page', {})
            
            if page.get('title') == 'Conditions générales de vente':
                log_test("Verify CGV defaults restored", True, 
                        "CGV title is back to 'Conditions générales de vente'")
                return True
            else:
                log_test("Verify CGV defaults restored", False, 
                        f"CGV title is '{page.get('title')}', expected 'Conditions générales de vente'")
                return False
        else:
            log_test("Verify CGV defaults restored", False, f"Expected 200, got {resp.status_code}")
            return False
        
    except Exception as e:
        log_test("Cleanup test data", False, f"Exception: {e}")
        return False

def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}BACKEND API TESTING - SITE PAGES & ORDER TRACKING{RESET}")
    print(f"{YELLOW}Base URL: {BASE_URL}{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    results = []
    
    # Run all tests
    results.append(("Site Pages Footer", test_site_pages_footer()))
    results.append(("Site Pages Legal", test_site_pages_legal()))
    results.append(("Site Pages 404", test_site_pages_404()))
    results.append(("Admin Site Pages Auth", test_admin_site_pages_auth()))
    results.append(("PATCH Site Pages", test_patch_site_pages()))
    results.append(("Orders Track", test_orders_track()))
    results.append(("Legal Pages HTML", test_legal_pages_html()))
    results.append(("Cleanup", cleanup_test_data()))
    
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
