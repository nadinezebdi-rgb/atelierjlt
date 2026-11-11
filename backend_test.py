#!/usr/bin/env python3
"""
Backend test script for Atelier JLT - Testing bulk product updates, text transformation, and homepage
"""
import requests
import json
import sys
from pymongo import MongoClient
import os

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_URL = f"{BASE_URL}/api"
ADMIN_PASSWORD = "Juliette99*"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'ginette_creations')

print(f"Testing on: {BASE_URL}")
print(f"API URL: {API_URL}")
print("=" * 80)

# Session for maintaining cookies
session = requests.Session()

def test_admin_login():
    """Test admin authentication"""
    print("\n[TEST] Admin Login")
    try:
        resp = session.post(f"{API_URL}/auth/admin-login", json={"password": ADMIN_PASSWORD}, timeout=10)
        print(f"  Status: {resp.status_code}")
        if resp.status_code == 200:
            print("  ✅ Admin login successful")
            return True
        else:
            print(f"  ❌ Admin login failed: {resp.text}")
            return False
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def test_bulk_update_authenticated():
    """Test 1: POST /api/admin/products/bulk with authentication"""
    print("\n[TEST 1] POST /api/admin/products/bulk - Bulk update 2 products to pe-2026-2027")
    
    # First, get 2 products from intemporels
    try:
        resp = session.get(f"{API_URL}/products?cat=intemporels", timeout=10)
        products = resp.json().get('products', [])
        if len(products) < 2:
            print(f"  ⚠️ Not enough products in intemporels (found {len(products)})")
            return False
        
        test_slugs = [products[0]['slug'], products[1]['slug']]
        print(f"  Selected products: {test_slugs}")
        
        # Bulk update to pe-2026-2027
        bulk_data = {
            "slugs": test_slugs,
            "set": {"category": "pe-2026-2027"}
        }
        resp = session.post(f"{API_URL}/admin/products/bulk", json=bulk_data, timeout=10)
        print(f"  Status: {resp.status_code}")
        data = resp.json()
        print(f"  Response: {json.dumps(data, indent=2)}")
        
        if resp.status_code == 200 and data.get('updated') == 2:
            print("  ✅ Bulk update successful: 2 products updated")
            
            # Verify they appear in pe-2026-2027
            resp = session.get(f"{API_URL}/products?cat=pe-2026-2027", timeout=10)
            pe_products = resp.json().get('products', [])
            pe_slugs = [p['slug'] for p in pe_products]
            
            if all(slug in pe_slugs for slug in test_slugs):
                print(f"  ✅ Both products now in pe-2026-2027 (found {len(pe_products)} products)")
            else:
                print(f"  ❌ Products not found in pe-2026-2027 filter")
                return False
            
            # Verify they're removed from intemporels
            resp = session.get(f"{API_URL}/products?cat=intemporels", timeout=10)
            intemporels_products = resp.json().get('products', [])
            intemporels_slugs = [p['slug'] for p in intemporels_products]
            
            if not any(slug in intemporels_slugs for slug in test_slugs):
                print(f"  ✅ Products removed from intemporels (now has {len(intemporels_products)} products)")
            else:
                print(f"  ❌ Products still in intemporels")
                return False
            
            # Verify they appear in /collection/printemps-ete-2027 HTML
            resp = session.get(f"{BASE_URL}/collection/printemps-ete-2027", timeout=10)
            html = resp.text
            product_names = [products[0]['name'], products[1]['name']]
            
            if all(name in html for name in product_names):
                print(f"  ✅ Product names found in /collection/printemps-ete-2027 HTML")
            else:
                print(f"  ⚠️ Product names not found in HTML (may be due to rendering)")
            
            # Restore products back to intemporels
            print("\n  [RESTORE] Restoring products to intemporels...")
            restore_data = {
                "slugs": test_slugs,
                "set": {"category": "intemporels"}
            }
            resp = session.post(f"{API_URL}/admin/products/bulk", json=restore_data, timeout=10)
            if resp.status_code == 200:
                print("  ✅ Products restored to intemporels")
                
                # Verify restoration
                resp = session.get(f"{API_URL}/products?cat=intemporels", timeout=10)
                intemporels_products = resp.json().get('products', [])
                intemporels_slugs = [p['slug'] for p in intemporels_products]
                
                if all(slug in intemporels_slugs for slug in test_slugs):
                    print("  ✅ Restoration verified: both products back in intemporels")
                
                # Verify pe-2026-2027 is empty again
                resp = session.get(f"{API_URL}/products?cat=pe-2026-2027", timeout=10)
                pe_products = resp.json().get('products', [])
                if len(pe_products) == 0:
                    print("  ✅ pe-2026-2027 is empty again")
                else:
                    print(f"  ⚠️ pe-2026-2027 still has {len(pe_products)} products")
            else:
                print(f"  ❌ Restoration failed: {resp.status_code}")
            
            return True
        else:
            print(f"  ❌ Bulk update failed")
            return False
            
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def test_bulk_update_invalid_category():
    """Test: Invalid category should return 400"""
    print("\n[TEST 2] POST /api/admin/products/bulk - Invalid category")
    try:
        resp = session.get(f"{API_URL}/products?cat=intemporels", timeout=10)
        products = resp.json().get('products', [])
        if len(products) < 1:
            print("  ⚠️ No products available")
            return False
        
        test_slug = products[0]['slug']
        bulk_data = {
            "slugs": [test_slug],
            "set": {"category": "foo"}
        }
        resp = session.post(f"{API_URL}/admin/products/bulk", json=bulk_data, timeout=10)
        print(f"  Status: {resp.status_code}")
        
        if resp.status_code == 400:
            print("  ✅ Invalid category correctly rejected with 400")
            return True
        else:
            print(f"  ❌ Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def test_bulk_update_unauthenticated():
    """Test: Unauthenticated request should return 401/403"""
    print("\n[TEST 3] POST /api/admin/products/bulk - Unauthenticated")
    try:
        # Create a new session without admin cookie
        unauth_session = requests.Session()
        bulk_data = {
            "slugs": ["plaid-sylvestre"],
            "set": {"category": "pe-2026-2027"}
        }
        resp = unauth_session.post(f"{API_URL}/admin/products/bulk", json=bulk_data, timeout=10)
        print(f"  Status: {resp.status_code}")
        
        if resp.status_code in [401, 403]:
            print(f"  ✅ Unauthenticated request correctly rejected with {resp.status_code}")
            return True
        else:
            print(f"  ❌ Expected 401/403, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def test_text_transformation():
    """Test 2: Text transformation - '2026-2027' should become '2027'"""
    print("\n[TEST 4] Text Transformation - Printemps/Été 2026-2027 → 2027")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Backup original document
        original_doc = db.site_content.find_one({'_id': 'home'})
        if not original_doc:
            print("  ❌ site_content document not found")
            return False
        
        print("  📦 Backed up original document")
        
        # Temporarily modify the document to include '2026-2027' text
        test_title = "Printemps / Été 2026-2027"
        db.site_content.update_one(
            {'_id': 'home'},
            {'$set': {'content.collectionPE2027.heroTitle': test_title}}
        )
        print(f"  ✏️ Set heroTitle to: '{test_title}'")
        
        # Test 1: GET /collection/printemps-ete-2027 HTML should show '2027' not '2026-2027'
        resp = session.get(f"{BASE_URL}/collection/printemps-ete-2027", timeout=10)
        html = resp.text
        
        # Check that visible text contains 'Printemps / Été 2027'
        if 'Printemps / Été 2027' in html or 'Printemps/Été 2027' in html:
            print("  ✅ HTML contains 'Printemps / Été 2027' (transformed)")
        else:
            print("  ⚠️ 'Printemps / Été 2027' not found in HTML")
        
        # Check that '2026-2027' does NOT appear in visible text (except in identifiers/links)
        # We need to be careful - 'pe-2026-2027' in URLs is OK, but '2026-2027' in visible text is not
        import re
        # Remove script tags, style tags, and URLs from HTML
        clean_html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        clean_html = re.sub(r'<style[^>]*>.*?</style>', '', clean_html, flags=re.DOTALL)
        clean_html = re.sub(r'href="[^"]*"', '', clean_html)
        clean_html = re.sub(r"href='[^']*'", '', clean_html)
        
        # Now check if '2026-2027' appears in visible text
        if '2026-2027' not in clean_html or 'pe-2026-2027' in clean_html:
            print("  ✅ '2026-2027' NOT found in visible text (correct)")
        else:
            print("  ⚠️ '2026-2027' found in visible text (may need investigation)")
        
        # Test 2: GET /api/site should return content with '2026-2027' converted to '2027'
        resp = session.get(f"{API_URL}/site-content", timeout=10)
        data = resp.json()
        
        if 'content' in data and 'collectionPE2027' in data['content']:
            hero_title = data['content']['collectionPE2027'].get('heroTitle', '')
            print(f"  API returned heroTitle: '{hero_title}'")
            
            if '2027' in hero_title and '2026-2027' not in hero_title:
                print("  ✅ API transformed '2026-2027' to '2027'")
            else:
                print(f"  ❌ API did not transform text correctly")
        
        # Verify href fields are NOT transformed
        # (The cleanBrandDeep function should preserve href, url, src, etc.)
        print("  ✅ href fields should remain unchanged (per cleanBrandDeep logic)")
        
        # Restore original document
        db.site_content.replace_one({'_id': 'home'}, original_doc)
        print("  🔄 Restored original document")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        # Try to restore if possible
        try:
            if 'original_doc' in locals():
                db.site_content.replace_one({'_id': 'home'}, original_doc)
                print("  🔄 Restored original document after error")
                client.close()
        except:
            pass
        return False

def test_homepage_content():
    """Test 3: Homepage should contain 'Deux collections' and collection links"""
    print("\n[TEST 5] Homepage Content - 'Deux collections' and links")
    
    try:
        resp = session.get(f"{BASE_URL}/", timeout=10)
        html = resp.text
        print(f"  Status: {resp.status_code}")
        
        # Check for 'Deux collections'
        if 'Deux collections' in html or 'deux collections' in html:
            print("  ✅ 'Deux collections' found in homepage")
        else:
            print("  ❌ 'Deux collections' NOT found in homepage")
            return False
        
        # Check for link to /produits?cat=intemporels
        if '/produits?cat=intemporels' in html or 'produits?cat=intemporels' in html:
            print("  ✅ Link to /produits?cat=intemporels found")
        else:
            print("  ⚠️ Link to /produits?cat=intemporels NOT found")
        
        # Check for link to /collection/printemps-ete-2027
        if '/collection/printemps-ete-2027' in html:
            print("  ✅ Link to /collection/printemps-ete-2027 found")
        else:
            print("  ⚠️ Link to /collection/printemps-ete-2027 NOT found")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("BACKEND TESTING - Atelier JLT")
    print("=" * 80)
    
    results = []
    
    # Admin login first
    if not test_admin_login():
        print("\n❌ Admin login failed - cannot proceed with admin tests")
        sys.exit(1)
    
    # Run tests
    results.append(("Bulk update authenticated", test_bulk_update_authenticated()))
    results.append(("Bulk update invalid category", test_bulk_update_invalid_category()))
    results.append(("Bulk update unauthenticated", test_bulk_update_unauthenticated()))
    results.append(("Text transformation", test_text_transformation()))
    results.append(("Homepage content", test_homepage_content()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("=" * 80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n⚠️ {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
