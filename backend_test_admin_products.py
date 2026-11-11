#!/usr/bin/env python3
"""
Quick test for admin product management endpoints
Tests: POST, GET with filters, PATCH, DELETE
"""
import requests
import json
import sys

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

def test_admin_products():
    """Test admin product CRUD operations"""
    session = requests.Session()
    
    print("=" * 80)
    print("ADMIN PRODUCT MANAGEMENT TEST")
    print("=" * 80)
    
    # Step 1: Admin login
    print("\n[TEST 1] Admin Login")
    try:
        login_resp = session.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        print(f"  Status: {login_resp.status_code}")
        if login_resp.status_code != 200:
            print(f"  ❌ FAILED: Admin login failed - {login_resp.text}")
            return False
        print("  ✅ PASSED: Admin logged in successfully")
    except Exception as e:
        print(f"  ❌ FAILED: Admin login error - {e}")
        return False
    
    # Step 2: Create product
    print("\n[TEST 2] POST /api/admin/products - Create new product")
    product_data = {
        "name": "Nouvelle création",
        "category": "pe-2026-2027",
        "collection": "pe-2026-2027",
        "price": 0,
        "stock": 1
    }
    
    try:
        create_resp = session.post(
            f"{BASE_URL}/api/admin/products",
            json=product_data,
            timeout=10
        )
        print(f"  Status: {create_resp.status_code}")
        print(f"  Response: {create_resp.text[:200]}")
        
        if create_resp.status_code != 200:
            print(f"  ❌ FAILED: Product creation failed")
            return False
        
        result = create_resp.json()
        if "slug" not in result:
            print(f"  ❌ FAILED: Response missing 'slug' field")
            return False
        
        product_slug = result["slug"]
        print(f"  ✅ PASSED: Product created with slug: {product_slug}")
    except Exception as e:
        print(f"  ❌ FAILED: Product creation error - {e}")
        return False
    
    # Step 3: Verify product in pe-2026-2027 category
    print("\n[TEST 3] GET /api/products?cat=pe-2026-2027 - Verify product in category")
    try:
        get_resp = session.get(
            f"{BASE_URL}/api/products?cat=pe-2026-2027",
            timeout=10
        )
        print(f"  Status: {get_resp.status_code}")
        
        if get_resp.status_code != 200:
            print(f"  ❌ FAILED: GET products failed")
            return False
        
        products = get_resp.json().get("products", [])
        found = any(p.get("slug") == product_slug for p in products)
        
        if not found:
            print(f"  ❌ FAILED: Product '{product_slug}' not found in pe-2026-2027 category")
            print(f"  Found products: {[p.get('slug') for p in products]}")
            return False
        
        print(f"  ✅ PASSED: Product found in pe-2026-2027 category")
    except Exception as e:
        print(f"  ❌ FAILED: GET products error - {e}")
        return False
    
    # Step 4: Verify product NOT in intemporels category
    print("\n[TEST 4] GET /api/products?cat=intemporels - Verify product NOT in category")
    try:
        get_resp = session.get(
            f"{BASE_URL}/api/products?cat=intemporels",
            timeout=10
        )
        print(f"  Status: {get_resp.status_code}")
        
        if get_resp.status_code != 200:
            print(f"  ❌ FAILED: GET products failed")
            return False
        
        products = get_resp.json().get("products", [])
        found = any(p.get("slug") == product_slug for p in products)
        
        if found:
            print(f"  ❌ FAILED: Product '{product_slug}' should NOT be in intemporels category yet")
            return False
        
        print(f"  ✅ PASSED: Product not in intemporels category (as expected)")
    except Exception as e:
        print(f"  ❌ FAILED: GET products error - {e}")
        return False
    
    # Step 5: PATCH product to move to intemporels
    print("\n[TEST 5] PATCH /api/admin/products?slug={slug} - Move to intemporels")
    patch_data = {
        "category": "intemporels"
    }
    
    try:
        patch_resp = session.patch(
            f"{BASE_URL}/api/admin/products?slug={product_slug}",
            json=patch_data,
            timeout=10
        )
        print(f"  Status: {patch_resp.status_code}")
        print(f"  Response: {patch_resp.text[:200]}")
        
        if patch_resp.status_code != 200:
            print(f"  ❌ FAILED: Product update failed")
            return False
        
        print(f"  ✅ PASSED: Product updated successfully")
    except Exception as e:
        print(f"  ❌ FAILED: Product update error - {e}")
        return False
    
    # Step 6: Verify product NOW in intemporels
    print("\n[TEST 6] GET /api/products?cat=intemporels - Verify product moved")
    try:
        get_resp = session.get(
            f"{BASE_URL}/api/products?cat=intemporels",
            timeout=10
        )
        print(f"  Status: {get_resp.status_code}")
        
        if get_resp.status_code != 200:
            print(f"  ❌ FAILED: GET products failed")
            return False
        
        products = get_resp.json().get("products", [])
        found = any(p.get("slug") == product_slug for p in products)
        
        if not found:
            print(f"  ❌ FAILED: Product '{product_slug}' not found in intemporels category after PATCH")
            print(f"  Found products: {[p.get('slug') for p in products]}")
            return False
        
        print(f"  ✅ PASSED: Product successfully moved to intemporels category")
    except Exception as e:
        print(f"  ❌ FAILED: GET products error - {e}")
        return False
    
    # Step 7: Verify collection field also updated (admin GET)
    print("\n[TEST 7] GET /api/admin/products - Verify collection field updated")
    try:
        admin_get_resp = session.get(
            f"{BASE_URL}/api/admin/products",
            timeout=10
        )
        print(f"  Status: {admin_get_resp.status_code}")
        
        if admin_get_resp.status_code != 200:
            print(f"  ❌ FAILED: Admin GET products failed")
            return False
        
        admin_products = admin_get_resp.json().get("products", [])
        product = next((p for p in admin_products if p.get("slug") == product_slug), None)
        
        if not product:
            print(f"  ❌ FAILED: Product not found in admin products list")
            return False
        
        if product.get("collection") != "intemporels":
            print(f"  ❌ FAILED: Collection field not updated. Expected 'intemporels', got '{product.get('collection')}'")
            return False
        
        print(f"  ✅ PASSED: Collection field correctly updated to 'intemporels'")
    except Exception as e:
        print(f"  ❌ FAILED: Admin GET products error - {e}")
        return False
    
    # Step 8: DELETE product
    print("\n[TEST 8] DELETE /api/admin/products?slug={slug} - Clean up")
    try:
        delete_resp = session.delete(
            f"{BASE_URL}/api/admin/products?slug={product_slug}",
            timeout=10
        )
        print(f"  Status: {delete_resp.status_code}")
        print(f"  Response: {delete_resp.text[:200]}")
        
        if delete_resp.status_code != 200:
            print(f"  ❌ FAILED: Product deletion failed")
            return False
        
        print(f"  ✅ PASSED: Product deleted successfully")
    except Exception as e:
        print(f"  ❌ FAILED: Product deletion error - {e}")
        return False
    
    # Step 9: Verify product is gone
    print("\n[TEST 9] GET /api/products?cat=intemporels - Verify product deleted")
    try:
        get_resp = session.get(
            f"{BASE_URL}/api/products?cat=intemporels",
            timeout=10
        )
        print(f"  Status: {get_resp.status_code}")
        
        if get_resp.status_code != 200:
            print(f"  ❌ FAILED: GET products failed")
            return False
        
        products = get_resp.json().get("products", [])
        found = any(p.get("slug") == product_slug for p in products)
        
        if found:
            print(f"  ❌ FAILED: Product '{product_slug}' still exists after deletion")
            return False
        
        print(f"  ✅ PASSED: Product successfully deleted")
    except Exception as e:
        print(f"  ❌ FAILED: GET products error - {e}")
        return False
    
    # Step 10: Check for leftover test products in products_custom
    print("\n[TEST 10] Check MongoDB products_custom for leftover test products")
    try:
        # Get all admin products to check for any test products
        admin_get_resp = session.get(
            f"{BASE_URL}/api/admin/products",
            timeout=10
        )
        
        if admin_get_resp.status_code != 200:
            print(f"  ❌ FAILED: Admin GET products failed")
            return False
        
        admin_products = admin_get_resp.json().get("products", [])
        
        # Look for products with "test" or "nouvelle" in name (case insensitive)
        test_products = [
            p for p in admin_products 
            if any(keyword in p.get("name", "").lower() for keyword in ["test", "nouvelle création"])
        ]
        
        if test_products:
            print(f"  ⚠️  WARNING: Found {len(test_products)} potential test product(s):")
            for p in test_products:
                print(f"      - {p.get('name')} (slug: {p.get('slug')})")
            print(f"  Note: These may be leftover from previous tests")
        else:
            print(f"  ✅ PASSED: No test products found in database")
    except Exception as e:
        print(f"  ⚠️  WARNING: Could not check for test products - {e}")
    
    print("\n" + "=" * 80)
    print("✅ ALL TESTS PASSED")
    print("=" * 80)
    return True

if __name__ == "__main__":
    try:
        success = test_admin_products()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
