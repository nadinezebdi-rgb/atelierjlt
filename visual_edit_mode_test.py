#!/usr/bin/env python3
"""
Visual Edit Mode End-to-End Test
Tests the new visual edit mode flow accessible via /?edit=1
"""

import requests
import json
import sys
import copy

BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_test(test_name):
    """Print a formatted test header"""
    print(f"\n[TEST] {test_name}")
    print("-" * 80)

def main():
    """Run all Visual Edit Mode tests"""
    print_section("VISUAL EDIT MODE END-TO-END TEST")
    print(f"Base URL: {BASE_URL}")
    print(f"Admin Password: {ADMIN_PASSWORD}")
    
    all_results = []
    admin_cookies = None
    original_content = None
    modified_content = None
    
    # ========================================================================
    # TEST 1: Admin Authentication
    # ========================================================================
    print_test("1. Admin Authentication")
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/admin-login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        admin_cookies = resp.cookies
        assert "ginette_admin" in admin_cookies, "Admin cookie not set"
        print(f"✅ PASS: Admin login successful")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Cookie: ginette_admin set")
        all_results.append(("Admin Authentication", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Admin Authentication", False, str(e)))
        print("\n⚠️  Cannot continue without admin authentication")
        return print_summary(all_results)
    
    # ========================================================================
    # TEST 2: Load Content (Admin Endpoint)
    # ========================================================================
    print_test("2. Load Content via GET /api/admin/site-content")
    try:
        resp = requests.get(
            f"{BASE_URL}/api/admin/site-content",
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "content" in data, "Missing 'content' key in response"
        original_content = data["content"]
        assert original_content is not None, "Content is null"
        
        # Handle nested content structure: content.content.sections
        inner_content = original_content
        if isinstance(original_content, dict) and "content" in original_content:
            inner_content = original_content["content"]
        
        # Check if content has sections array
        if isinstance(inner_content, dict) and "sections" in inner_content:
            sections = inner_content["sections"]
            print(f"✅ PASS: Content loaded successfully")
            print(f"   - Status: {resp.status_code}")
            print(f"   - Content structure: nested (content.content.sections)")
            print(f"   - Sections count: {len(sections) if isinstance(sections, list) else 'N/A'}")
        else:
            print(f"✅ PASS: Content loaded (no sections array found)")
            print(f"   - Status: {resp.status_code}")
            print(f"   - Content keys: {list(original_content.keys()) if isinstance(original_content, dict) else 'N/A'}")
        
        all_results.append(("Load Content (Admin)", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Load Content (Admin)", False, str(e)))
        print("\n⚠️  Cannot continue without content")
        return print_summary(all_results)
    
    # ========================================================================
    # TEST 3: Modify Section and Save
    # ========================================================================
    print_test("3. Modify Section and Save via PATCH /api/admin/site-content")
    try:
        # Create a deep copy of the original content
        modified_content = copy.deepcopy(original_content)
        
        # Handle nested content structure: content.content.sections
        inner_content = modified_content
        if isinstance(modified_content, dict) and "content" in modified_content:
            inner_content = modified_content["content"]
        
        # Find and modify the carousel-new section (or create one if it doesn't exist)
        section_found = False
        if isinstance(inner_content, dict) and "sections" in inner_content:
            sections = inner_content["sections"]
            if isinstance(sections, list):
                for section in sections:
                    if isinstance(section, dict) and section.get("id") == "carousel-new":
                        # Modify the title
                        if "content" not in section:
                            section["content"] = {}
                        section["content"]["title"] = "Mon nouveau titre test E2E"
                        section_found = True
                        print(f"   - Found carousel-new section, modifying title")
                        break
        
        # If section not found, add it to sections array
        if not section_found:
            print(f"   - carousel-new section not found, creating new section")
            if isinstance(inner_content, dict):
                if "sections" not in inner_content:
                    inner_content["sections"] = []
                inner_content["sections"].append({
                    "id": "carousel-new",
                    "type": "carousel",
                    "content": {
                        "title": "Mon nouveau titre test E2E"
                    }
                })
        
        # Save the modified content (send the full structure back)
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=modified_content,
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        
        print(f"✅ PASS: Section modified and saved successfully")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Response: {data}")
        all_results.append(("Modify and Save Section", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Modify and Save Section", False, str(e)))
    
    # ========================================================================
    # TEST 4: Verify Persistence (Public Endpoint)
    # ========================================================================
    print_test("4. Verify Persistence via GET /api/site-content (public)")
    try:
        resp = requests.get(
            f"{BASE_URL}/api/site-content",
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "content" in data, "Missing 'content' key in response"
        public_content = data["content"]
        
        # Handle nested content structure: content.content.sections
        inner_content = public_content
        if isinstance(public_content, dict) and "content" in public_content:
            inner_content = public_content["content"]
        
        # Check if the modified title is present
        title_found = False
        if isinstance(inner_content, dict) and "sections" in inner_content:
            sections = inner_content["sections"]
            if isinstance(sections, list):
                for section in sections:
                    if isinstance(section, dict) and section.get("id") == "carousel-new":
                        content = section.get("content", {})
                        title = content.get("title", "")
                        if title == "Mon nouveau titre test E2E":
                            title_found = True
                            print(f"✅ PASS: Modified title persisted correctly")
                            print(f"   - Status: {resp.status_code}")
                            print(f"   - Section ID: carousel-new")
                            print(f"   - Title: {title}")
                            break
        
        if not title_found:
            print(f"⚠️  WARNING: Modified title not found in public content")
            print(f"   - This might indicate the section structure is different")
            if isinstance(inner_content, dict):
                print(f"   - Inner content keys: {list(inner_content.keys())}")
                if "sections" in inner_content:
                    print(f"   - Sections: {[s.get('id') for s in inner_content['sections'] if isinstance(s, dict)]}")
        
        all_results.append(("Verify Persistence (Public)", title_found, "Title not found" if not title_found else None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Verify Persistence (Public)", False, str(e)))
    
    # ========================================================================
    # TEST 5: Save with Full Sections Array
    # ========================================================================
    print_test("5. Save with Full Sections Array")
    try:
        # Create a minimal sections array
        minimal_content = copy.deepcopy(original_content)
        
        # Handle nested content structure
        inner_content = minimal_content
        if isinstance(minimal_content, dict) and "content" in minimal_content:
            inner_content = minimal_content["content"]
        
        if isinstance(inner_content, dict):
            # Keep existing structure but ensure sections array is present
            if "sections" not in inner_content:
                inner_content["sections"] = []
            
            # Add a test section
            inner_content["sections"] = [
                {
                    "id": "test-section-e2e",
                    "type": "hero",
                    "content": {
                        "title": "Test Section E2E",
                        "subtitle": "Testing full sections array save"
                    }
                }
            ]
        
        resp = requests.patch(
            f"{BASE_URL}/api/admin/site-content",
            json=minimal_content,
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") == True, f"Expected ok:true, got {data}"
        
        print(f"✅ PASS: Full sections array saved successfully")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Response: {data}")
        all_results.append(("Save Full Sections Array", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Save Full Sections Array", False, str(e)))
    
    # ========================================================================
    # TEST 6: Regression - Homepage without ?edit=1
    # ========================================================================
    print_test("6. Regression - GET / (homepage without edit mode)")
    try:
        resp = requests.get(
            f"{BASE_URL}/",
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "text/html" in resp.headers.get("content-type", ""), "Expected HTML response"
        
        print(f"✅ PASS: Homepage loads without edit mode")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Content-Type: {resp.headers.get('content-type')}")
        print(f"   - Content length: {len(resp.text)} bytes")
        all_results.append(("Homepage without edit mode", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Homepage without edit mode", False, str(e)))
    
    # ========================================================================
    # TEST 7: Regression - /?edit=1 WITHOUT admin cookie
    # ========================================================================
    print_test("7. Regression - GET /?edit=1 WITHOUT admin cookie")
    try:
        resp = requests.get(
            f"{BASE_URL}/?edit=1",
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "text/html" in resp.headers.get("content-type", ""), "Expected HTML response"
        
        # Should show login prompt page, not crash
        print(f"✅ PASS: Edit mode without admin cookie returns 200")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Content-Type: {resp.headers.get('content-type')}")
        print(f"   - Should show login prompt (not crash)")
        all_results.append(("Edit mode without admin cookie", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Edit mode without admin cookie", False, str(e)))
    
    # ========================================================================
    # TEST 8: Regression - /?edit=1 WITH admin cookie
    # ========================================================================
    print_test("8. Regression - GET /?edit=1 WITH admin cookie")
    try:
        resp = requests.get(
            f"{BASE_URL}/?edit=1",
            cookies=admin_cookies,
            timeout=10
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        assert "text/html" in resp.headers.get("content-type", ""), "Expected HTML response"
        
        # Should render edit mode, not crash
        print(f"✅ PASS: Edit mode with admin cookie returns 200")
        print(f"   - Status: {resp.status_code}")
        print(f"   - Content-Type: {resp.headers.get('content-type')}")
        print(f"   - Should render edit mode (not crash)")
        all_results.append(("Edit mode with admin cookie", True, None))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Edit mode with admin cookie", False, str(e)))
    
    # ========================================================================
    # TEST 9: Cleanup - Restore Original Content
    # ========================================================================
    print_test("9. Cleanup - Restore Original Content")
    try:
        if original_content is not None:
            resp = requests.patch(
                f"{BASE_URL}/api/admin/site-content",
                json=original_content,
                cookies=admin_cookies,
                timeout=10
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            data = resp.json()
            assert data.get("ok") == True, f"Expected ok:true, got {data}"
            
            print(f"✅ PASS: Original content restored successfully")
            print(f"   - Status: {resp.status_code}")
            print(f"   - Response: {data}")
            all_results.append(("Cleanup - Restore Content", True, None))
        else:
            print(f"⚠️  SKIP: No original content to restore")
            all_results.append(("Cleanup - Restore Content", True, "Skipped - no original content"))
    except Exception as e:
        print(f"❌ FAIL: {e}")
        all_results.append(("Cleanup - Restore Content", False, str(e)))
    
    # ========================================================================
    # Print Summary
    # ========================================================================
    return print_summary(all_results)

def print_summary(results):
    """Print test summary and return exit code"""
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, success, _ in results if success)
    failed = sum(1 for _, success, _ in results if not success)
    total = len(results)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%\n")
    
    if failed > 0:
        print("Failed Tests:")
        for name, success, error in results:
            if not success:
                print(f"  ❌ {name}")
                if error:
                    print(f"     Error: {error}")
    
    print("\n" + "="*80)
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {failed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
