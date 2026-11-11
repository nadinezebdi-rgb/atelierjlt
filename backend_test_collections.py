#!/usr/bin/env python3
"""
Backend test for restored collections feature (Printemps/Été 2027 + Les Intemporels)
Tests category filters, redirects, navbar API, and admin product assignment.
"""

import requests
import json
import sys
from pymongo import MongoClient
import os

BASE_URL = "https://french-craft.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"
ADMIN_PASSWORD = "Juliette99*"

def print_test(name, passed, details=""):
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"{status}: {name}")
    if details:
        print(f"  {details}")
    return passed

def test_category_filters():
    """Test 1: Category filters - intemporels, pe-2026-2027, nouveautes, editions-limitees, racine"""
    print("\n" + "="*80)
    print("TEST 1: Category Filters")
    print("="*80)
    
    all_passed = True
    
    # Test 1a: GET /api/products?cat=intemporels → only products with category 'intemporels'
    try:
        r = requests.get(f"{API_URL}/products?cat=intemporels")
        data = r.json()
        
        products = data.get("products", [])
        all_intemporels = all(p.get("category") == "intemporels" for p in products)
        
        passed = (
            r.status_code == 200 and
            len(products) >= 10 and  # Expected ~11 in preview
            all_intemporels
        )
        
        all_passed &= print_test(
            "GET /api/products?cat=intemporels returns only intemporels products",
            passed,
            f"Status: {r.status_code}, Count: {len(products)}, All intemporels: {all_intemporels}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products?cat=intemporels", False, f"Error: {e}")
    
    # Test 1b: GET /api/products?cat=pe-2026-2027 → only category 'pe-2026-2027', must NOT contain intemporels
    try:
        r = requests.get(f"{API_URL}/products?cat=pe-2026-2027")
        data = r.json()
        
        products = data.get("products", [])
        all_pe = all(p.get("category") == "pe-2026-2027" for p in products)
        no_intemporels = not any(p.get("category") == "intemporels" for p in products)
        
        passed = (
            r.status_code == 200 and
            all_pe and
            no_intemporels
        )
        
        all_passed &= print_test(
            "GET /api/products?cat=pe-2026-2027 returns only PE products, NO intemporels",
            passed,
            f"Status: {r.status_code}, Count: {len(products)}, All PE: {all_pe}, No intemporels: {no_intemporels}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products?cat=pe-2026-2027", False, f"Error: {e}")
    
    # Test 1c: ?cat=nouveautes still filters by isNew
    try:
        r = requests.get(f"{API_URL}/products?cat=nouveautes")
        data = r.json()
        
        products = data.get("products", [])
        all_new = all(p.get("isNew") == True for p in products)
        
        passed = (
            r.status_code == 200 and
            len(products) > 0 and
            all_new
        )
        
        all_passed &= print_test(
            "GET /api/products?cat=nouveautes filters by isNew=true",
            passed,
            f"Status: {r.status_code}, Count: {len(products)}, All isNew: {all_new}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products?cat=nouveautes", False, f"Error: {e}")
    
    # Test 1d: ?cat=editions-limitees still filters by isLimited
    try:
        r = requests.get(f"{API_URL}/products?cat=editions-limitees")
        data = r.json()
        
        products = data.get("products", [])
        all_limited = all(p.get("isLimited") == True for p in products)
        
        passed = (
            r.status_code == 200 and
            len(products) > 0 and
            all_limited
        )
        
        all_passed &= print_test(
            "GET /api/products?cat=editions-limitees filters by isLimited=true",
            passed,
            f"Status: {r.status_code}, Count: {len(products)}, All isLimited: {all_limited}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products?cat=editions-limitees", False, f"Error: {e}")
    
    # Test 1e: ?cat=racine normalizes to intemporels
    try:
        r = requests.get(f"{API_URL}/products?cat=racine")
        data = r.json()
        
        products = data.get("products", [])
        all_intemporels = all(p.get("category") == "intemporels" for p in products)
        
        passed = (
            r.status_code == 200 and
            len(products) >= 10 and
            all_intemporels
        )
        
        all_passed &= print_test(
            "GET /api/products?cat=racine normalizes to intemporels",
            passed,
            f"Status: {r.status_code}, Count: {len(products)}, All intemporels: {all_intemporels}"
        )
    except Exception as e:
        all_passed &= print_test("GET /api/products?cat=racine", False, f"Error: {e}")
    
    return all_passed

