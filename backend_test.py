#!/usr/bin/env python3
"""
Backend regression test for custom carousel images feature
Tests both existing functionality and new customImages field persistence
"""

import requests
import json
import sys

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

def test_section_a_regression():
    """Section A: Regression tests - should still work"""
    print("\n" + "="*80)
    print("SECTION A: REGRESSION TESTS")
    print("="*80)
    
    results = []
    
    # Test A1: GET /api/products → 200, 11 products, no `terre` category
    print("\n[A1] Testing GET /api/products...")
    try:
        resp = requests.get(f"{BASE_URL}/api/products", timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "products" in data, "Missing 'products' key"
        assert data["total"] == 11, f"Expected 11 products, got {data['total']}"
        # Check no terre category
        terre_products = [p for p in data["products"] if p.get("category") == "terre"]
        assert len(terre_products) == 0, f"Found {len(terre_products)} terre products, expected 0"
        print(f"✅ PASS: GET /api/products returns {data['total']} products, no terre category")
        results.append(("A1: GET /api/products", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A1: GET /api/products", False, str(e)))
    
    # Test A2: GET /api/products/plaid-sylvestre → 200
    print("\n[A2] Testing GET /api/products/plaid-sylvestre...")
    try:
        resp = requests.get(f"{BASE_URL}/api/products/plaid-sylvestre", timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "product" in data, "Missing 'product' key"
        assert data["product"]["slug"] == "plaid-sylvestre", "Wrong product returned"
        print(f"✅ PASS: GET /api/products/plaid-sylvestre returns product")
        results.append(("A2: GET /api/products/plaid-sylvestre", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A2: GET /api/products/plaid-sylvestre", False, str(e)))
    
    # Test A3: GET /api/site-content → 200
    print("\n[A3] Testing GET /api/site-content...")
    try:
        resp = requests.get(f"{BASE_URL}/api/site-content", timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "content" in data, "Missing 'content' key"
        print(f"✅ PASS: GET /api/site-content returns content")
        results.append(("A3: GET /api/site-content", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A3: GET /api/site-content", False, str(e)))
    
    # Test A4: POST /api/admin/reset-product-photos (with admin cookie)
    print("\n[A4] Testing POST /api/admin/reset-product-photos...")
    try:
        # First login as admin
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.status_code}"
        admin_cookies = login_resp.cookies
        
        # Now reset product photos
        resp = requests.post(
            f"{BASE_URL}/api/admin/reset-product-photos",
            json={"slug": "plaid-sylvestre"},
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        assert "actionId" in data, "Missing actionId in response"
        action_id = data["actionId"]
        print(f"✅ PASS: POST /api/admin/reset-product-photos returns ok:true, actionId: {action_id}")
        results.append(("A4: POST /api/admin/reset-product-photos", True, None))
        
        # Test A5: POST /api/chat/actions (undo)
        print("\n[A5] Testing POST /api/chat/actions (undo)...")
        try:
            undo_resp = requests.post(
                f"{BASE_URL}/api/chat/actions",
                json={"actionId": action_id},
                cookies=admin_cookies,
                timeout=10
            )
            assert undo_resp.status_code == 200, f"Expected 200, got {undo_resp.status_code}"
            undo_data = undo_resp.json()
            assert undo_data.get("ok") == True, f"Expected ok:true, got {undo_data}"
            print(f"✅ PASS: POST /api/chat/actions undo works")
            results.append(("A5: POST /api/chat/actions (undo)", True, None))
        except Exception as e:
            print(f"❌ FAIL: {e}")
            results.append(("A5: POST /api/chat/actions (undo)", False, str(e)))
            
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A4: POST /api/admin/reset-product-photos", False, str(e)))
        results.append(("A5: POST /api/chat/actions (undo)", False, "Skipped due to A4 failure"))
    
    # Test A6: GET /api/img/jlt-plaid-01 → 200 real bytes
    print("\n[A6] Testing GET /api/img/jlt-plaid-01...")
    try:
        resp = requests.get(f"{BASE_URL}/api/img/jlt-plaid-01", timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert resp.headers.get("Content-Type", "").startswith("image/"), f"Expected image content type, got {resp.headers.get('Content-Type')}"
        assert len(resp.content) > 1000, f"Expected real image bytes, got {len(resp.content)} bytes"
        assert "X-Fallback-Image" not in resp.headers, "Should not have fallback header for real image"
        print(f"✅ PASS: GET /api/img/jlt-plaid-01 returns real image ({len(resp.content)} bytes)")
        results.append(("A6: GET /api/img/jlt-plaid-01", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A6: GET /api/img/jlt-plaid-01", False, str(e)))
    
    # Test A7: GET /api/img/upload-does-not-exist → 200 with X-Fallback-Image header
    print("\n[A7] Testing GET /api/img/upload-does-not-exist...")
    try:
        resp = requests.get(f"{BASE_URL}/api/img/upload-does-not-exist", timeout=10)
        assert resp.status_code == 200, f"Expected 200 (fallback), got {resp.status_code}"
        assert "X-Fallback-Image" in resp.headers, "Missing X-Fallback-Image header"
        assert resp.headers["X-Fallback-Image"] == "1", f"Expected X-Fallback-Image: 1, got {resp.headers['X-Fallback-Image']}"
        assert len(resp.content) > 1000, f"Expected fallback image bytes, got {len(resp.content)} bytes"
        print(f"✅ PASS: GET /api/img/upload-does-not-exist returns fallback with X-Fallback-Image: 1")
        results.append(("A7: GET /api/img/upload-does-not-exist", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("A7: GET /api/img/upload-does-not-exist", False, str(e)))
    
    return results


def test_section_b_new_feature():
    """Section B: New feature end-to-end - custom carousel images"""
    print("\n" + "="*80)
    print("SECTION B: NEW FEATURE - CUSTOM CAROUSEL IMAGES")
    print("="*80)
    
    results = []
    
    # Test B1: POST /api/auth/admin-login
    print("\n[B1] Testing POST /api/auth/admin-login...")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        assert "ginette_admin" in resp.cookies, "Missing admin cookie"
        admin_cookies = resp.cookies
        print(f"✅ PASS: POST /api/auth/admin-login returns 200 + admin cookie")
        results.append(("B1: POST /api/auth/admin-login", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("B1: POST /api/auth/admin-login", False, str(e)))
        return results  # Can't continue without admin auth
    
    # Test B2: GET /api/admin/site-content (with cookie)
    print("\n[B2] Testing GET /api/admin/site-content...")
    try:
        resp = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "content" in data, "Missing 'content' key"
        original_content = data["content"]
        print(f"✅ PASS: GET /api/admin/site-content returns content object")
        results.append(("B2: GET /api/admin/site-content", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("B2: GET /api/admin/site-content", False, str(e)))
        return results  # Can't continue without content
    
    # Test B3: PUT /api/admin/site-content with customImages
    # Note: The API actually uses PATCH, not PUT (route.js line 636)
    print("\n[B3] Testing PUT /api/admin/site-content with customImages...")
    try:
        # Create test content with customImages
        test_content = original_content or {}
        if "sections" not in test_content:
            test_content["sections"] = []
        
        # Add or modify a section with customImages
        test_section = {
            "id": "test-carousel-section",
            "type": "carousel",
            "visible": True,
            "content": {
                "title": "Test Carousel",
                "customImages": [
                    {
                        "id": "x1",
                        "src": "/api/img/jlt-plaid-01",
                        "alt": "test image 1"
                    },
                    {
                        "id": "x2",
                        "src": "/api/img/jlt-plaid-02",
                        "alt": "test image 2"
                    }
                ]
            }
        }
        
        # Find existing test section or add new one
        existing_idx = None
        for idx, section in enumerate(test_content.get("sections", [])):
            if section.get("id") == "test-carousel-section":
                existing_idx = idx
                break
        
        if existing_idx is not None:
            test_content["sections"][existing_idx] = test_section
        else:
            test_content["sections"].append(test_section)
        
        # PATCH the updated content (API uses PATCH, not PUT)
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=test_content,
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        print(f"✅ PASS: PUT /api/admin/site-content with customImages returns ok:true")
        results.append(("B3: PUT /api/admin/site-content with customImages", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("B3: PUT /api/admin/site-content with customImages", False, str(e)))
        return results
    
    # Test B4: GET /api/site-content → verify customImages persisted
    print("\n[B4] Testing GET /api/site-content (verify persistence)...")
    try:
        resp = requests.get(f"{BASE_URL}/api/site-content", timeout=10)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "content" in data, "Missing 'content' key"
        
        # Find the test section
        test_section_found = None
        for section in data["content"].get("sections", []):
            if section.get("id") == "test-carousel-section":
                test_section_found = section
                break
        
        assert test_section_found is not None, "Test section not found in persisted content"
        assert "customImages" in test_section_found.get("content", {}), "customImages field not persisted"
        custom_images = test_section_found["content"]["customImages"]
        assert len(custom_images) == 2, f"Expected 2 customImages, got {len(custom_images)}"
        assert custom_images[0]["id"] == "x1", f"Expected id 'x1', got {custom_images[0].get('id')}"
        assert custom_images[0]["src"] == "/api/img/jlt-plaid-01", f"Expected src '/api/img/jlt-plaid-01', got {custom_images[0].get('src')}"
        
        print(f"✅ PASS: GET /api/site-content returns persisted customImages (2 images)")
        results.append(("B4: GET /api/site-content (verify persistence)", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("B4: GET /api/site-content (verify persistence)", False, str(e)))
    
    # Test B5: Edge case - PUT with empty customImages array
    # Note: Using PATCH as the API doesn't support PUT
    print("\n[B5] Testing PUT /api/admin/site-content with empty customImages...")
    try:
        # Update the test section with empty customImages
        test_content_empty = data["content"]
        for section in test_content_empty.get("sections", []):
            if section.get("id") == "test-carousel-section":
                section["content"]["customImages"] = []
                break
        
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=test_content_empty,
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        
        # Verify empty array persisted
        verify_resp = requests.get(f"{BASE_URL}/api/site-content", timeout=10)
        verify_data = verify_resp.json()
        test_section_verify = None
        for section in verify_data["content"].get("sections", []):
            if section.get("id") == "test-carousel-section":
                test_section_verify = section
                break
        
        assert test_section_verify is not None, "Test section not found after empty update"
        assert "customImages" in test_section_verify.get("content", {}), "customImages field removed instead of emptied"
        assert test_section_verify["content"]["customImages"] == [], f"Expected empty array, got {test_section_verify['content']['customImages']}"
        
        print(f"✅ PASS: PUT /api/admin/site-content with empty customImages saves correctly")
        results.append(("B5: PUT with empty customImages", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        results.append(("B5: PUT with empty customImages", False, str(e)))
    
    return results


def main():
    print("\n" + "="*80)
    print("BACKEND REGRESSION TEST - CUSTOM CAROUSEL IMAGES FEATURE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Password: {ADMIN_PASSWORD}")
    
    all_results = []
    
    # Run Section A tests
    section_a_results = test_section_a_regression()
    all_results.extend(section_a_results)
    
    # Run Section B tests
    section_b_results = test_section_b_new_feature()
    all_results.extend(section_b_results)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, success, _ in all_results if success)
    failed = sum(1 for _, success, _ in all_results if not success)
    total = len(all_results)
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    print("\nDetailed Results:")
    for test_name, success, error in all_results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if error:
            print(f"    Error: {error}")
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
