#!/usr/bin/env python3
"""
Backend API Test for Shipping Costs
Tests that free shipping was removed and shipping costs are correctly applied.
"""

import requests
import json
import sys
import os

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://french-craft.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

print(f"Testing backend at: {API_URL}")
print("=" * 80)

# Track test results
tests_passed = 0
tests_failed = 0
order_ids = []

def test_result(test_name, passed, message=""):
    global tests_passed, tests_failed
    if passed:
        tests_passed += 1
        print(f"✅ {test_name}: PASSED")
        if message:
            print(f"   {message}")
    else:
        tests_failed += 1
        print(f"❌ {test_name}: FAILED")
        if message:
            print(f"   {message}")
    print()

# Create a session to maintain cookies
session = requests.Session()

try:
    # TEST 1: Add plaid-sylvestre to cart (price 340 > 150)
    print("TEST 1: Add plaid-sylvestre to cart")
    print("-" * 80)
    
    cart_data = {
        "slug": "plaid-sylvestre",
        "qty": 1
    }
    
    response = session.post(f"{API_URL}/cart", json=cart_data)
    print(f"POST /api/cart: {response.status_code}")
    
    if response.status_code == 200:
        cart = response.json()
        print(f"Cart response: {json.dumps(cart, indent=2)}")
        
        # Verify cart has the item
        if cart.get('count') == 1 and cart.get('subtotal') == 340:
            test_result("Add plaid-sylvestre to cart", True, 
                       f"Cart count: {cart['count']}, Subtotal: {cart['subtotal']} €")
        else:
            test_result("Add plaid-sylvestre to cart", False, 
                       f"Expected count=1, subtotal=340, got count={cart.get('count')}, subtotal={cart.get('subtotal')}")
    else:
        test_result("Add plaid-sylvestre to cart", False, 
                   f"HTTP {response.status_code}: {response.text}")

    # TEST 2: Create order with standard shipping
    print("TEST 2: Create order with standard shipping (8.9 €)")
    print("-" * 80)
    
    order_data = {
        "address": {
            "firstName": "T",
            "lastName": "C",
            "name": "T C",
            "email": "t@example.com",
            "address": "1 rue A",
            "city": "Lyon",
            "zip": "69001",
            "country": "France",
            "shippingMethod": "standard"
        }
    }
    
    response = session.post(f"{API_URL}/orders", json=order_data)
    print(f"POST /api/orders (standard): {response.status_code}")
    
    if response.status_code == 200:
        order_response = response.json()
        order = order_response.get('order', {})
        print(f"Order response: {json.dumps(order_response, indent=2)}")
        
        order_id = order.get('_id')
        order_number = order.get('orderNumber')
        subtotal = order.get('subtotal')
        discount = order.get('discount', 0)
        shipping = order.get('shipping')
        total = order.get('total')
        
        if order_id:
            order_ids.append(order_number or order_id)
        
        # Verify shipping cost is 8.9
        expected_total = subtotal - discount + 8.9
        
        if shipping == 8.9:
            test_result("Standard shipping cost", True, 
                       f"Shipping: {shipping} € (expected 8.9 €)")
        else:
            test_result("Standard shipping cost", False, 
                       f"Shipping: {shipping} € (expected 8.9 €)")
        
        # Verify total calculation
        if abs(total - expected_total) < 0.01:
            test_result("Standard shipping total calculation", True, 
                       f"Total: {total} € = Subtotal ({subtotal}) - Discounts ({discount}) + Shipping ({shipping})")
        else:
            test_result("Standard shipping total calculation", False, 
                       f"Total: {total} €, Expected: {expected_total} € (subtotal {subtotal} - discount {discount} + shipping {shipping})")
    else:
        test_result("Create order with standard shipping", False, 
                   f"HTTP {response.status_code}: {response.text}")

    # TEST 3: Add plaid-sylvestre to cart again for express shipping test
    print("TEST 3: Add plaid-sylvestre to cart again")
    print("-" * 80)
    
    response = session.post(f"{API_URL}/cart", json=cart_data)
    print(f"POST /api/cart: {response.status_code}")
    
    if response.status_code == 200:
        cart = response.json()
        print(f"Cart response: {json.dumps(cart, indent=2)}")
        
        # Verify cart has the item
        if cart.get('count') == 1 and cart.get('subtotal') == 340:
            test_result("Add plaid-sylvestre to cart (2nd time)", True, 
                       f"Cart count: {cart['count']}, Subtotal: {cart['subtotal']} €")
        else:
            test_result("Add plaid-sylvestre to cart (2nd time)", False, 
                       f"Expected count=1, subtotal=340, got count={cart.get('count')}, subtotal={cart.get('subtotal')}")
    else:
        test_result("Add plaid-sylvestre to cart (2nd time)", False, 
                   f"HTTP {response.status_code}: {response.text}")

    # TEST 4: Create order with express shipping
    print("TEST 4: Create order with express shipping (14.9 €)")
    print("-" * 80)
    
    order_data_express = {
        "address": {
            "firstName": "T",
            "lastName": "C",
            "name": "T C",
            "email": "t@example.com",
            "address": "1 rue A",
            "city": "Lyon",
            "zip": "69001",
            "country": "France",
            "shippingMethod": "express"
        }
    }
    
    response = session.post(f"{API_URL}/orders", json=order_data_express)
    print(f"POST /api/orders (express): {response.status_code}")
    
    if response.status_code == 200:
        order_response = response.json()
        order = order_response.get('order', {})
        print(f"Order response: {json.dumps(order_response, indent=2)}")
        
        order_id = order.get('_id')
        order_number = order.get('orderNumber')
        subtotal = order.get('subtotal')
        discount = order.get('discount', 0)
        shipping = order.get('shipping')
        total = order.get('total')
        
        if order_id:
            order_ids.append(order_number or order_id)
        
        # Verify shipping cost is 14.9
        expected_total = subtotal - discount + 14.9
        
        if shipping == 14.9:
            test_result("Express shipping cost", True, 
                       f"Shipping: {shipping} € (expected 14.9 €)")
        else:
            test_result("Express shipping cost", False, 
                       f"Shipping: {shipping} € (expected 14.9 €)")
        
        # Verify total calculation
        if abs(total - expected_total) < 0.01:
            test_result("Express shipping total calculation", True, 
                       f"Total: {total} € = Subtotal ({subtotal}) - Discounts ({discount}) + Shipping ({shipping})")
        else:
            test_result("Express shipping total calculation", False, 
                       f"Total: {total} €, Expected: {expected_total} € (subtotal {subtotal} - discount {discount} + shipping {shipping})")
    else:
        test_result("Create order with express shipping", False, 
                   f"HTTP {response.status_code}: {response.text}")

    # TEST 5: Check /api/site-pages/livraison for shipping costs text
    print("TEST 5: Check /api/site-pages/livraison for shipping costs")
    print("-" * 80)
    
    response = session.get(f"{API_URL}/site-pages/livraison")
    print(f"GET /api/site-pages/livraison: {response.status_code}")
    
    if response.status_code == 200:
        livraison_response = response.json()
        print(f"Livraison page response: {json.dumps(livraison_response, indent=2)}")
        
        # Get the page data (it's nested under 'page' key)
        livraison_page = livraison_response.get('page', livraison_response)
        
        # Find the "Frais de livraison" section
        sections = livraison_page.get('sections', [])
        frais_section = None
        
        for section in sections:
            if section.get('title') == 'Frais de livraison':
                frais_section = section
                break
        
        if frais_section:
            text = frais_section.get('text', '')
            print(f"Frais de livraison section text: {text}")
            
            # Check for 8,90 €
            has_890 = '8,90' in text or '8.90' in text or '8,9' in text
            # Check for 14,90 €
            has_1490 = '14,90' in text or '14.90' in text or '14,9' in text
            # Check that "Offerte" is NOT present
            has_offerte = 'Offerte' in text or 'offerte' in text or 'OFFERTE' in text
            
            if has_890:
                test_result("Livraison page mentions 8,90 €", True, 
                           "Found '8,90 €' in Frais de livraison section")
            else:
                test_result("Livraison page mentions 8,90 €", False, 
                           "Did not find '8,90 €' in Frais de livraison section")
            
            if has_1490:
                test_result("Livraison page mentions 14,90 €", True, 
                           "Found '14,90 €' in Frais de livraison section")
            else:
                test_result("Livraison page mentions 14,90 €", False, 
                           "Did not find '14,90 €' in Frais de livraison section")
            
            if not has_offerte:
                test_result("Livraison page does NOT contain 'Offerte'", True, 
                           "No mention of 'Offerte' (free shipping) found")
            else:
                test_result("Livraison page does NOT contain 'Offerte'", False, 
                           f"Found 'Offerte' in text: {text}")
        else:
            test_result("Find 'Frais de livraison' section", False, 
                       "Section 'Frais de livraison' not found in livraison page")
    else:
        test_result("GET /api/site-pages/livraison", False, 
                   f"HTTP {response.status_code}: {response.text}")

    # Print summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Tests passed: {tests_passed}")
    print(f"Tests failed: {tests_failed}")
    print(f"Total tests: {tests_passed + tests_failed}")
    print()
    
    if order_ids:
        print("Created order IDs:")
        for order_id in order_ids:
            print(f"  - {order_id}")
        print()
    
    if tests_failed == 0:
        print("✅ ALL TESTS PASSED")
        sys.exit(0)
    else:
        print(f"❌ {tests_failed} TEST(S) FAILED")
        sys.exit(1)

except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