def test_admin_product_assignment():
    """Test 2: Assign a product to PE via admin PATCH, verify it appears in PE filter and HTML page"""
    print("\n" + "="*80)
    print("TEST 2: Admin Product Assignment to PE Collection")
    print("="*80)
    
    # Login as admin
    session = requests.Session()
    try:
        r = session.post(f"{API_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        if r.status_code != 200:
            return print_test("Admin login", False, f"Failed to login: {r.status_code}")
    except Exception as e:
        return print_test("Admin login", False, f"Error: {e}")
    
    all_passed = True
    test_slug = None
    original_category = None
    
    # Test 2a: Get a product from intemporels to reassign
    try:
        r = requests.get(f"{API_URL}/products?cat=intemporels")
        data = r.json()
        products = data.get("products", [])
        
        if len(products) > 0:
            test_product = products[0]
            test_slug = test_product.get("slug")
            original_category = test_product.get("category")
            
            print(f"  Selected product for test: {test_product.get('name')} (slug: {test_slug})")
        else:
            return print_test("Get test product", False, "No intemporels products found")
    except Exception as e:
        return print_test("Get test product", False, f"Error: {e}")
    
    # Test 2b: PATCH /api/admin/products?slug=<slug> with category:'pe-2026-2027'
    try:
        r = session.patch(
            f"{API_URL}/admin/products?slug={test_slug}",
            json={"category": "pe-2026-2027"}
        )
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") == True
        )
        
        all_passed &= print_test(
            f"PATCH /api/admin/products?slug={test_slug} with category:pe-2026-2027",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("PATCH admin product", False, f"Error: {e}")
        return all_passed
    
    # Test 2c: Verify product appears in /api/products?cat=pe-2026-2027
    try:
        r = requests.get(f"{API_URL}/products?cat=pe-2026-2027")
        data = r.json()
        
        products = data.get("products", [])
        product_in_pe = any(p.get("slug") == test_slug for p in products)
        
        passed = (
            r.status_code == 200 and
            product_in_pe
        )
        
        all_passed &= print_test(
            f"GET /api/products?cat=pe-2026-2027 returns the reassigned product",
            passed,
            f"Status: {r.status_code}, Product in PE: {product_in_pe}, Count: {len(products)}"
        )
    except Exception as e:
        all_passed &= print_test("Verify product in PE filter", False, f"Error: {e}")
    
    # Test 2d: Verify product appears in /collection/printemps-ete-2027 HTML
    try:
        r = requests.get(f"{BASE_URL}/collection/printemps-ete-2027")
        html = r.text
        
        # Get product name to check in HTML
        r_product = requests.get(f"{API_URL}/products/{test_slug}")
        product_data = r_product.json()
        product_name = product_data.get("product", {}).get("name", "")
        
        name_in_html = product_name in html if product_name else False
        
        passed = (
            r.status_code == 200 and
            name_in_html
        )
        
        all_passed &= print_test(
            f"GET /collection/printemps-ete-2027 HTML contains product name",
            passed,
            f"Status: {r.status_code}, Product name '{product_name}' in HTML: {name_in_html}"
        )
    except Exception as e:
        all_passed &= print_test("Verify product in PE HTML", False, f"Error: {e}")
    
    # Test 2e: RESTORE product to original category
    try:
        r = session.patch(
            f"{API_URL}/admin/products?slug={test_slug}",
            json={"category": original_category}
        )
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") == True
        )
        
        all_passed &= print_test(
            f"RESTORE product to category:{original_category}",
            passed,
            f"Status: {r.status_code}, Response: {data}"
        )
    except Exception as e:
        all_passed &= print_test("RESTORE product category", False, f"Error: {e}")
    
    return all_passed

