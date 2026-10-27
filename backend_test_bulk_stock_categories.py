#!/usr/bin/env python3
"""
Backend API Testing Script for Bulk Products, Stock Alerts, and Categories
Tests:
1. POST /api/admin/products/bulk - Bulk product updates
2. GET /api/stock-alerts - Stock alerts public endpoint
3. GET /api/site-pages/categories and PATCH /api/admin/site-pages/categories
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

def record_product_overrides(db, slugs):
    """Record current state of product_overrides for given slugs"""
    recorded = {}
    for slug in slugs:
        doc = db.product_overrides.find_one({'slug': slug})
        recorded[slug] = doc
    return recorded

def restore_product_overrides(db, recorded):
    """Restore product_overrides to recorded state"""
    for slug, doc in recorded.items():
        if doc is None:
            # Document didn't exist, delete it
            db.product_overrides.delete_one({'slug': slug})
        else:
            # Restore the document
            db.product_overrides.replace_one({'slug': slug}, doc, upsert=True)

def test_bulk_products():
    """Test 1: POST /api/admin/products/bulk"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 1: POST /api/admin/products/bulk{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    db = get_mongo_db()
    if db is None:
        return False
    
    # STEP 1: Record current state
    print(f"\n{BLUE}Step 1: Recording current state of product_overrides{RESET}")
    slugs = ['coussin-noyau', 'plaid-sylvestre']
    recorded_state = record_product_overrides(db, slugs)
    
    for slug, doc in recorded_state.items():
        if doc:
            print(f"  {slug}: EXISTS with data={doc.get('data', {})}")
        else:
            print(f"  {slug}: DOES NOT EXIST")
    
    all_passed = True
    
    # STEP 2: Test without admin cookie (should return 401)
    print(f"\n{BLUE}Step 2: POST /api/admin/products/bulk without admin cookie{RESET}")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/admin/products/bulk",
            json={'slugs': ['coussin-noyau'], 'set': {'isNew': True}},
            timeout=10
        )
        
        if resp.status_code == 401:
            log_test("POST /api/admin/products/bulk (no auth)", True, "Correctly returns 401 without admin cookie")
        else:
            log_test("POST /api/admin/products/bulk (no auth)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("POST /api/admin/products/bulk (no auth)", False, f"Exception: {e}")
        all_passed = False
    
    # Login as admin
    session = admin_login()
    if not session:
        return False
    
    # STEP 3: Get original product data before bulk update
    print(f"\n{BLUE}Step 3: Getting original product data{RESET}")
    try:
        resp = session.get(f"{BASE_URL}/api/admin/products", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/admin/products", False, f"Expected 200, got {resp.status_code}")
            return False
        
        products_data = resp.json()
        all_products = products_data.get('products', [])
        
        original_products = {}
        for slug in slugs:
            p = next((x for x in all_products if x.get('slug') == slug), None)
            if p:
                original_products[slug] = {
                    'name': p.get('name'),
                    'price': p.get('price'),
                    'variants': p.get('variants'),
                    'isNew': p.get('isNew', False)
                }
                print(f"  {slug}: name={p.get('name')}, price={p.get('price')}, isNew={p.get('isNew', False)}")
            else:
                print(f"  {slug}: NOT FOUND in products")
        
    except Exception as e:
        log_test("GET /api/admin/products", False, f"Exception: {e}")
        return False
    
    # STEP 4: Bulk update with isNew=true
    print(f"\n{BLUE}Step 4: POST /api/admin/products/bulk with isNew=true{RESET}")
    try:
        resp = session.post(
            f"{BASE_URL}/api/admin/products/bulk",
            json={'slugs': slugs, 'set': {'isNew': True}},
            timeout=10
        )
        
        if resp.status_code != 200:
            log_test("POST /api/admin/products/bulk (isNew=true)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') == True and data.get('updated') == 2:
                log_test("POST /api/admin/products/bulk (isNew=true)", True, 
                        f"Successfully updated 2 products: {data}")
            else:
                log_test("POST /api/admin/products/bulk (isNew=true)", False, 
                        f"Expected ok=true and updated=2, got: {data}")
                all_passed = False
    except Exception as e:
        log_test("POST /api/admin/products/bulk (isNew=true)", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 5: Verify products appear in nouveautes category
    print(f"\n{BLUE}Step 5: GET /api/products?cat=nouveautes{RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/api/products?cat=nouveautes", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/products?cat=nouveautes", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            products = data.get('products', [])
            product_slugs = [p.get('slug') for p in products]
            
            if 'coussin-noyau' in product_slugs and 'plaid-sylvestre' in product_slugs:
                log_test("GET /api/products?cat=nouveautes", True, 
                        f"Both products found in nouveautes (total={len(products)})")
            else:
                log_test("GET /api/products?cat=nouveautes", False, 
                        f"Products not found in nouveautes. Found slugs: {product_slugs}")
                all_passed = False
    except Exception as e:
        log_test("GET /api/products?cat=nouveautes", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 6: Verify other fields unchanged
    print(f"\n{BLUE}Step 6: GET /api/admin/products - verify other fields unchanged{RESET}")
    try:
        resp = session.get(f"{BASE_URL}/api/admin/products", timeout=10)
        if resp.status_code != 200:
            log_test("GET /api/admin/products (verify unchanged)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            products_data = resp.json()
            all_products = products_data.get('products', [])
            
            fields_unchanged = True
            for slug in slugs:
                p = next((x for x in all_products if x.get('slug') == slug), None)
                if p:
                    orig = original_products.get(slug, {})
                    if (p.get('name') == orig.get('name') and 
                        p.get('price') == orig.get('price') and
                        p.get('variants') == orig.get('variants') and
                        p.get('isNew') == True):
                        print(f"  {slug}: ✓ isNew=true, other fields unchanged")
                    else:
                        print(f"  {slug}: ✗ Fields changed unexpectedly")
                        print(f"    Original: name={orig.get('name')}, price={orig.get('price')}")
                        print(f"    Current:  name={p.get('name')}, price={p.get('price')}, isNew={p.get('isNew')}")
                        fields_unchanged = False
            
            if fields_unchanged:
                log_test("Verify other fields unchanged", True, "isNew=true, other fields (price, variants, name) unchanged")
            else:
                log_test("Verify other fields unchanged", False, "Some fields changed unexpectedly")
                all_passed = False
    except Exception as e:
        log_test("GET /api/admin/products (verify unchanged)", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 7: Bulk update with isNew=false (remove from nouveautes)
    print(f"\n{BLUE}Step 7: POST /api/admin/products/bulk with isNew=false{RESET}")
    try:
        resp = session.post(
            f"{BASE_URL}/api/admin/products/bulk",
            json={'slugs': slugs, 'set': {'isNew': False}},
            timeout=10
        )
        
        if resp.status_code != 200:
            log_test("POST /api/admin/products/bulk (isNew=false)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') == True and data.get('updated') == 2:
                log_test("POST /api/admin/products/bulk (isNew=false)", True, 
                        f"Successfully updated 2 products: {data}")
                
                # Verify removed from nouveautes
                resp2 = requests.get(f"{BASE_URL}/api/products?cat=nouveautes", timeout=10)
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    products = data2.get('products', [])
                    product_slugs = [p.get('slug') for p in products]
                    
                    if 'coussin-noyau' not in product_slugs and 'plaid-sylvestre' not in product_slugs:
                        log_test("Verify removed from nouveautes", True, 
                                "Products no longer in nouveautes category")
                    else:
                        log_test("Verify removed from nouveautes", False, 
                                f"Products still in nouveautes: {product_slugs}")
                        all_passed = False
            else:
                log_test("POST /api/admin/products/bulk (isNew=false)", False, 
                        f"Expected ok=true and updated=2, got: {data}")
                all_passed = False
    except Exception as e:
        log_test("POST /api/admin/products/bulk (isNew=false)", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 8: Test validation - empty slugs array
    print(f"\n{BLUE}Step 8: POST /api/admin/products/bulk with empty slugs{RESET}")
    try:
        resp = session.post(
            f"{BASE_URL}/api/admin/products/bulk",
            json={'slugs': [], 'set': {'isNew': True}},
            timeout=10
        )
        
        if resp.status_code == 400:
            log_test("POST /api/admin/products/bulk (empty slugs)", True, 
                    f"Correctly returns 400 for empty slugs: {resp.json()}")
        else:
            log_test("POST /api/admin/products/bulk (empty slugs)", False, 
                    f"Expected 400, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("POST /api/admin/products/bulk (empty slugs)", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 9: Test validation - disallowed field (price)
    print(f"\n{BLUE}Step 9: POST /api/admin/products/bulk with disallowed field (price){RESET}")
    try:
        resp = session.post(
            f"{BASE_URL}/api/admin/products/bulk",
            json={'slugs': ['coussin-noyau'], 'set': {'price': 1}},
            timeout=10
        )
        
        if resp.status_code == 400:
            log_test("POST /api/admin/products/bulk (disallowed field)", True, 
                    f"Correctly returns 400 for disallowed field: {resp.json()}")
        else:
            log_test("POST /api/admin/products/bulk (disallowed field)", False, 
                    f"Expected 400, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("POST /api/admin/products/bulk (disallowed field)", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 10: Test that existing override data is preserved
    print(f"\n{BLUE}Step 10: Test existing override data preservation{RESET}")
    try:
        # First, PATCH coussin-noyau with a custom price
        resp = session.get(f"{BASE_URL}/api/admin/products", timeout=10)
        if resp.status_code == 200:
            products_data = resp.json()
            all_products = products_data.get('products', [])
            coussin = next((x for x in all_products if x.get('slug') == 'coussin-noyau'), None)
            
            if coussin:
                # Create a full product object with modified price
                coussin_modified = {**coussin, 'price': 96}
                
                resp2 = session.patch(
                    f"{BASE_URL}/api/admin/products?slug=coussin-noyau",
                    json=coussin_modified,
                    timeout=10
                )
                
                if resp2.status_code == 200:
                    log_test("PATCH /api/admin/products?slug=coussin-noyau (price=96)", True, 
                            "Successfully set custom price to 96")
                    
                    # Now bulk update isNew=true
                    resp3 = session.post(
                        f"{BASE_URL}/api/admin/products/bulk",
                        json={'slugs': ['coussin-noyau'], 'set': {'isNew': True}},
                        timeout=10
                    )
                    
                    if resp3.status_code == 200:
                        # Verify price is still 96
                        resp4 = session.get(f"{BASE_URL}/api/admin/products", timeout=10)
                        if resp4.status_code == 200:
                            products_data2 = resp4.json()
                            all_products2 = products_data2.get('products', [])
                            coussin2 = next((x for x in all_products2 if x.get('slug') == 'coussin-noyau'), None)
                            
                            if coussin2 and coussin2.get('price') == 96 and coussin2.get('isNew') == True:
                                log_test("Verify override data preserved", True, 
                                        "Price still 96 after bulk isNew=true update")
                            else:
                                log_test("Verify override data preserved", False, 
                                        f"Price changed: {coussin2.get('price') if coussin2 else 'NOT FOUND'}")
                                all_passed = False
                        else:
                            log_test("Verify override data preserved", False, 
                                    f"GET failed: {resp4.status_code}")
                            all_passed = False
                    else:
                        log_test("Bulk update after PATCH", False, f"Expected 200, got {resp3.status_code}")
                        all_passed = False
                else:
                    log_test("PATCH /api/admin/products?slug=coussin-noyau", False, 
                            f"Expected 200, got {resp2.status_code}")
                    all_passed = False
            else:
                log_test("Find coussin-noyau", False, "Product not found")
                all_passed = False
        else:
            log_test("GET /api/admin/products", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("Test override data preservation", False, f"Exception: {e}")
        all_passed = False
    
    # STEP 11: RESTORE original state
    print(f"\n{BLUE}Step 11: RESTORE - Restoring product_overrides to original state{RESET}")
    try:
        restore_product_overrides(db, recorded_state)
        
        # Verify restoration
        for slug, original_doc in recorded_state.items():
            current_doc = db.product_overrides.find_one({'slug': slug})
            if original_doc is None and current_doc is None:
                print(f"  {slug}: ✓ Correctly deleted (did not exist originally)")
            elif original_doc and current_doc:
                print(f"  {slug}: ✓ Restored to original state")
            else:
                print(f"  {slug}: ✗ Restoration failed")
                all_passed = False
        
        log_test("RESTORE product_overrides", True, "Successfully restored to original state")
    except Exception as e:
        log_test("RESTORE product_overrides", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_stock_alerts():
    """Test 2: GET /api/stock-alerts"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 2: GET /api/stock-alerts{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    all_passed = True
    
    # Test with slug parameter
    print(f"\n{BLUE}Step 1: GET /api/stock-alerts?slug=plaid-sylvestre{RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/api/stock-alerts?slug=plaid-sylvestre", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/stock-alerts?slug=plaid-sylvestre", False, 
                    f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            
            # Check response structure
            if 'waiting' not in data:
                log_test("GET /api/stock-alerts?slug=plaid-sylvestre", False, 
                        "Missing 'waiting' key in response")
                all_passed = False
            elif isinstance(data.get('waiting'), int):
                # Verify no email addresses in response
                response_str = json.dumps(data)
                if '@' in response_str:
                    log_test("GET /api/stock-alerts?slug=plaid-sylvestre", False, 
                            "Response contains email addresses (security issue)")
                    all_passed = False
                else:
                    log_test("GET /api/stock-alerts?slug=plaid-sylvestre", True, 
                            f"Returns waiting count: {data.get('waiting')}, no emails exposed")
            else:
                log_test("GET /api/stock-alerts?slug=plaid-sylvestre", False, 
                        f"'waiting' is not an integer: {data.get('waiting')}")
                all_passed = False
    except Exception as e:
        log_test("GET /api/stock-alerts?slug=plaid-sylvestre", False, f"Exception: {e}")
        all_passed = False
    
    # Test without slug parameter (should return 400)
    print(f"\n{BLUE}Step 2: GET /api/stock-alerts (without slug){RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/api/stock-alerts", timeout=10)
        
        if resp.status_code == 400:
            data = resp.json()
            log_test("GET /api/stock-alerts (no slug)", True, 
                    f"Correctly returns 400: {data.get('error', '')}")
        else:
            log_test("GET /api/stock-alerts (no slug)", False, 
                    f"Expected 400, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("GET /api/stock-alerts (no slug)", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def test_site_pages_categories():
    """Test 3: GET /api/site-pages/categories and PATCH /api/admin/site-pages/categories"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST 3: GET /api/site-pages/categories and PATCH{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    all_passed = True
    
    # Test GET /api/site-pages/categories
    print(f"\n{BLUE}Step 1: GET /api/site-pages/categories{RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/api/site-pages/categories", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/site-pages/categories", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            categories = data.get('categories', [])
            
            if len(categories) != 4:
                log_test("GET /api/site-pages/categories", False, 
                        f"Expected 4 categories, got {len(categories)}")
                all_passed = False
            else:
                # Find editions-limitees category
                editions = next((c for c in categories if c.get('slug') == 'editions-limitees'), None)
                
                if not editions:
                    log_test("GET /api/site-pages/categories", False, 
                            "editions-limitees category not found")
                    all_passed = False
                else:
                    expected_name = 'Éditions limitées'
                    expected_tagline = 'Numérotées, jamais reproduites'
                    expected_eyebrow = 'Produits'
                    
                    if (editions.get('name') == expected_name and
                        editions.get('tagline') == expected_tagline and
                        editions.get('eyebrow') == expected_eyebrow):
                        log_test("GET /api/site-pages/categories", True, 
                                f"4 categories found, editions-limitees has correct defaults:\n"
                                f"    name='{expected_name}'\n"
                                f"    tagline='{expected_tagline}'\n"
                                f"    eyebrow='{expected_eyebrow}'")
                    else:
                        log_test("GET /api/site-pages/categories", False, 
                                f"editions-limitees has incorrect values:\n"
                                f"    name='{editions.get('name')}' (expected '{expected_name}')\n"
                                f"    tagline='{editions.get('tagline')}' (expected '{expected_tagline}')\n"
                                f"    eyebrow='{editions.get('eyebrow')}' (expected '{expected_eyebrow}')")
                        all_passed = False
    except Exception as e:
        log_test("GET /api/site-pages/categories", False, f"Exception: {e}")
        all_passed = False
    
    # Test PATCH without admin cookie (should return 401)
    print(f"\n{BLUE}Step 2: PATCH /api/admin/site-pages/categories (without auth){RESET}")
    try:
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-pages/categories",
            json={'items': {'editions-limitees': {'name': 'Test'}}},
            timeout=10
        )
        
        if resp.status_code == 401:
            log_test("PATCH /api/admin/site-pages/categories (no auth)", True, 
                    "Correctly returns 401 without admin cookie")
        else:
            log_test("PATCH /api/admin/site-pages/categories (no auth)", False, 
                    f"Expected 401, got {resp.status_code}")
            all_passed = False
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/categories (no auth)", False, f"Exception: {e}")
        all_passed = False
    
    # Login as admin
    session = admin_login()
    if not session:
        return False
    
    # Test PATCH with admin cookie
    print(f"\n{BLUE}Step 3: PATCH /api/admin/site-pages/categories (with auth){RESET}")
    try:
        patch_data = {
            'items': {
                'editions-limitees': {
                    'name': 'Pièces uniques',
                    'tagline': 'Test',
                    'eyebrow': 'Atelier'
                }
            }
        }
        
        resp = session.patch(
            f"{BASE_URL}/api/admin/site-pages/categories",
            json=patch_data,
            timeout=10
        )
        
        if resp.status_code != 200:
            log_test("PATCH /api/admin/site-pages/categories (with auth)", False, 
                    f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if data.get('ok') != True:
                log_test("PATCH /api/admin/site-pages/categories (with auth)", False, 
                        f"Response ok != true: {data}")
                all_passed = False
            else:
                log_test("PATCH /api/admin/site-pages/categories (with auth)", True, 
                        "Successfully updated categories")
    except Exception as e:
        log_test("PATCH /api/admin/site-pages/categories (with auth)", False, f"Exception: {e}")
        all_passed = False
    
    # Verify the changes
    print(f"\n{BLUE}Step 4: GET /api/site-pages/categories (verify changes){RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/api/site-pages/categories", timeout=10)
        
        if resp.status_code != 200:
            log_test("GET /api/site-pages/categories (verify)", False, 
                    f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            categories = data.get('categories', [])
            editions = next((c for c in categories if c.get('slug') == 'editions-limitees'), None)
            
            if not editions:
                log_test("GET /api/site-pages/categories (verify)", False, 
                        "editions-limitees category not found")
                all_passed = False
            else:
                if (editions.get('name') == 'Pièces uniques' and
                    editions.get('tagline') == 'Test' and
                    editions.get('eyebrow') == 'Atelier'):
                    log_test("GET /api/site-pages/categories (verify)", True, 
                            "Changes reflected correctly:\n"
                            f"    name='Pièces uniques'\n"
                            f"    tagline='Test'\n"
                            f"    eyebrow='Atelier'")
                else:
                    log_test("GET /api/site-pages/categories (verify)", False, 
                            f"Changes not reflected:\n"
                            f"    name='{editions.get('name')}'\n"
                            f"    tagline='{editions.get('tagline')}'\n"
                            f"    eyebrow='{editions.get('eyebrow')}'")
                    all_passed = False
    except Exception as e:
        log_test("GET /api/site-pages/categories (verify)", False, f"Exception: {e}")
        all_passed = False
    
    # RESTORE: Delete site_pages doc _id 'categories'
    print(f"\n{BLUE}Step 5: RESTORE - Delete site_pages doc _id 'categories'{RESET}")
    try:
        db = get_mongo_db()
        if db is None:
            log_test("RESTORE categories", False, "MongoDB connection failed")
            all_passed = False
        else:
            result = db.site_pages.delete_one({'_id': 'categories'})
            log_test("Delete site_pages doc 'categories'", True, 
                    f"Deleted {result.deleted_count} document(s)")
            
            # Verify defaults are restored
            resp = requests.get(f"{BASE_URL}/api/site-pages/categories", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                categories = data.get('categories', [])
                editions = next((c for c in categories if c.get('slug') == 'editions-limitees'), None)
                
                if editions:
                    expected_name = 'Éditions limitées'
                    expected_tagline = 'Numérotées, jamais reproduites'
                    expected_eyebrow = 'Produits'
                    
                    if (editions.get('name') == expected_name and
                        editions.get('tagline') == expected_tagline and
                        editions.get('eyebrow') == expected_eyebrow):
                        log_test("Verify defaults restored", True, 
                                "Defaults correctly restored after deletion")
                    else:
                        log_test("Verify defaults restored", False, 
                                f"Defaults not restored:\n"
                                f"    name='{editions.get('name')}' (expected '{expected_name}')\n"
                                f"    tagline='{editions.get('tagline')}' (expected '{expected_tagline}')\n"
                                f"    eyebrow='{editions.get('eyebrow')}' (expected '{expected_eyebrow}')")
                        all_passed = False
                else:
                    log_test("Verify defaults restored", False, 
                            "editions-limitees category not found after restoration")
                    all_passed = False
            else:
                log_test("Verify defaults restored", False, 
                        f"GET failed: {resp.status_code}")
                all_passed = False
    except Exception as e:
        log_test("RESTORE categories", False, f"Exception: {e}")
        all_passed = False
    
    return all_passed

def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}BACKEND API TESTING - BULK PRODUCTS, STOCK ALERTS, CATEGORIES{RESET}")
    print(f"{YELLOW}Base URL: {BASE_URL}{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    
    results = []
    
    # Run all tests
    results.append(("Bulk Products Update", test_bulk_products()))
    results.append(("Stock Alerts", test_stock_alerts()))
    results.append(("Site Pages Categories", test_site_pages_categories()))
    
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
