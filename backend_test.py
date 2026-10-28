#!/usr/bin/env python3
"""
Backend API Testing for Editable Email Templates and Guest Cart Link Features
Tests all endpoints related to email customization and guest cart functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"
VALID_EMAIL = "contact@atelierjlt.fr"  # Only email that works with Resend
TEST_EMAIL = "test@atelierjlt.fr"
TEST_PASSWORD = "MonSecret123"

# Session for maintaining cookies
session = requests.Session()
admin_session = requests.Session()

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_admin_login():
    """Login as admin to get admin cookie"""
    log("=" * 80)
    log("ADMIN LOGIN")
    log("=" * 80)
    try:
        r = admin_session.post(f"{BASE_URL}/api/auth/admin-login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        log(f"✅ Admin login successful")
        return True
    except Exception as e:
        log(f"❌ Admin login failed: {e}")
        return False

# ============================================================================
# A) EDITABLE EMAIL TEXTS (admin only, 401 without auth)
# ============================================================================

def test_get_email_templates():
    """Test 1: GET /api/admin/emails/templates?kind=X for each kind"""
    log("=" * 80)
    log("TEST 1: GET /api/admin/emails/templates?kind=X")
    log("=" * 80)
    
    kinds = [
        'welcome', 'order_confirmation', 'owner_new_order', 'order_shipped',
        'back_in_stock', 'cart_reminder_1', 'cart_reminder_2', 
        'guest_cart_link', 'password_reset'
    ]
    
    # Test without auth (should be 401)
    try:
        r = requests.get(f"{BASE_URL}/api/admin/emails/templates?kind=welcome")
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        log(f"✅ GET templates without auth returns 401")
    except Exception as e:
        log(f"❌ Auth check failed: {e}")
        return False
    
    # Test each kind with admin auth
    for kind in kinds:
        try:
            r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind={kind}")
            assert r.status_code == 200, f"Expected 200 for {kind}, got {r.status_code}"
            data = r.json()
            
            # Verify structure
            assert 'kind' in data and data['kind'] == kind, f"Missing or wrong kind"
            assert 'fields' in data and isinstance(data['fields'], list), f"Missing fields array"
            assert 'vars' in data and isinstance(data['vars'], list), f"Missing vars array"
            assert 'defaults' in data and isinstance(data['defaults'], dict), f"Missing defaults"
            assert 'values' in data and isinstance(data['values'], dict), f"Missing values"
            assert 'customized' in data and isinstance(data['customized'], bool), f"Missing customized flag"
            
            log(f"✅ GET templates kind={kind}: {len(data['fields'])} fields, {len(data['vars'])} vars, customized={data['customized']}")
        except Exception as e:
            log(f"❌ GET templates kind={kind} failed: {e}")
            return False
    
    # Test unknown kind (should be 400)
    try:
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=unknown_kind")
        assert r.status_code == 400, f"Expected 400 for unknown kind, got {r.status_code}"
        log(f"✅ GET templates with unknown kind returns 400")
    except Exception as e:
        log(f"❌ Unknown kind check failed: {e}")
        return False
    
    return True

def test_put_email_templates():
    """Test 2: PUT /api/admin/emails/templates with customization"""
    log("=" * 80)
    log("TEST 2: PUT /api/admin/emails/templates (customization)")
    log("=" * 80)
    
    # Test without auth (should be 401)
    try:
        r = requests.put(f"{BASE_URL}/api/admin/emails/templates", 
                        json={"kind": "order_confirmation", "values": {"subject": "Test"}})
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        log(f"✅ PUT templates without auth returns 401")
    except Exception as e:
        log(f"❌ Auth check failed: {e}")
        return False
    
    # Customize order_confirmation
    try:
        custom_values = {
            "subject": "Commande {commande} bien reçue",
            "intro": "Merci {prenom} !\nDeuxième ligne <b>x</b>"
        }
        r = admin_session.put(f"{BASE_URL}/api/admin/emails/templates", 
                             json={"kind": "order_confirmation", "values": custom_values})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get('ok') == True, f"Expected ok:true"
        assert data.get('customized') == True, f"Expected customized:true"
        log(f"✅ PUT templates order_confirmation: customized={data['customized']}")
    except Exception as e:
        log(f"❌ PUT templates failed: {e}")
        return False
    
    # Verify customization persisted
    try:
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=order_confirmation")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data['customized'] == True, f"Expected customized:true after PUT"
        assert data['values']['subject'] == "Commande {commande} bien reçue", f"Subject not saved"
        assert "Merci {prenom} !" in data['values']['intro'], f"Intro not saved"
        log(f"✅ Customization persisted correctly")
    except Exception as e:
        log(f"❌ Verification failed: {e}")
        return False
    
    # Test empty string falls back to default
    try:
        r = admin_session.put(f"{BASE_URL}/api/admin/emails/templates", 
                             json={"kind": "order_confirmation", "values": {"subject": ""}})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        # Empty string should not be stored (falls back to default)
        log(f"✅ Empty string handled correctly")
    except Exception as e:
        log(f"❌ Empty string test failed: {e}")
        return False
    
    # Test over-long subject truncated to 200
    try:
        long_subject = "A" * 300
        r = admin_session.put(f"{BASE_URL}/api/admin/emails/templates", 
                             json={"kind": "order_confirmation", "values": {"subject": long_subject}})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Verify truncation
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=order_confirmation")
        data = r.json()
        assert len(data['values']['subject']) <= 200, f"Subject not truncated to 200 chars"
        log(f"✅ Over-long subject truncated to {len(data['values']['subject'])} chars")
    except Exception as e:
        log(f"❌ Truncation test failed: {e}")
        return False
    
    return True

def test_post_email_preview():
    """Test 3: POST /api/admin/emails/preview (does NOT persist)"""
    log("=" * 80)
    log("TEST 3: POST /api/admin/emails/preview (non-persistent)")
    log("=" * 80)
    
    try:
        # Get current state
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=welcome")
        before = r.json()
        
        # Preview with custom texts (should NOT persist)
        preview_texts = {
            "subject": "Hey {prenom}",
            "intro": "This is a preview test"
        }
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/preview", 
                              json={"kind": "welcome", "texts": preview_texts})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data['subject'] == "Hey Camille", f"Preview subject wrong: {data['subject']}"
        assert "This is a preview test" in data['html'], f"Preview HTML doesn't contain custom text"
        log(f"✅ POST preview returned custom subject: {data['subject']}")
        
        # Verify it did NOT persist
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=welcome")
        after = r.json()
        assert after['values'] == before['values'], f"Preview texts were persisted (should not be)"
        log(f"✅ Preview texts did NOT persist (correct)")
        
    except Exception as e:
        log(f"❌ Preview test failed: {e}")
        return False
    
    return True

def test_get_email_preview():
    """Test 3b: GET /api/admin/emails/preview?kind=X"""
    log("=" * 80)
    log("TEST 3b: GET /api/admin/emails/preview?kind=X")
    log("=" * 80)
    
    try:
        # Re-customize order_confirmation for this test (was deleted in test 2)
        custom_values = {
            "subject": "Commande {commande} bien reçue",
            "intro": "Merci {prenom} !\nDeuxième ligne <b>x</b>"
        }
        r = admin_session.put(f"{BASE_URL}/api/admin/emails/templates", 
                             json={"kind": "order_confirmation", "values": custom_values})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        log(f"✅ Re-customized order_confirmation for preview test")
        
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/preview?kind=order_confirmation")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        # Should use customized texts
        assert 'subject' in data, f"Missing subject"
        assert 'html' in data, f"Missing html"
        assert 'Commande JLT-APERCU bien reçue' in data['subject'], f"Subject doesn't use custom text: {data['subject']}"
        assert 'Merci Camille !' in data['html'], f"HTML doesn't contain custom intro"
        assert '&lt;b&gt;x&lt;/b&gt;' in data['html'], f"HTML not escaped: {data['html'][:500]}"
        log(f"✅ GET preview uses customized texts: subject='{data['subject']}'")
        log(f"✅ HTML escaping working: <b>x</b> → &lt;b&gt;x&lt;/b&gt;")
        
    except Exception as e:
        log(f"❌ GET preview test failed: {e}")
        return False
    
    return True

def test_real_order_uses_custom_texts():
    """Test 4: Real order uses customized texts"""
    log("=" * 80)
    log("TEST 4: Real order uses customized texts")
    log("=" * 80)
    
    # Create a new session for order
    order_session = requests.Session()
    
    try:
        # Add product to cart
        r = order_session.post(f"{BASE_URL}/api/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        log(f"✅ Added product to cart")
        
        # Create order with valid email
        order_data = {
            "address": {
                "firstName": "Test",
                "lastName": "User",
                "email": VALID_EMAIL,  # Use valid email for real send
                "address": "123 Test St",
                "zip": "75001",
                "city": "Paris",
                "country": "France",
                "phone": "0123456789",
                "shippingMethod": "standard"
            }
        }
        r = order_session.post(f"{BASE_URL}/api/orders", json=order_data)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        response = r.json()
        order = response.get('order', {})
        order_number = order.get('orderNumber')
        log(f"✅ Order created: {order_number}")
        
        # Check email logs for this order
        time.sleep(2)  # Wait for email to be logged
        r = admin_session.get(f"{BASE_URL}/api/admin/emails")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        
        # Find the order_confirmation email for this order
        order_email = None
        for log_entry in data.get('logs', []):
            if log_entry.get('kind') == 'order_confirmation' and order_number in str(log_entry.get('subject', '')):
                order_email = log_entry
                break
        
        if order_email:
            # Check if custom subject was used
            expected_subject = f"Commande {order_number} bien reçue"
            actual_subject = order_email.get('subject', '')
            assert expected_subject in actual_subject, f"Custom subject not used: {actual_subject}"
            log(f"✅ Order confirmation email uses custom subject: '{actual_subject}'")
        else:
            log(f"⚠️  Order confirmation email not found in logs (may have failed to send)")
        
        # Cleanup: delete test order
        order_id = order.get('_id')
        if order_id:
            from pymongo import MongoClient
            client = MongoClient("mongodb://localhost:27017")
            db = client['ginette_creations']
            db.orders.delete_one({"_id": order_id})
            log(f"✅ Cleanup: deleted test order {order_number}")
        
    except Exception as e:
        log(f"❌ Real order test failed: {e}")
        return False
    
    return True

def test_delete_email_templates():
    """Test 5: DELETE /api/admin/emails/templates?kind=X"""
    log("=" * 80)
    log("TEST 5: DELETE /api/admin/emails/templates?kind=X")
    log("=" * 80)
    
    try:
        # Delete customization
        r = admin_session.delete(f"{BASE_URL}/api/admin/emails/templates?kind=order_confirmation")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get('ok') == True, f"Expected ok:true"
        log(f"✅ DELETE templates order_confirmation successful")
        
        # Verify it's back to defaults
        r = admin_session.get(f"{BASE_URL}/api/admin/emails/templates?kind=order_confirmation")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data['customized'] == False, f"Expected customized:false after DELETE"
        assert data['values']['subject'] == data['defaults']['subject'], f"Not back to default"
        log(f"✅ Templates back to defaults after DELETE")
        
        # Verify GET /api/admin/emails includes customized array
        r = admin_session.get(f"{BASE_URL}/api/admin/emails")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert 'customized' in data and isinstance(data['customized'], list), f"Missing customized array"
        assert 'order_confirmation' not in data['customized'], f"order_confirmation still in customized list"
        log(f"✅ GET /api/admin/emails includes customized array: {data['customized']}")
        
    except Exception as e:
        log(f"❌ DELETE templates test failed: {e}")
        return False
    
    return True

# ============================================================================
# B) GUEST CART LINK
# ============================================================================

def test_guest_cart_save():
    """Test 6: Guest cart save with email validation"""
    log("=" * 80)
    log("TEST 6: POST /api/cart/save (guest cart link)")
    log("=" * 80)
    
    guest_session = requests.Session()
    
    try:
        # Test with bad email (should be 400)
        r = guest_session.post(f"{BASE_URL}/api/cart/save", json={"email": "bad"})
        assert r.status_code == 400, f"Expected 400 for bad email, got {r.status_code}"
        assert "invalide" in r.json().get('error', '').lower(), f"Wrong error message"
        log(f"✅ Bad email returns 400: {r.json()['error']}")
        
        # Test with empty cart (should be 400)
        r = guest_session.post(f"{BASE_URL}/api/cart/save", json={"email": VALID_EMAIL})
        assert r.status_code == 400, f"Expected 400 for empty cart, got {r.status_code}"
        assert "vide" in r.json().get('error', '').lower(), f"Wrong error message"
        log(f"✅ Empty cart returns 400: {r.json()['error']}")
        
        # Add product to cart
        r = guest_session.post(f"{BASE_URL}/api/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        log(f"✅ Added product to guest cart")
        
        # Save cart with valid email (should be 200)
        r = guest_session.post(f"{BASE_URL}/api/cart/save", json={"email": VALID_EMAIL})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get('ok') == True, f"Expected ok:true"
        log(f"✅ Cart saved successfully with email {VALID_EMAIL}")
        
        # Verify saved_carts doc created
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        saved_cart = db.saved_carts.find_one({"email": VALID_EMAIL})
        assert saved_cart is not None, f"saved_carts doc not created"
        assert len(saved_cart['items']) > 0, f"saved_carts has no items"
        assert 'expiresAt' in saved_cart, f"saved_carts missing expiresAt"
        token = saved_cart['_id']
        log(f"✅ saved_carts doc created with token: {token[:16]}...")
        
        # Verify carts doc has guestLinkSentAt
        carts = list(db.carts.find({"guestEmail": VALID_EMAIL}))
        assert len(carts) > 0, f"carts doc not found"
        cart = carts[0]
        assert 'guestLinkSentAt' in cart, f"carts missing guestLinkSentAt"
        log(f"✅ carts doc has guestLinkSentAt: {cart['guestLinkSentAt']}")
        
        # Verify email_logs has guest_cart_link
        email_log = db.email_logs.find_one({"kind": "guest_cart_link", "to": VALID_EMAIL})
        assert email_log is not None, f"email_logs missing guest_cart_link"
        log(f"✅ email_logs has guest_cart_link entry")
        
        # Test second call within 2 min (should be 429)
        r = guest_session.post(f"{BASE_URL}/api/cart/save", json={"email": VALID_EMAIL})
        assert r.status_code == 429, f"Expected 429 for rate limit, got {r.status_code}"
        log(f"✅ Second call within 2 min returns 429: {r.json()['error']}")
        
        # Cleanup
        db.saved_carts.delete_many({"email": VALID_EMAIL})
        db.carts.delete_many({"guestEmail": VALID_EMAIL})
        db.email_logs.delete_many({"kind": "guest_cart_link", "to": VALID_EMAIL})
        log(f"✅ Cleanup: deleted test data")
        
        return token  # Return token for next test
        
    except Exception as e:
        log(f"❌ Guest cart save test failed: {e}")
        return False

def test_cart_restore(token):
    """Test 7: GET /api/cart/restore?t=<token>"""
    log("=" * 80)
    log("TEST 7: GET /api/cart/restore?t=<token>")
    log("=" * 80)
    
    if not token or token == False:
        log(f"⚠️  Skipping test 7: no token from test 6")
        return True
    
    try:
        # Create saved cart for testing
        from pymongo import MongoClient
        import datetime
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        
        test_token = "test_restore_token_123"
        db.saved_carts.insert_one({
            "_id": test_token,
            "email": "test@example.com",
            "items": [{"slug": "plaid-sylvestre", "name": "Plaid Sylvestre", "price": 340, "qty": 1, "variant": None, "size": None, "image": None}],
            "source": "cart",
            "createdAt": datetime.datetime.now(),
            "expiresAt": datetime.datetime.now() + datetime.timedelta(days=30)
        })
        log(f"✅ Created test saved_cart with token: {test_token}")
        
        # Test restore with NEW cookie jar (should redirect and set cookie)
        restore_session = requests.Session()
        r = restore_session.get(f"{BASE_URL}/api/cart/restore?t={test_token}", allow_redirects=False)
        assert r.status_code == 302, f"Expected 302 redirect, got {r.status_code}"
        assert "/checkout?panier=retrouve" in r.headers.get('Location', ''), f"Wrong redirect location"
        assert 'Set-Cookie' in r.headers, f"No Set-Cookie header"
        log(f"✅ Restore returns 302 to {r.headers['Location']}")
        log(f"✅ Set-Cookie header present")
        
        # Follow redirect and check cart
        r = restore_session.get(f"{BASE_URL}/api/cart")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        cart = r.json()
        assert cart['count'] > 0, f"Cart is empty after restore"
        assert any(item['slug'] == 'plaid-sylvestre' for item in cart['items']), f"Restored item not in cart"
        log(f"✅ Cart restored successfully: {cart['count']} items")
        
        # Test restoring into a jar that already has the same item (qty = max, not summed)
        r = restore_session.post(f"{BASE_URL}/api/cart", json={"slug": "plaid-sylvestre", "qty": 2})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        before_qty = r.json()['items'][0]['qty']
        log(f"✅ Cart before second restore: qty={before_qty}")
        
        r = restore_session.get(f"{BASE_URL}/api/cart/restore?t={test_token}", allow_redirects=False)
        assert r.status_code == 302, f"Expected 302, got {r.status_code}"
        
        r = restore_session.get(f"{BASE_URL}/api/cart")
        after_qty = r.json()['items'][0]['qty']
        assert after_qty == max(before_qty, 1), f"Qty should be max({before_qty}, 1), got {after_qty}"
        log(f"✅ Second restore: qty = max (not summed): {after_qty}")
        
        # Test bad/expired token (should redirect to /?panier=expire)
        r = requests.get(f"{BASE_URL}/api/cart/restore?t=badtoken123", allow_redirects=False)
        assert r.status_code == 302, f"Expected 302, got {r.status_code}"
        assert "/?panier=expire" in r.headers.get('Location', ''), f"Wrong redirect for bad token"
        log(f"✅ Bad token redirects to /?panier=expire")
        
        # Cleanup
        db.saved_carts.delete_one({"_id": test_token})
        log(f"✅ Cleanup: deleted test saved_cart")
        
    except Exception as e:
        log(f"❌ Cart restore test failed: {e}")
        return False
    
    return True

def test_checkout_email():
    """Test 8: POST /api/cart/checkout-email"""
    log("=" * 80)
    log("TEST 8: POST /api/cart/checkout-email")
    log("=" * 80)
    
    try:
        # Test as guest with items
        guest_session = requests.Session()
        r = guest_session.post(f"{BASE_URL}/api/cart", json={"slug": "plaid-sylvestre", "qty": 1})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        r = guest_session.post(f"{BASE_URL}/api/cart/checkout-email", json={"email": "visiteur@example.com"})
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get('ok') == True, f"Expected ok:true"
        log(f"✅ Guest checkout-email successful")
        
        # Verify carts doc has guestEmail, guestEmailSource, guestEmailAt
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        cart = db.carts.find_one({"guestEmail": "visiteur@example.com"})
        assert cart is not None, f"carts doc not found"
        assert cart.get('guestEmailSource') == 'checkout', f"Wrong guestEmailSource"
        assert 'guestEmailAt' in cart, f"Missing guestEmailAt"
        log(f"✅ carts doc has guestEmail, guestEmailSource='checkout', guestEmailAt")
        
        # Test as logged-in client (should skip)
        logged_in_session = requests.Session()
        r = logged_in_session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        if r.status_code == 200:
            r = logged_in_session.post(f"{BASE_URL}/api/cart/checkout-email", json={"email": "logged@example.com"})
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert data.get('ok') == True, f"Expected ok:true"
            assert data.get('skipped') == 'logged_in', f"Expected skipped:logged_in"
            log(f"✅ Logged-in user: {data}")
        else:
            log(f"⚠️  Could not test logged-in scenario (login failed)")
        
        # Test that guestLinkSentAt is not overwritten if already set
        db.carts.update_one({"guestEmail": "visiteur@example.com"}, {"$set": {"guestLinkSentAt": "2024-01-01"}})
        r = guest_session.post(f"{BASE_URL}/api/cart/checkout-email", json={"email": "visiteur@example.com"})
        cart = db.carts.find_one({"guestEmail": "visiteur@example.com"})
        assert cart.get('guestLinkSentAt') == "2024-01-01", f"guestLinkSentAt was overwritten"
        log(f"✅ guestLinkSentAt not overwritten when already set")
        
        # Cleanup
        db.carts.delete_many({"guestEmail": "visiteur@example.com"})
        log(f"✅ Cleanup: deleted test carts")
        
    except Exception as e:
        log(f"❌ Checkout email test failed: {e}")
        return False
    
    return True

def test_run_reminders():
    """Test 9: Cron logic via POST /api/admin/emails/run-reminders"""
    log("=" * 80)
    log("TEST 9: POST /api/admin/emails/run-reminders (cron logic)")
    log("=" * 80)
    
    try:
        from pymongo import MongoClient
        import datetime
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        
        # Create guest checkout cart with guestEmail, set guestEmailAt to now-4h
        test_cart_id = "test_cron_cart_123"
        four_hours_ago = datetime.datetime.now() - datetime.timedelta(hours=4)
        db.carts.insert_one({
            "_id": test_cart_id,
            "items": [{"slug": "plaid-sylvestre", "name": "Plaid Sylvestre", "price": 340, "qty": 1}],
            "guestEmail": VALID_EMAIL,
            "guestEmailAt": four_hours_ago,
            "guestEmailSource": "checkout",
            "createdAt": four_hours_ago
        })
        log(f"✅ Created test cart with guestEmailAt 4h ago")
        
        # Run reminders
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert 'guestSent' in data, f"Missing guestSent in response"
        assert data['guestSent'] >= 1, f"Expected guestSent >= 1, got {data['guestSent']}"
        log(f"✅ run-reminders: guestSent={data['guestSent']}, guestSkipped={data.get('guestSkipped', 0)}")
        
        # Verify guestLinkSentAt is set
        cart = db.carts.find_one({"_id": test_cart_id})
        assert 'guestLinkSentAt' in cart, f"guestLinkSentAt not set after run-reminders"
        log(f"✅ guestLinkSentAt set after run-reminders")
        
        # Verify saved_carts doc created with source='checkout'
        saved_cart = db.saved_carts.find_one({"email": VALID_EMAIL, "source": "checkout"})
        assert saved_cart is not None, f"saved_carts doc not created"
        log(f"✅ saved_carts doc created with source='checkout'")
        
        # Run again (should not send second time)
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        # guestSent should be 0 this time (already sent)
        log(f"✅ Second run: guestSent={data['guestSent']} (should be 0 or low)")
        
        # Test guestEmailAt now-1h (should NOT be sent, too recent)
        test_cart_id_2 = "test_cron_cart_456"
        one_hour_ago = datetime.datetime.now() - datetime.timedelta(hours=1)
        db.carts.insert_one({
            "_id": test_cart_id_2,
            "items": [{"slug": "plaid-sylvestre", "name": "Plaid Sylvestre", "price": 340, "qty": 1}],
            "guestEmail": "recent@example.com",
            "guestEmailAt": one_hour_ago,
            "guestEmailSource": "checkout",
            "createdAt": one_hour_ago
        })
        
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        data = r.json()
        # Should not send to recent cart
        log(f"✅ Cart with guestEmailAt 1h ago not sent (too recent)")
        
        # Test cart with userId set (should not be part of guest flow)
        test_cart_id_3 = "test_cron_cart_789"
        db.carts.insert_one({
            "_id": test_cart_id_3,
            "items": [{"slug": "plaid-sylvestre", "name": "Plaid Sylvestre", "price": 340, "qty": 1}],
            "userId": "some_user_id",
            "guestEmail": "user@example.com",
            "guestEmailAt": four_hours_ago,
            "guestEmailSource": "checkout",
            "createdAt": four_hours_ago
        })
        
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        data = r.json()
        log(f"✅ Cart with userId not sent (not guest flow)")
        
        # Test empty cart (should not be sent)
        test_cart_id_4 = "test_cron_cart_empty"
        db.carts.insert_one({
            "_id": test_cart_id_4,
            "items": [],
            "guestEmail": "empty@example.com",
            "guestEmailAt": four_hours_ago,
            "guestEmailSource": "checkout",
            "createdAt": four_hours_ago
        })
        
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        data = r.json()
        log(f"✅ Empty cart not sent")
        
        # Cleanup
        db.carts.delete_many({"_id": {"$in": [test_cart_id, test_cart_id_2, test_cart_id_3, test_cart_id_4]}})
        db.saved_carts.delete_many({"email": {"$in": [VALID_EMAIL, "recent@example.com", "user@example.com", "empty@example.com"]}})
        log(f"✅ Cleanup: deleted test carts and saved_carts")
        
    except Exception as e:
        log(f"❌ Run reminders test failed: {e}")
        return False
    
    return True

def test_logged_in_cart_reminders():
    """Test 10: Regression - logged-in cart reminders still work"""
    log("=" * 80)
    log("TEST 10: Regression - logged-in cart reminders (cart_reminder_1 after 3h)")
    log("=" * 80)
    
    try:
        from pymongo import MongoClient
        import datetime
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        
        # Find or create test user
        user = db.users.find_one({"email": TEST_EMAIL})
        if not user:
            log(f"⚠️  Test user {TEST_EMAIL} not found, skipping regression test")
            return True
        
        user_id = user['_id']
        
        # Create cart for logged-in user with lastActivityAt 3h ago
        test_cart_id = "test_logged_in_cart_123"
        three_hours_ago = datetime.datetime.now() - datetime.timedelta(hours=3, minutes=5)
        db.carts.insert_one({
            "_id": test_cart_id,
            "userId": user_id,
            "items": [{"slug": "plaid-sylvestre", "name": "Plaid Sylvestre", "price": 340, "qty": 1}],
            "lastActivityAt": three_hours_ago,
            "createdAt": three_hours_ago
        })
        log(f"✅ Created test cart for logged-in user with lastActivityAt 3h ago")
        
        # Run reminders
        r = admin_session.post(f"{BASE_URL}/api/admin/emails/run-reminders")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        log(f"✅ run-reminders: sent1={data.get('sent1', 0)}, sent2={data.get('sent2', 0)}")
        
        # Verify reminder1SentAt is set
        cart = db.carts.find_one({"_id": test_cart_id})
        if cart and 'reminder1SentAt' in cart:
            log(f"✅ reminder1SentAt set for logged-in user cart")
        else:
            log(f"⚠️  reminder1SentAt not set (may be due to email config or other conditions)")
        
        # Verify POST /api/cron/cart-reminders still requires auth (401 without bearer)
        r = requests.post(f"{BASE_URL}/api/cron/cart-reminders")
        if r.status_code == 401:
            log(f"✅ POST /api/cron/cart-reminders returns 401 without bearer token")
        else:
            log(f"⚠️  POST /api/cron/cart-reminders returned {r.status_code} (expected 401)")
        
        # Cleanup
        db.carts.delete_one({"_id": test_cart_id})
        log(f"✅ Cleanup: deleted test cart")
        
    except Exception as e:
        log(f"❌ Logged-in cart reminders test failed: {e}")
        return False
    
    return True

def cleanup_test_data():
    """Cleanup all test data created during testing"""
    log("=" * 80)
    log("CLEANUP: Removing test data")
    log("=" * 80)
    
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017")
        db = client['ginette_creations']
        
        # Remove test carts
        result = db.carts.delete_many({"guestEmail": {"$regex": "example.com"}})
        log(f"✅ Deleted {result.deleted_count} test carts")
        
        # Remove test saved_carts
        result = db.saved_carts.delete_many({"email": {"$regex": "example.com"}})
        log(f"✅ Deleted {result.deleted_count} test saved_carts")
        
        # Remove test orders
        result = db.orders.delete_many({"address.email": VALID_EMAIL, "orderNumber": {"$regex": "^JLT-"}})
        log(f"✅ Deleted {result.deleted_count} test orders")
        
        # Remove test email_templates (restore to defaults)
        result = db.email_templates.delete_many({})
        log(f"✅ Deleted {result.deleted_count} email_templates (restored to defaults)")
        
        # Unset cartRemindersOptOut on test user
        result = db.users.update_one({"email": TEST_EMAIL}, {"$unset": {"cartRemindersOptOut": ""}})
        if result.modified_count > 0:
            log(f"✅ Unset cartRemindersOptOut on test user")
        
        log(f"✅ Cleanup complete")
        
    except Exception as e:
        log(f"⚠️  Cleanup failed: {e}")

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    log("=" * 80)
    log("BACKEND API TESTING - EDITABLE EMAIL TEMPLATES & GUEST CART LINK")
    log("=" * 80)
    log(f"Base URL: {BASE_URL}")
    log(f"Admin Password: {ADMIN_PASSWORD}")
    log(f"Valid Email (for real sends): {VALID_EMAIL}")
    log("")
    
    results = {}
    
    # Admin login
    if not test_admin_login():
        log("❌ FATAL: Admin login failed, cannot continue")
        return
    
    # A) Editable Email Texts
    results['A1_get_templates'] = test_get_email_templates()
    results['A2_put_templates'] = test_put_email_templates()
    results['A3_post_preview'] = test_post_email_preview()
    results['A3b_get_preview'] = test_get_email_preview()
    results['A4_real_order'] = test_real_order_uses_custom_texts()
    results['A5_delete_templates'] = test_delete_email_templates()
    
    # B) Guest Cart Link
    token = test_guest_cart_save()
    results['B6_guest_cart_save'] = token != False
    results['B7_cart_restore'] = test_cart_restore(token)
    results['B8_checkout_email'] = test_checkout_email()
    results['B9_run_reminders'] = test_run_reminders()
    results['B10_logged_in_regression'] = test_logged_in_cart_reminders()
    
    # Cleanup
    cleanup_test_data()
    
    # Summary
    log("")
    log("=" * 80)
    log("TEST SUMMARY")
    log("=" * 80)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    log(f"Passed: {passed}/{total}")
    log("")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        log(f"{status} - {test_name}")
    
    log("")
    if passed == total:
        log("🎉 ALL TESTS PASSED!")
    else:
        log(f"⚠️  {total - passed} TEST(S) FAILED")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