def test_redirects():
    """Test 3: Redirects (307 and 200 status codes)"""
    print("\n" + "="*80)
    print("TEST 3: Redirects")
    print("="*80)
    
    all_passed = True
    
    # Test 3a: /collection/printemps-ete-2026-2027 → 307 to /collection/printemps-ete-2027
    try:
        r = requests.get(f"{BASE_URL}/collection/printemps-ete-2026-2027", allow_redirects=False)
        
        passed = (
            r.status_code == 307 and
            "/collection/printemps-ete-2027" in r.headers.get("Location", "")
        )
        
        all_passed &= print_test(
            "/collection/printemps-ete-2026-2027 → 307 to /collection/printemps-ete-2027",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location')}"
        )
    except Exception as e:
        all_passed &= print_test("Redirect printemps-ete-2026-2027", False, f"Error: {e}")
    
    # Test 3b: /produits?cat=pe-2026-2027 → 307 to /collection/printemps-ete-2027
    try:
        r = requests.get(f"{BASE_URL}/produits?cat=pe-2026-2027", allow_redirects=False)
        
        passed = (
            r.status_code == 307 and
            "/collection/printemps-ete-2027" in r.headers.get("Location", "")
        )
        
        all_passed &= print_test(
            "/produits?cat=pe-2026-2027 → 307 to /collection/printemps-ete-2027",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location')}"
        )
    except Exception as e:
        all_passed &= print_test("Redirect produits?cat=pe-2026-2027", False, f"Error: {e}")
    
    # Test 3c: /produits?cat=intemporels → 200 (no redirect)
    try:
        r = requests.get(f"{BASE_URL}/produits?cat=intemporels", allow_redirects=False)
        
        passed = r.status_code == 200
        
        all_passed &= print_test(
            "/produits?cat=intemporels → 200 (no redirect)",
            passed,
            f"Status: {r.status_code}"
        )
    except Exception as e:
        all_passed &= print_test("No redirect produits?cat=intemporels", False, f"Error: {e}")
    
    # Test 3d: /collections?cat=empreinte → 307 with cat=intemporels
    try:
        r = requests.get(f"{BASE_URL}/collections?cat=empreinte", allow_redirects=False)
        
        location = r.headers.get("Location", "")
        has_intemporels = "cat=intemporels" in location
        
        passed = (
            r.status_code == 307 and
            has_intemporels
        )
        
        all_passed &= print_test(
            "/collections?cat=empreinte → 307 with cat=intemporels",
            passed,
            f"Status: {r.status_code}, Location: {location}, Has intemporels: {has_intemporels}"
        )
    except Exception as e:
        all_passed &= print_test("Redirect collections?cat=empreinte", False, f"Error: {e}")
    
    # Test 3e: /collection/unknown → 307 to /produits
    try:
        r = requests.get(f"{BASE_URL}/collection/unknown", allow_redirects=False)
        
        passed = (
            r.status_code == 307 and
            "/produits" in r.headers.get("Location", "")
        )
        
        all_passed &= print_test(
            "/collection/unknown → 307 to /produits",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location')}"
        )
    except Exception as e:
        all_passed &= print_test("Redirect collection/unknown", False, f"Error: {e}")
    
    # Test 3f: /collection/printemps-ete-2027 → 200 and HTML contains "Cinq couleurs"
    try:
        r = requests.get(f"{BASE_URL}/collection/printemps-ete-2027")
        html = r.text
        
        has_palette_text = "Cinq couleurs" in html or "cinq couleurs" in html.lower()
        
        passed = (
            r.status_code == 200 and
            has_palette_text
        )
        
        all_passed &= print_test(
            "/collection/printemps-ete-2027 → 200 and HTML contains 'Cinq couleurs'",
            passed,
            f"Status: {r.status_code}, Has palette text: {has_palette_text}"
        )
    except Exception as e:
        all_passed &= print_test("PE collection page", False, f"Error: {e}")
    
    return all_passed

