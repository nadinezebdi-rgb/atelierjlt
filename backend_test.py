#!/usr/bin/env python3
"""
Backend test for major restructure:
- Categories: removed racine/empreinte, added intemporels/pe-2026-2027
- All 11 products reclassified to intemporels
- New page /collection/printemps-ete-2026-2027
- Homepage sections restructured
- Admin: CollectionPEEditor (saves to content.collectionPE2027)
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.admin_cookie = None
        self.original_content = None
    
    def test(self, name: str, condition: bool, details: str = ""):
        if condition:
            self.passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            self.failed += 1
            print(f"❌ {name}")
            if details:
                print(f"   {details}")
    
    def section(self, title: str):
        print(f"\n{'='*80}")
        print(f"  {title}")
        print(f"{'='*80}\n")
    
    def admin_login(self):
        """Login as admin and store cookie"""
        try:
            resp = requests.post(
                f"{BASE_URL}/api/auth/admin-login",
                json={"password": ADMIN_PASSWORD},
                timeout=10
            )
            if resp.status_code == 200:
                self.admin_cookie = resp.cookies.get("ginette_admin")
                self.test("Admin login", self.admin_cookie is not None, f"Cookie: {self.admin_cookie[:20]}...")
                return True
            else:
                self.test("Admin login", False, f"Status: {resp.status_code}")
                return False
        except Exception as e:
            self.test("Admin login", False, f"Error: {str(e)}")
            return False
    
    def get_cookies(self):
        """Return cookies dict for admin requests"""
        if self.admin_cookie:
            return {"ginette_admin": self.admin_cookie}
        return {}

def main():
    runner = TestRunner()
    
    # ========================================================================
    # SECTION A: PRODUCTS
    # ========================================================================
    runner.section("A. PRODUCTS - Category Restructure")
    
    try:
        # A1: GET /api/products → 200, exactly 11 products, ALL have category: 'intemporels'
        resp = requests.get(f"{BASE_URL}/api/products", timeout=10)
        runner.test("A1: GET /api/products returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", [])
            total = data.get("total", 0)
            
            runner.test("A1: Exactly 11 products", total == 11 and len(products) == 11, 
                       f"Found {total} products")
            
            # Check ALL products have category: 'intemporels'
            all_intemporels = all(p.get("category") == "intemporels" for p in products)
            runner.test("A1: ALL products have category='intemporels'", all_intemporels,
                       f"Categories: {set(p.get('category') for p in products)}")
            
            # Check NO products have old categories
            old_categories = [p for p in products if p.get("category") in ["racine", "empreinte", "terre"]]
            runner.test("A1: NO products with old categories (racine/empreinte/terre)", 
                       len(old_categories) == 0,
                       f"Found {len(old_categories)} products with old categories")
    except Exception as e:
        runner.test("A1: GET /api/products", False, f"Error: {str(e)}")
    
    try:
        # A2: GET /api/products?cat=intemporels → 200, 11 products
        resp = requests.get(f"{BASE_URL}/api/products?cat=intemporels", timeout=10)
        runner.test("A2: GET /api/products?cat=intemporels returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", [])
            runner.test("A2: Filter intemporels returns 11 products", len(products) == 11,
                       f"Found {len(products)} products")
    except Exception as e:
        runner.test("A2: GET /api/products?cat=intemporels", False, f"Error: {str(e)}")
    
    try:
        # A3: GET /api/products?cat=pe-2026-2027 → 200, 0 products (empty collection)
        resp = requests.get(f"{BASE_URL}/api/products?cat=pe-2026-2027", timeout=10)
        runner.test("A3: GET /api/products?cat=pe-2026-2027 returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", [])
            runner.test("A3: New category pe-2026-2027 is empty (0 products)", len(products) == 0,
                       f"Found {len(products)} products (expected 0)")
    except Exception as e:
        runner.test("A3: GET /api/products?cat=pe-2026-2027", False, f"Error: {str(e)}")
    
    try:
        # A4: GET /api/products?cat=racine → 200, 0 products (old category gone)
        resp = requests.get(f"{BASE_URL}/api/products?cat=racine", timeout=10)
        runner.test("A4: GET /api/products?cat=racine returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", [])
            runner.test("A4: Old category 'racine' returns 0 products", len(products) == 0,
                       f"Found {len(products)} products (expected 0, old category removed)")
    except Exception as e:
        runner.test("A4: GET /api/products?cat=racine", False, f"Error: {str(e)}")
    
    try:
        # A5: GET /api/products/plaid-sylvestre → 200 with product.category === 'intemporels'
        resp = requests.get(f"{BASE_URL}/api/products/plaid-sylvestre", timeout=10)
        runner.test("A5: GET /api/products/plaid-sylvestre returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            product = data.get("product", {})
            category = product.get("category")
            runner.test("A5: plaid-sylvestre has category='intemporels'", category == "intemporels",
                       f"Category: {category}")
    except Exception as e:
        runner.test("A5: GET /api/products/plaid-sylvestre", False, f"Error: {str(e)}")
    
    # ========================================================================
    # SECTION B: PAGES RENDER
    # ========================================================================
    runner.section("B. PAGES RENDER")
    
    pages = [
        ("B1", "/", "Homepage"),
        ("B2", "/collection/printemps-ete-2026-2027", "New PE 2026-2027 collection page"),
        ("B3", "/collections", "Collections page"),
        ("B4", "/collections?cat=intemporels", "Collections filtered by intemporels"),
        ("B5", "/a-propos", "About page"),
        ("B6", "/admin", "Admin page"),
    ]
    
    for test_id, path, description in pages:
        try:
            resp = requests.get(f"{BASE_URL}{path}", timeout=10)
            runner.test(f"{test_id}: GET {path} returns 200", resp.status_code == 200,
                       f"{description} - Status: {resp.status_code}")
        except Exception as e:
            runner.test(f"{test_id}: GET {path}", False, f"Error: {str(e)}")
    
    # ========================================================================
    # SECTION C: ADMIN FLOWS
    # ========================================================================
    runner.section("C. ADMIN FLOWS")
    
    # C1: Admin login
    if not runner.admin_login():
        print("⚠️  Admin login failed, skipping admin tests")
        runner.section("SUMMARY")
        print(f"\n✅ Passed: {runner.passed}")
        print(f"❌ Failed: {runner.failed}")
        print(f"📊 Total: {runner.passed + runner.failed}")
        return 1 if runner.failed > 0 else 0
    
    try:
        # C2: GET /api/admin/site-content (with cookie) → 200
        resp = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            cookies=runner.get_cookies(),
            timeout=10
        )
        runner.test("C2: GET /api/admin/site-content returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            runner.original_content = data.get("content")
            runner.test("C2: Content object exists", runner.original_content is not None)
    except Exception as e:
        runner.test("C2: GET /api/admin/site-content", False, f"Error: {str(e)}")
    
    try:
        # C3: PATCH /api/admin/site-content with collectionPE2027 data
        # First get existing content to merge properly
        resp_get = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            cookies=runner.get_cookies(),
            timeout=10
        )
        
        if resp_get.status_code == 200:
            existing = resp_get.json().get("content", {})
            # Merge new collectionPE2027 data into existing content
            existing["collectionPE2027"] = {
                "heroTitle": "Test Title 123",
                "palette": [
                    {"name": "Test", "hex": "#FF0000"}
                ]
            }
            test_data = existing
        else:
            # Fallback if GET fails
            test_data = {
                "collectionPE2027": {
                    "heroTitle": "Test Title 123",
                    "palette": [
                        {"name": "Test", "hex": "#FF0000"}
                    ]
                }
            }
        
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=test_data,
            cookies=runner.get_cookies(),
            timeout=10
        )
        runner.test("C3: PATCH /api/admin/site-content returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            runner.test("C3: Response has ok:true", data.get("ok") == True)
    except Exception as e:
        runner.test("C3: PATCH /api/admin/site-content", False, f"Error: {str(e)}")
    
    try:
        # C4: GET /api/site-content → verify collectionPE2027 data persisted
        resp = requests.get(f"{BASE_URL}/api/site-content", timeout=10)
        runner.test("C4: GET /api/site-content returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            content = data.get("content", {})
            collection_pe = content.get("collectionPE2027", {})
            
            hero_title = collection_pe.get("heroTitle")
            palette = collection_pe.get("palette", [])
            
            runner.test("C4: collectionPE2027.heroTitle === 'Test Title 123'", 
                       hero_title == "Test Title 123",
                       f"heroTitle: {hero_title}")
            
            runner.test("C4: collectionPE2027.palette array present", 
                       isinstance(palette, list) and len(palette) > 0,
                       f"palette: {palette}")
            
            if len(palette) > 0:
                runner.test("C4: palette[0] has correct data",
                           palette[0].get("name") == "Test" and palette[0].get("hex") == "#FF0000",
                           f"palette[0]: {palette[0]}")
    except Exception as e:
        runner.test("C4: GET /api/site-content", False, f"Error: {str(e)}")
    
    # ========================================================================
    # SECTION D: REGRESSION TESTS
    # ========================================================================
    runner.section("D. REGRESSION TESTS")
    
    try:
        # D1: POST /api/admin/reset-product-photos
        resp = requests.post(
            f"{BASE_URL}/api/admin/reset-product-photos",
            json={"slug": "plaid-sylvestre"},
            cookies=runner.get_cookies(),
            timeout=10
        )
        runner.test("D1: POST /api/admin/reset-product-photos returns 200", 
                   resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            runner.test("D1: Response has ok:true", data.get("ok") == True)
    except Exception as e:
        runner.test("D1: POST /api/admin/reset-product-photos", False, f"Error: {str(e)}")
    
    try:
        # D2: GET /api/img/jlt-plaid-01 → 200 real bytes
        resp = requests.get(f"{BASE_URL}/api/img/jlt-plaid-01", timeout=10)
        runner.test("D2: GET /api/img/jlt-plaid-01 returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            content_type = resp.headers.get("Content-Type", "")
            content_length = len(resp.content)
            runner.test("D2: Real image bytes returned", 
                       "image" in content_type and content_length > 1000,
                       f"Content-Type: {content_type}, Size: {content_length} bytes")
    except Exception as e:
        runner.test("D2: GET /api/img/jlt-plaid-01", False, f"Error: {str(e)}")
    
    try:
        # D3: GET /api/img/upload-not-exist → 200 with X-Fallback-Image header
        resp = requests.get(f"{BASE_URL}/api/img/upload-not-exist", timeout=10)
        runner.test("D3: GET /api/img/upload-not-exist returns 200", resp.status_code == 200)
        
        if resp.status_code == 200:
            fallback_header = resp.headers.get("X-Fallback-Image")
            runner.test("D3: X-Fallback-Image header present", 
                       fallback_header == "1",
                       f"X-Fallback-Image: {fallback_header}")
    except Exception as e:
        runner.test("D3: GET /api/img/upload-not-exist", False, f"Error: {str(e)}")
    
    # ========================================================================
    # SECTION E: CLEANUP
    # ========================================================================
    runner.section("E. CLEANUP")
    
    try:
        # E1: Clear test data - get current content and clear collectionPE2027
        resp_get = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            cookies=runner.get_cookies(),
            timeout=10
        )
        
        if resp_get.status_code == 200:
            cleanup_data = resp_get.json().get("content", {})
            # Clear the test data
            cleanup_data["collectionPE2027"] = {}
        else:
            cleanup_data = {"collectionPE2027": {}}
        
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=cleanup_data,
            cookies=runner.get_cookies(),
            timeout=10
        )
        runner.test("E1: PATCH /api/admin/site-content (cleanup) returns 200", 
                   resp.status_code == 200)
        
        if resp.status_code == 200:
            data = resp.json()
            runner.test("E1: Cleanup successful (ok:true)", data.get("ok") == True)
    except Exception as e:
        runner.test("E1: Cleanup", False, f"Error: {str(e)}")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    runner.section("SUMMARY")
    
    print(f"\n✅ Passed: {runner.passed}")
    print(f"❌ Failed: {runner.failed}")
    print(f"📊 Total: {runner.passed + runner.failed}")
    
    if runner.failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {runner.failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