def test_navbar_api():
    """Test 4: Navbar API with migration test"""
    print("\n" + "="*80)
    print("TEST 4: Navbar API and Migration")
    print("="*80)
    
    all_passed = True
    
    # Get MongoDB connection
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "ginette_creations")
        client = MongoClient(mongo_url)
        db = client[db_name]
    except Exception as e:
        return print_test("MongoDB connection", False, f"Error: {e}")
    
    # Test 4a: GET /api/site-pages/navbar → has PE top-level item and Intemporels child
    try:
        r = requests.get(f"{API_URL}/site-pages/navbar")
        data = r.json()
        
        navbar = data.get("navbar", {})
        items = navbar.get("items", [])
        
        # Check for PE top-level item
        pe_item = None
        for item in items:
            if "/collection/printemps-ete-2027" in item.get("href", ""):
                pe_item = item
                break
        
        has_pe_toplevel = pe_item is not None and "Printemps" in pe_item.get("label", "")
        
        # Check for Intemporels in Produits children
        produits_item = None
        for item in items:
            if "/produits" in item.get("href", "") and item.get("href") == "/produits":
                produits_item = item
                break
        
        has_intemporels_child = False
        if produits_item:
            children = produits_item.get("children", [])
            for child in children:
                if "/produits?cat=intemporels" in child.get("href", ""):
                    has_intemporels_child = "Intemporels" in child.get("label", "")
                    break
        
        passed = (
            r.status_code == 200 and
            has_pe_toplevel and
            has_intemporels_child
        )
        
        all_passed &= print_test(
            "GET /api/site-pages/navbar has PE top-level and Intemporels child",
            passed,
            f"Status: {r.status_code}, Has PE: {has_pe_toplevel}, Has Intemporels: {has_intemporels_child}"
        )
    except Exception as e:
        all_passed &= print_test("GET navbar", False, f"Error: {e}")
    
    # Test 4b: Migration test - backup original navbar
    original_navbar = None
    try:
        original_navbar = db.site_pages.find_one({"_id": "navbar"})
        print(f"  Backed up original navbar: {original_navbar is not None}")
    except Exception as e:
        all_passed &= print_test("Backup navbar", False, f"Error: {e}")
        return all_passed
    
    # Test 4c: Write a saved navbar WITHOUT PE item and without collectionsV2
    try:
        test_navbar = {
            "_id": "navbar",
            "data": {
                "items": [
                    {"label": "Accueil", "href": "/", "show": True},
                    {"label": "Produits", "href": "/produits", "show": True, "children": [
                        {"label": "Tous les produits", "href": "/produits", "show": True}
                    ]},
                    {"label": "À propos", "href": "/a-propos", "show": True}
                ]
                # NO collectionsV2 flag, NO PE item
            },
            "updatedAt": "2024-01-01T00:00:00Z"
        }
        
        db.site_pages.replace_one({"_id": "navbar"}, test_navbar, upsert=True)
        print(f"  Wrote test navbar without PE and without collectionsV2")
    except Exception as e:
        all_passed &= print_test("Write test navbar", False, f"Error: {e}")
        return all_passed
    
    # Test 4d: GET navbar must inject PE top-level item + Intemporels child
    try:
        r = requests.get(f"{API_URL}/site-pages/navbar")
        data = r.json()
        
        navbar = data.get("navbar", {})
        items = navbar.get("items", [])
        
        # Check for injected PE top-level item
        pe_item = None
        for item in items:
            if "/collection/printemps-ete-2027" in item.get("href", ""):
                pe_item = item
                break
        
        has_pe_injected = pe_item is not None
        
        # Check for injected Intemporels child
        produits_item = None
        for item in items:
            if "/produits" in item.get("href", "") and item.get("href") == "/produits":
                produits_item = item
                break
        
        has_intemporels_injected = False
        if produits_item:
            children = produits_item.get("children", [])
            for child in children:
                if "/produits?cat=intemporels" in child.get("href", ""):
                    has_intemporels_injected = True
                    break
        
        passed = (
            r.status_code == 200 and
            has_pe_injected and
            has_intemporels_injected
        )
        
        all_passed &= print_test(
            "GET navbar injects PE top-level and Intemporels child (migration)",
            passed,
            f"Status: {r.status_code}, PE injected: {has_pe_injected}, Intemporels injected: {has_intemporels_injected}"
        )
    except Exception as e:
        all_passed &= print_test("GET navbar with injection", False, f"Error: {e}")
    
    # Test 4e: Save via admin PATCH without PE → GET must NOT re-inject (collectionsV2 true)
    session = requests.Session()
    try:
        r = session.post(f"{API_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD})
        if r.status_code != 200:
            all_passed &= print_test("Admin login for navbar test", False, f"Failed to login: {r.status_code}")
            return all_passed
        
        # PATCH navbar without PE item
        navbar_without_pe = {
            "items": [
                {"label": "Accueil", "href": "/", "show": True},
                {"label": "Produits", "href": "/produits", "show": True, "children": [
                    {"label": "Tous les produits", "href": "/produits", "show": True}
                ]},
                {"label": "À propos", "href": "/a-propos", "show": True}
            ]
        }
        
        r = session.patch(f"{API_URL}/admin/site-pages/navbar", json=navbar_without_pe)
        data = r.json()
        
        patch_ok = (r.status_code == 200 and data.get("ok") == True)
        
        # Now GET navbar - should NOT re-inject because collectionsV2 is set to true
        r = requests.get(f"{API_URL}/site-pages/navbar")
        data = r.json()
        
        navbar = data.get("navbar", {})
        items = navbar.get("items", [])
        
        # Check that PE is NOT injected
        pe_item = None
        for item in items:
            if "/collection/printemps-ete-2027" in item.get("href", ""):
                pe_item = item
                break
        
        pe_not_reinjected = pe_item is None
        
        passed = (
            patch_ok and
            r.status_code == 200 and
            pe_not_reinjected
        )
        
        all_passed &= print_test(
            "After admin PATCH, GET navbar does NOT re-inject PE (collectionsV2=true)",
            passed,
            f"PATCH ok: {patch_ok}, GET status: {r.status_code}, PE not re-injected: {pe_not_reinjected}"
        )
    except Exception as e:
        all_passed &= print_test("Admin PATCH navbar test", False, f"Error: {e}")
    
    # Test 4f: RESTORE original navbar
    try:
        if original_navbar:
            db.site_pages.replace_one({"_id": "navbar"}, original_navbar, upsert=True)
            print(f"  ✅ Restored original navbar")
        else:
            db.site_pages.delete_one({"_id": "navbar"})
            print(f"  ✅ Deleted navbar (didn't exist originally)")
        
        all_passed &= print_test(
            "RESTORE original navbar",
            True,
            "Original navbar restored successfully"
        )
    except Exception as e:
        all_passed &= print_test("RESTORE navbar", False, f"Error: {e}")
    
    return all_passed

def main():
    print("="*80)
    print("COLLECTIONS RESTORED BACKEND TESTING")
    print("Testing Printemps/Été 2027 + Les Intemporels collections feature")
    print("="*80)
    
    results = []
    
    # Run all tests
    results.append(("Category Filters", test_category_filters()))
    results.append(("Admin Product Assignment", test_admin_product_assignment()))
    results.append(("Redirects", test_redirects()))
    results.append(("Navbar API and Migration", test_navbar_api()))
    
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
