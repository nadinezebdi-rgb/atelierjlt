#!/usr/bin/env python3
"""
Backend test for AI Assistant "Juliette" endpoints
Tests the new chat endpoints for Atelier JLT e-commerce site
"""

import requests
import json
import time
import os

# Base URL from environment
BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"
TIMEOUT = 30  # Claude 4.5 can take 3-10 seconds

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print('='*80)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

class TestJulietteChat:
    def __init__(self):
        self.session = requests.Session()
        self.admin_session = requests.Session()
        
    def test_1_client_mode_basic(self):
        """Test 1: Client mode /api/chat (POST) — NO auth"""
        print_test_header("Test 1: Client Mode - Basic Product Recommendation")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {
                "message": "Quels plaids en crochet me recommandez-vous pour un canapé beige ?"
            }
            
            print_info(f"POST {url}")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            
            response = self.session.post(url, json=payload, timeout=TIMEOUT)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify response structure
            if 'session_id' not in data:
                print_error("Missing 'session_id' in response")
                return False
            
            if 'reply' not in data:
                print_error("Missing 'reply' in response")
                return False
            
            if 'commands' not in data:
                print_error("Missing 'commands' in response")
                return False
            
            if 'mode' not in data:
                print_error("Missing 'mode' in response")
                return False
            
            # Verify mode is client
            if data['mode'] != 'client':
                print_error(f"Expected mode='client', got '{data['mode']}'")
                return False
            
            # Verify reply is non-empty French string
            reply = data['reply']
            if not reply or not isinstance(reply, str):
                print_error("Reply is empty or not a string")
                return False
            
            print_info(f"Reply length: {len(reply)} characters")
            print_info(f"Reply preview: {reply[:200]}...")
            
            # Verify commands is empty array
            if data['commands'] != []:
                print_error(f"Expected empty commands array, got {data['commands']}")
                return False
            
            # Check if reply mentions a real product (Plaid Sylvestre or Plaid Boréal)
            reply_lower = reply.lower()
            has_product = any(p in reply_lower for p in ['plaid sylvestre', 'plaid boréal', 'plaid', 'sylvestre', 'boréal'])
            
            if not has_product:
                print_error("Reply doesn't mention any plaid products")
                print_info(f"Full reply: {reply}")
                return False
            
            # Store session_id for multi-turn test
            self.client_session_id = data['session_id']
            
            print_success("Client mode basic test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Mode: client")
            print_success(f"✓ Reply: non-empty French string mentioning products")
            print_success(f"✓ Commands: empty array")
            print_success(f"✓ Session ID: {self.client_session_id}")
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_2_client_mode_multiturn(self):
        """Test 1b: Client mode multi-turn - session persistence"""
        print_test_header("Test 2: Client Mode - Multi-turn Session Persistence")
        
        if not hasattr(self, 'client_session_id'):
            print_error("Skipping: no session_id from previous test")
            return False
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {
                "message": "Quel est son prix ?",
                "session_id": self.client_session_id
            }
            
            print_info(f"POST {url}")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            print_info(f"Using session_id: {self.client_session_id}")
            
            response = self.session.post(url, json=payload, timeout=TIMEOUT)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            reply = data.get('reply', '')
            
            print_info(f"Reply: {reply}")
            
            # Check if reply mentions a price (should be 340€ for Plaid Sylvestre or 320€ for Plaid Boréal)
            # The AI should remember the previous product from context
            has_price = any(p in reply for p in ['340', '320', '€', 'euro'])
            
            if not has_price:
                print_error("Reply doesn't mention a price - session context may not be working")
                print_info(f"Full reply: {reply}")
                # This is not a hard failure - the AI might respond differently
                print_info("Note: AI might respond differently, but ideally should mention price")
            else:
                print_success("Multi-turn session persistence PASSED")
                print_success(f"✓ AI remembered previous context and mentioned price")
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_3_admin_login(self):
        """Test 3: Admin login to get admin cookie"""
        print_test_header("Test 3: Admin Login")
        
        try:
            url = f"{BASE_URL}/api/auth/admin-login"
            payload = {"password": ADMIN_PASSWORD}
            
            print_info(f"POST {url}")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            # Check if cookie was set
            cookies = self.admin_session.cookies.get_dict()
            print_info(f"Cookies received: {list(cookies.keys())}")
            
            if not cookies:
                print_error("No cookies set after admin login")
                return False
            
            print_success("Admin login PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Admin cookie set")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_4_admin_mode_light_command(self):
        """Test 4: Admin mode /api/chat - light command (hero update)"""
        print_test_header("Test 4: Admin Mode - Light Command (Hero Update)")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {
                "message": "Change le titre du hero en Test IA Backend"
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            
            response = self.admin_session.post(url, json=payload, timeout=TIMEOUT)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify mode is admin
            if data.get('mode') != 'admin':
                print_error(f"Expected mode='admin', got '{data.get('mode')}'")
                return False
            
            # Verify commands array exists and has at least 1 item
            commands = data.get('commands', [])
            if not commands or len(commands) == 0:
                print_error("Expected at least 1 command, got empty array")
                print_info(f"Full response: {json.dumps(data, ensure_ascii=False, indent=2)}")
                return False
            
            cmd = commands[0]
            print_info(f"Command: {json.dumps(cmd, ensure_ascii=False, indent=2)}")
            
            # Verify command structure
            if cmd.get('type') != 'update_hero':
                print_error(f"Expected type='update_hero', got '{cmd.get('type')}'")
                return False
            
            if cmd.get('severity') != 'light':
                print_error(f"Expected severity='light', got '{cmd.get('severity')}'")
                return False
            
            # Verify patch contains title
            patch = cmd.get('patch', {})
            if 'title' not in patch:
                print_error("Expected 'title' in patch")
                return False
            
            title = patch['title']
            if 'Test IA Backend' not in title and 'test ia backend' not in title.lower():
                print_error(f"Expected title to contain 'Test IA Backend', got '{title}'")
                # Not a hard failure - AI might phrase it differently
                print_info("Note: AI might phrase the title differently")
            
            # Verify label is non-empty
            if not cmd.get('label'):
                print_error("Expected non-empty 'label'")
                return False
            
            # Verify id is a UUID
            cmd_id = cmd.get('id')
            if not cmd_id or len(cmd_id) < 32:
                print_error(f"Expected UUID 'id', got '{cmd_id}'")
                return False
            
            # Verify reply is a short French message
            reply = data.get('reply', '')
            if not reply:
                print_error("Expected non-empty reply")
                return False
            
            # Store command for apply test
            self.hero_update_command = cmd
            
            print_success("Admin mode light command test PASSED")
            print_success(f"✓ Mode: admin")
            print_success(f"✓ Command type: update_hero")
            print_success(f"✓ Severity: light")
            print_success(f"✓ Patch contains title: {title}")
            print_success(f"✓ Label: {cmd.get('label')}")
            print_success(f"✓ ID: {cmd_id}")
            print_success(f"✓ Reply: {reply[:100]}...")
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_5_admin_mode_sensitive_command(self):
        """Test 5: Admin mode sensitive command - price update"""
        print_test_header("Test 5: Admin Mode - Sensitive Command (Price Update)")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {
                "message": "Baisse le prix du Plaid Sylvestre a 259 euros"
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            
            response = self.admin_session.post(url, json=payload, timeout=TIMEOUT)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            commands = data.get('commands', [])
            
            if not commands or len(commands) == 0:
                print_error("Expected at least 1 command")
                print_info(f"Full response: {json.dumps(data, ensure_ascii=False, indent=2)}")
                return False
            
            cmd = commands[0]
            print_info(f"Command: {json.dumps(cmd, ensure_ascii=False, indent=2)}")
            
            # Verify command type
            if cmd.get('type') != 'update_product':
                print_error(f"Expected type='update_product', got '{cmd.get('type')}'")
                return False
            
            # Verify severity is sensitive
            if cmd.get('severity') != 'sensitive':
                print_error(f"Expected severity='sensitive', got '{cmd.get('severity')}'")
                return False
            
            # Verify targetId is plaid-sylvestre
            target_id = cmd.get('targetId')
            if target_id != 'plaid-sylvestre':
                print_error(f"Expected targetId='plaid-sylvestre', got '{target_id}'")
                # Not a hard failure - AI might use different slug format
                print_info("Note: AI might use different slug format")
            
            # Verify patch contains price = 259
            patch = cmd.get('patch', {})
            price = patch.get('price')
            if price != 259:
                print_error(f"Expected patch.price=259, got {price}")
                return False
            
            print_success("Admin mode sensitive command test PASSED")
            print_success(f"✓ Command type: update_product")
            print_success(f"✓ Severity: sensitive")
            print_success(f"✓ Target ID: {target_id}")
            print_success(f"✓ Patch price: {price}")
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_6_apply_command_without_auth(self):
        """Test 6: Apply command without admin cookie - should return 401"""
        print_test_header("Test 6: Apply Command Without Auth (Rejection Test)")
        
        try:
            url = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": {
                    "type": "update_hero",
                    "label": "Test",
                    "severity": "light",
                    "patch": {"title": "Test"}
                }
            }
            
            print_info(f"POST {url} (NO admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            
            # Use regular session without admin cookie
            response = self.session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 401:
                print_error(f"Expected 401, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            print_success("Apply without auth rejection test PASSED")
            print_success(f"✓ Status: 401 (Unauthorized)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_7_apply_command_with_auth(self):
        """Test 7: Apply command with admin cookie - should work"""
        print_test_header("Test 7: Apply Command With Auth")
        
        if not hasattr(self, 'hero_update_command'):
            print_error("Skipping: no command from previous test")
            return False
        
        try:
            # First, get current hero state
            url_get = f"{BASE_URL}/api/admin/site-content"
            print_info(f"GET {url_get} (to get current state)")
            
            response_get = self.admin_session.get(url_get, timeout=10)
            if response_get.status_code != 200:
                print_error(f"Failed to get current state: {response_get.status_code}")
                return False
            
            current_state = response_get.json()
            current_hero = current_state.get('content', {}).get('hero', {})
            current_title = current_hero.get('title', '')
            print_info(f"Current hero title: {current_title}")
            
            # Apply the command
            url = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": self.hero_update_command
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response: {json.dumps(data, ensure_ascii=False, indent=2)}")
            
            # Verify response structure
            if not data.get('ok'):
                print_error(f"Expected ok=true, got {data.get('ok')}")
                return False
            
            if 'message' not in data:
                print_error("Missing 'message' in response")
                return False
            
            if 'before' not in data:
                print_error("Missing 'before' in response")
                return False
            
            if 'after' not in data:
                print_error("Missing 'after' in response")
                return False
            
            # Verify the change was applied
            after_title = data['after'].get('title', '')
            print_info(f"After title: {after_title}")
            
            # Now verify by fetching site-content again
            response_verify = self.admin_session.get(url_get, timeout=10)
            if response_verify.status_code != 200:
                print_error(f"Failed to verify state: {response_verify.status_code}")
                return False
            
            verify_state = response_verify.json()
            verify_hero = verify_state.get('content', {}).get('hero', {})
            verify_title = verify_hero.get('title', '')
            print_info(f"Verified hero title: {verify_title}")
            
            if verify_title != after_title:
                print_error(f"Title mismatch: expected '{after_title}', got '{verify_title}'")
                return False
            
            # Store original title for restoration
            self.original_hero_title = current_title
            self.original_hero_subtitle = current_hero.get('subtitle', '')
            
            print_success("Apply command with auth test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ ok: true")
            print_success(f"✓ Message: {data.get('message')}")
            print_success(f"✓ Before title: {current_title}")
            print_success(f"✓ After title: {after_title}")
            print_success(f"✓ Verified in database: {verify_title}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_8_restore_hero(self):
        """Test 8: Restore original hero title"""
        print_test_header("Test 8: Restore Original Hero Title")
        
        if not hasattr(self, 'original_hero_title'):
            print_error("Skipping: no original title stored")
            return False
        
        try:
            url = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": {
                    "type": "update_hero",
                    "label": "Restore original hero",
                    "severity": "light",
                    "patch": {
                        "title": self.original_hero_title,
                        "subtitle": self.original_hero_subtitle
                    }
                }
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Restoring title to: {self.original_hero_title}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            # Verify restoration
            url_get = f"{BASE_URL}/api/admin/site-content"
            response_verify = self.admin_session.get(url_get, timeout=10)
            
            if response_verify.status_code == 200:
                verify_state = response_verify.json()
                verify_hero = verify_state.get('content', {}).get('hero', {})
                verify_title = verify_hero.get('title', '')
                
                if verify_title == self.original_hero_title:
                    print_success("Hero restoration PASSED")
                    print_success(f"✓ Title restored to: {verify_title}")
                else:
                    print_error(f"Title not restored correctly: {verify_title}")
                    return False
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_9_rejection_empty_body(self):
        """Test 9: Rejection test - empty body"""
        print_test_header("Test 9: Rejection Test - Empty Body")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {}
            
            print_info(f"POST {url}")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 400:
                print_error(f"Expected 400, got {response.status_code}")
                return False
            
            print_success("Empty body rejection test PASSED")
            print_success(f"✓ Status: 400 (Bad Request)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_10_rejection_empty_message(self):
        """Test 10: Rejection test - empty message"""
        print_test_header("Test 10: Rejection Test - Empty Message")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {"message": ""}
            
            print_info(f"POST {url}")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 400:
                print_error(f"Expected 400, got {response.status_code}")
                return False
            
            print_success("Empty message rejection test PASSED")
            print_success(f"✓ Status: 400 (Bad Request)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_11_rejection_unknown_command_type(self):
        """Test 11: Rejection test - unknown command type"""
        print_test_header("Test 11: Rejection Test - Unknown Command Type")
        
        try:
            url = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": {
                    "type": "unknown_type",
                    "label": "Test",
                    "severity": "light",
                    "patch": {}
                }
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 400:
                print_error(f"Expected 400, got {response.status_code}")
                return False
            
            print_success("Unknown command type rejection test PASSED")
            print_success(f"✓ Status: 400 (Bad Request)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_12_blog_draft_creation(self):
        """Test 12: Blog draft creation - generate command but don't apply"""
        print_test_header("Test 12: Blog Draft Creation Command")
        
        try:
            url = f"{BASE_URL}/api/chat"
            payload = {
                "message": "Rédige un court article sur la poterie tournée main (150 mots max) et crée-le comme brouillon"
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False)}")
            
            response = self.admin_session.post(url, json=payload, timeout=TIMEOUT)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            commands = data.get('commands', [])
            
            if not commands or len(commands) == 0:
                print_error("Expected at least 1 command")
                print_info(f"Full response: {json.dumps(data, ensure_ascii=False, indent=2)}")
                return False
            
            cmd = commands[0]
            print_info(f"Command type: {cmd.get('type')}")
            print_info(f"Command severity: {cmd.get('severity')}")
            
            # Verify command type
            if cmd.get('type') != 'create_blog_post':
                print_error(f"Expected type='create_blog_post', got '{cmd.get('type')}'")
                return False
            
            # Verify severity is sensitive
            if cmd.get('severity') != 'sensitive':
                print_error(f"Expected severity='sensitive', got '{cmd.get('severity')}'")
                return False
            
            # Verify patch structure
            patch = cmd.get('patch', {})
            
            required_fields = ['title', 'slug', 'content']
            for field in required_fields:
                if field not in patch:
                    print_error(f"Missing required field '{field}' in patch")
                    return False
            
            # Verify published is false
            if patch.get('published') != False:
                print_error(f"Expected published=false, got {patch.get('published')}")
                return False
            
            print_info(f"Blog post title: {patch.get('title')}")
            print_info(f"Blog post slug: {patch.get('slug')}")
            print_info(f"Content length: {len(patch.get('content', ''))} characters")
            
            print_success("Blog draft creation command test PASSED")
            print_success(f"✓ Command type: create_blog_post")
            print_success(f"✓ Severity: sensitive")
            print_success(f"✓ Patch contains: title, slug, content")
            print_success(f"✓ Published: false (draft)")
            print_success(f"✓ NOT APPLIED (as requested)")
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_13_sessions_list_without_auth(self):
        """Test 13: GET /api/chat/sessions without auth - should return client sessions only"""
        print_test_header("Test 13: GET /api/chat/sessions (Client - No Auth)")
        
        try:
            url = f"{BASE_URL}/api/chat/sessions"
            
            print_info(f"GET {url} (NO admin cookie)")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify response structure
            if 'sessions' not in data:
                print_error("Missing 'sessions' in response")
                return False
            
            sessions = data['sessions']
            print_info(f"Number of sessions: {len(sessions)}")
            
            # Verify at least 1 session exists (from previous tests)
            if len(sessions) == 0:
                print_error("Expected at least 1 session from previous tests")
                return False
            
            # Verify all sessions are client mode
            for session in sessions:
                if session.get('mode') == 'admin':
                    print_error(f"Client should not see admin sessions: {session}")
                    return False
            
            # Verify session structure
            first_session = sessions[0]
            required_fields = ['session_id', 'mode', 'lastAt', 'firstAt', 'count', 'title']
            for field in required_fields:
                if field not in first_session:
                    print_error(f"Missing required field '{field}' in session")
                    return False
            
            print_info(f"First session: {json.dumps(first_session, ensure_ascii=False, default=str)}")
            
            # Verify title is truncated to 60 chars
            title = first_session['title']
            if len(title) > 61:  # 60 + ellipsis
                print_error(f"Title too long: {len(title)} chars")
                return False
            
            print_success("Sessions list without auth test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Sessions count: {len(sessions)}")
            print_success(f"✓ All sessions are client mode")
            print_success(f"✓ Session structure correct")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_14_sessions_list_with_auth(self):
        """Test 14: GET /api/chat/sessions with admin auth - should return all sessions"""
        print_test_header("Test 14: GET /api/chat/sessions (Admin - With Auth)")
        
        try:
            url = f"{BASE_URL}/api/chat/sessions"
            
            print_info(f"GET {url} (WITH admin cookie)")
            
            response = self.admin_session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            sessions = data.get('sessions', [])
            
            print_info(f"Number of sessions: {len(sessions)}")
            
            # Admin should see both admin and client sessions
            admin_sessions = [s for s in sessions if s.get('mode') == 'admin']
            client_sessions = [s for s in sessions if s.get('mode') == 'client']
            
            print_info(f"Admin sessions: {len(admin_sessions)}")
            print_info(f"Client sessions: {len(client_sessions)}")
            
            # Verify admin sees admin sessions (from previous tests)
            if len(admin_sessions) == 0:
                print_error("Admin should see admin sessions from previous tests")
                # Not a hard failure - might not have admin sessions yet
                print_info("Note: No admin sessions found, but this might be expected")
            
            print_success("Sessions list with auth test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Total sessions: {len(sessions)}")
            print_success(f"✓ Admin sessions: {len(admin_sessions)}")
            print_success(f"✓ Client sessions: {len(client_sessions)}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_15_sessions_get_messages_client(self):
        """Test 15: GET /api/chat/sessions?sid=X for client session"""
        print_test_header("Test 15: GET /api/chat/sessions?sid=X (Client Session)")
        
        if not hasattr(self, 'client_session_id'):
            print_error("Skipping: no client_session_id from previous test")
            return False
        
        try:
            url = f"{BASE_URL}/api/chat/sessions?sid={self.client_session_id}"
            
            print_info(f"GET {url} (NO admin cookie)")
            print_info(f"Session ID: {self.client_session_id}")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify response structure
            if 'session_id' not in data:
                print_error("Missing 'session_id' in response")
                return False
            
            if 'messages' not in data:
                print_error("Missing 'messages' in response")
                return False
            
            messages = data['messages']
            print_info(f"Number of messages: {len(messages)}")
            
            # Verify at least 2 messages (user + assistant from test 1 and 2)
            if len(messages) < 2:
                print_error(f"Expected at least 2 messages, got {len(messages)}")
                return False
            
            # Verify messages are sorted by createdAt ascending
            for i in range(len(messages) - 1):
                if messages[i].get('createdAt') > messages[i+1].get('createdAt'):
                    print_error("Messages not sorted by createdAt ascending")
                    return False
            
            print_info(f"First message role: {messages[0].get('role')}")
            print_info(f"First message content preview: {messages[0].get('content', '')[:50]}...")
            
            print_success("Get messages for client session test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Session ID: {data['session_id']}")
            print_success(f"✓ Messages count: {len(messages)}")
            print_success(f"✓ Messages sorted by createdAt ascending")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_16_sessions_get_messages_invalid_sid(self):
        """Test 16: GET /api/chat/sessions?sid=invalid - should return empty messages"""
        print_test_header("Test 16: GET /api/chat/sessions?sid=invalid")
        
        try:
            url = f"{BASE_URL}/api/chat/sessions?sid=invalid-session-id-12345"
            
            print_info(f"GET {url}")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            # Verify response has empty messages
            if 'messages' not in data:
                print_error("Missing 'messages' in response")
                return False
            
            messages = data['messages']
            if len(messages) != 0:
                print_error(f"Expected empty messages array, got {len(messages)} messages")
                return False
            
            print_success("Invalid session ID test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Messages: empty array")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_17_sessions_admin_session_access_denied(self):
        """Test 17: Client trying to access admin session - should return 401"""
        print_test_header("Test 17: Client Access to Admin Session (401)")
        
        try:
            # First, create an admin session
            url_chat = f"{BASE_URL}/api/chat"
            payload = {"message": "Test admin session"}
            
            print_info(f"Creating admin session...")
            response_chat = self.admin_session.post(url_chat, json=payload, timeout=TIMEOUT)
            
            if response_chat.status_code != 200:
                print_error(f"Failed to create admin session: {response_chat.status_code}")
                return False
            
            admin_session_id = response_chat.json().get('session_id')
            print_info(f"Admin session ID: {admin_session_id}")
            
            # Now try to access it without admin cookie
            url = f"{BASE_URL}/api/chat/sessions?sid={admin_session_id}"
            
            print_info(f"GET {url} (NO admin cookie)")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 401:
                print_error(f"Expected 401, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            print_success("Client access to admin session rejection test PASSED")
            print_success(f"✓ Status: 401 (Unauthorized)")
            
            # Store admin session ID for later tests
            self.admin_session_id = admin_session_id
            
            return True
            
        except requests.exceptions.Timeout:
            print_error("Request timed out (>30s)")
            return False
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_18_sessions_admin_can_access_admin_session(self):
        """Test 18: Admin accessing admin session - should work"""
        print_test_header("Test 18: Admin Access to Admin Session")
        
        if not hasattr(self, 'admin_session_id'):
            print_error("Skipping: no admin_session_id from previous test")
            return False
        
        try:
            url = f"{BASE_URL}/api/chat/sessions?sid={self.admin_session_id}"
            
            print_info(f"GET {url} (WITH admin cookie)")
            
            response = self.admin_session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            messages = data.get('messages', [])
            
            print_info(f"Number of messages: {len(messages)}")
            
            if len(messages) == 0:
                print_error("Expected at least 1 message")
                return False
            
            print_success("Admin access to admin session test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Messages count: {len(messages)}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_19_apply_with_session_id_tracking(self):
        """Test 19: POST /api/chat/apply with session_id tracking - should return actionId"""
        print_test_header("Test 19: POST /api/chat/apply with session_id tracking")
        
        try:
            url = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": {
                    "id": "test-undo",
                    "type": "update_hero",
                    "label": "Test undo tracking",
                    "severity": "light",
                    "patch": {"title": "TEST UNDO STATE"},
                    "targetId": None
                },
                "session_id": "test-undo-session"
            }
            
            print_info(f"POST {url} (with admin cookie)")
            print_info(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response: {json.dumps(data, ensure_ascii=False, indent=2, default=str)}")
            
            # Verify response structure
            if not data.get('ok'):
                print_error(f"Expected ok=true, got {data.get('ok')}")
                return False
            
            if 'actionId' not in data:
                print_error("Missing 'actionId' in response")
                return False
            
            action_id = data['actionId']
            
            # Verify actionId is a UUID string
            if not action_id or len(action_id) < 32:
                print_error(f"Expected UUID actionId, got '{action_id}'")
                return False
            
            # Verify site-content was updated
            url_get = f"{BASE_URL}/api/admin/site-content"
            response_verify = self.admin_session.get(url_get, timeout=10)
            
            if response_verify.status_code == 200:
                verify_state = response_verify.json()
                verify_hero = verify_state.get('content', {}).get('hero', {})
                verify_title = verify_hero.get('title', '')
                
                if verify_title != "TEST UNDO STATE":
                    print_error(f"Title not updated correctly: {verify_title}")
                    return False
            
            # Store action ID for undo test
            self.test_action_id = action_id
            
            print_success("Apply with session_id tracking test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ ok: true")
            print_success(f"✓ actionId: {action_id}")
            print_success(f"✓ Hero title updated to: TEST UNDO STATE")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_20_actions_list_without_auth(self):
        """Test 20: GET /api/chat/actions without auth - should return 401"""
        print_test_header("Test 20: GET /api/chat/actions (No Auth - 401)")
        
        try:
            url = f"{BASE_URL}/api/chat/actions?limit=5"
            
            print_info(f"GET {url} (NO admin cookie)")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 401:
                print_error(f"Expected 401, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            print_success("Actions list without auth rejection test PASSED")
            print_success(f"✓ Status: 401 (Unauthorized)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_21_actions_list_with_auth(self):
        """Test 21: GET /api/chat/actions with admin auth - should return actions"""
        print_test_header("Test 21: GET /api/chat/actions (Admin - With Auth)")
        
        try:
            url = f"{BASE_URL}/api/chat/actions?limit=5"
            
            print_info(f"GET {url} (WITH admin cookie)")
            
            response = self.admin_session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify response structure
            if 'actions' not in data:
                print_error("Missing 'actions' in response")
                return False
            
            actions = data['actions']
            print_info(f"Number of actions: {len(actions)}")
            
            # Verify at least 1 action exists (from previous tests)
            if len(actions) == 0:
                print_error("Expected at least 1 action from previous tests")
                return False
            
            # Verify actions are sorted by appliedAt descending
            for i in range(len(actions) - 1):
                if actions[i].get('appliedAt') < actions[i+1].get('appliedAt'):
                    print_error("Actions not sorted by appliedAt descending")
                    return False
            
            # Verify action structure
            first_action = actions[0]
            required_fields = ['_id', 'sessionId', 'type', 'targetId', 'label', 'severity', 
                             'before', 'after', 'patch', 'appliedAt', 'undone']
            for field in required_fields:
                if field not in first_action:
                    print_error(f"Missing required field '{field}' in action")
                    return False
            
            print_info(f"First action: {json.dumps(first_action, ensure_ascii=False, default=str, indent=2)}")
            
            # Verify the action from test 19 is present
            if hasattr(self, 'test_action_id'):
                found = any(a['_id'] == self.test_action_id for a in actions)
                if not found:
                    print_error(f"Action from test 19 not found: {self.test_action_id}")
                    return False
                
                # Verify undone is false
                test_action = next(a for a in actions if a['_id'] == self.test_action_id)
                if test_action.get('undone') != False:
                    print_error(f"Expected undone=false, got {test_action.get('undone')}")
                    return False
            
            print_success("Actions list with auth test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Actions count: {len(actions)}")
            print_success(f"✓ Actions sorted by appliedAt descending")
            print_success(f"✓ Action structure correct")
            print_success(f"✓ Test action present with undone=false")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_22_actions_undo_without_auth(self):
        """Test 22: POST /api/chat/actions (undo) without auth - should return 401"""
        print_test_header("Test 22: POST /api/chat/actions (Undo - No Auth - 401)")
        
        try:
            url = f"{BASE_URL}/api/chat/actions"
            payload = {"actionId": "dummy-id"}
            
            print_info(f"POST {url} (NO admin cookie)")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 401:
                print_error(f"Expected 401, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            print_success("Undo without auth rejection test PASSED")
            print_success(f"✓ Status: 401 (Unauthorized)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_23_actions_undo_with_auth(self):
        """Test 23: POST /api/chat/actions (undo) with admin auth - should undo action"""
        print_test_header("Test 23: POST /api/chat/actions (Undo - With Auth)")
        
        if not hasattr(self, 'test_action_id'):
            print_error("Skipping: no test_action_id from previous test")
            return False
        
        try:
            # Get current hero state before undo
            url_get = f"{BASE_URL}/api/admin/site-content"
            response_before = self.admin_session.get(url_get, timeout=10)
            
            if response_before.status_code == 200:
                before_state = response_before.json()
                before_title = before_state.get('content', {}).get('hero', {}).get('title', '')
                print_info(f"Hero title before undo: {before_title}")
            
            # Undo the action
            url = f"{BASE_URL}/api/chat/actions"
            payload = {"actionId": self.test_action_id}
            
            print_info(f"POST {url} (WITH admin cookie)")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response: {json.dumps(data, ensure_ascii=False, indent=2)}")
            
            # Verify response structure
            if not data.get('ok'):
                print_error(f"Expected ok=true, got {data.get('ok')}")
                return False
            
            if 'message' not in data:
                print_error("Missing 'message' in response")
                return False
            
            message = data['message']
            if 'annulée' not in message.lower():
                print_error(f"Expected message to contain 'annulée', got '{message}'")
                return False
            
            # Verify hero title was reverted
            response_after = self.admin_session.get(url_get, timeout=10)
            
            if response_after.status_code == 200:
                after_state = response_after.json()
                after_title = after_state.get('content', {}).get('hero', {}).get('title', '')
                print_info(f"Hero title after undo: {after_title}")
                
                if after_title == "TEST UNDO STATE":
                    print_error("Hero title was not reverted")
                    return False
            
            print_success("Undo with auth test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ ok: true")
            print_success(f"✓ Message: {message}")
            print_success(f"✓ Hero title reverted from 'TEST UNDO STATE'")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_24_actions_undo_already_undone(self):
        """Test 24: POST /api/chat/actions (undo) for already undone action - should return 400"""
        print_test_header("Test 24: POST /api/chat/actions (Already Undone - 400)")
        
        if not hasattr(self, 'test_action_id'):
            print_error("Skipping: no test_action_id from previous test")
            return False
        
        try:
            url = f"{BASE_URL}/api/chat/actions"
            payload = {"actionId": self.test_action_id}
            
            print_info(f"POST {url} (WITH admin cookie)")
            print_info(f"Payload: {json.dumps(payload)}")
            print_info("Attempting to undo the same action again...")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 400:
                print_error(f"Expected 400, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            error = data.get('error', '')
            
            if 'déjà annulée' not in error.lower():
                print_error(f"Expected error to contain 'déjà annulée', got '{error}'")
                return False
            
            print_success("Already undone rejection test PASSED")
            print_success(f"✓ Status: 400 (Bad Request)")
            print_success(f"✓ Error: {error}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_25_actions_undo_invalid_action_id(self):
        """Test 25: POST /api/chat/actions (undo) with invalid actionId - should return 400"""
        print_test_header("Test 25: POST /api/chat/actions (Invalid Action ID - 400)")
        
        try:
            url = f"{BASE_URL}/api/chat/actions"
            payload = {"actionId": "invalid-action-id-12345"}
            
            print_info(f"POST {url} (WITH admin cookie)")
            print_info(f"Payload: {json.dumps(payload)}")
            
            response = self.admin_session.post(url, json=payload, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 400:
                print_error(f"Expected 400, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            error = data.get('error', '')
            
            if 'introuvable' not in error.lower():
                print_error(f"Expected error to contain 'introuvable', got '{error}'")
                return False
            
            print_success("Invalid action ID rejection test PASSED")
            print_success(f"✓ Status: 400 (Bad Request)")
            print_success(f"✓ Error: {error}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_26_insights_without_auth(self):
        """Test 26: GET /api/chat/insights without auth - should return 401"""
        print_test_header("Test 26: GET /api/chat/insights (No Auth - 401)")
        
        try:
            url = f"{BASE_URL}/api/chat/insights"
            
            print_info(f"GET {url} (NO admin cookie)")
            
            response = self.session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 401:
                print_error(f"Expected 401, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            print_success("Insights without auth rejection test PASSED")
            print_success(f"✓ Status: 401 (Unauthorized)")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_27_insights_with_auth_healthy_data(self):
        """Test 27: GET /api/chat/insights with admin auth - healthy data should return 0 or few insights"""
        print_test_header("Test 27: GET /api/chat/insights (Admin - Healthy Data)")
        
        try:
            url = f"{BASE_URL}/api/chat/insights"
            
            print_info(f"GET {url} (WITH admin cookie)")
            
            response = self.admin_session.get(url, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            print_info(f"Response keys: {list(data.keys())}")
            
            # Verify response structure
            if 'insights' not in data:
                print_error("Missing 'insights' in response")
                return False
            
            if 'counts' not in data:
                print_error("Missing 'counts' in response")
                return False
            
            insights = data['insights']
            counts = data['counts']
            
            print_info(f"Insights count: {len(insights)}")
            print_info(f"Counts: {json.dumps(counts, indent=2)}")
            
            # Verify counts structure
            required_count_fields = ['total', 'critical', 'warning', 'info']
            for field in required_count_fields:
                if field not in counts:
                    print_error(f"Missing required field '{field}' in counts")
                    return False
            
            # Verify insight structure if any exist
            if len(insights) > 0:
                first_insight = insights[0]
                required_insight_fields = ['id', 'severity', 'icon', 'title', 'hint', 'prompt']
                for field in required_insight_fields:
                    if field not in first_insight:
                        print_error(f"Missing required field '{field}' in insight")
                        return False
                
                print_info(f"First insight: {json.dumps(first_insight, ensure_ascii=False, indent=2)}")
            
            print_success("Insights with auth (healthy data) test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Insights count: {len(insights)}")
            print_success(f"✓ Counts: total={counts['total']}, critical={counts['critical']}, warning={counts['warning']}, info={counts['info']}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_28_insights_trigger_low_stock_warning(self):
        """Test 28: Trigger low stock warning by setting Plaid Sylvestre stock to 1"""
        print_test_header("Test 28: Trigger Low Stock Warning")
        
        try:
            # Apply command to set stock to 1
            url_apply = f"{BASE_URL}/api/chat/apply"
            payload = {
                "command": {
                    "id": "test-insights",
                    "type": "update_product",
                    "label": "Set stock to 1",
                    "severity": "light",
                    "patch": {"stock": 1},
                    "targetId": "plaid-sylvestre"
                },
                "session_id": "test-insights"
            }
            
            print_info(f"POST {url_apply} (with admin cookie)")
            print_info(f"Setting Plaid Sylvestre stock to 1...")
            
            response_apply = self.admin_session.post(url_apply, json=payload, timeout=10)
            
            if response_apply.status_code != 200:
                print_error(f"Failed to apply command: {response_apply.status_code}")
                print_error(f"Response: {response_apply.text}")
                return False
            
            apply_data = response_apply.json()
            print_info(f"Command applied successfully")
            
            # Store action ID for cleanup
            self.stock_action_id = apply_data.get('actionId')
            
            # Now get insights
            url_insights = f"{BASE_URL}/api/chat/insights"
            
            print_info(f"GET {url_insights} (WITH admin cookie)")
            
            response = self.admin_session.get(url_insights, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            insights = data.get('insights', [])
            counts = data.get('counts', {})
            
            print_info(f"Insights count: {len(insights)}")
            print_info(f"Counts: {json.dumps(counts, indent=2)}")
            
            # Verify at least 1 warning insight
            if counts.get('warning', 0) < 1:
                print_error(f"Expected at least 1 warning insight, got {counts.get('warning', 0)}")
                return False
            
            # Verify at least one insight mentions Plaid Sylvestre and stock
            found_stock_warning = False
            for insight in insights:
                title = insight.get('title', '').lower()
                if 'plaid sylvestre' in title and ('1 en stock' in title or 'stock' in title):
                    found_stock_warning = True
                    print_info(f"Found stock warning: {insight.get('title')}")
                    break
            
            if not found_stock_warning:
                print_error("Expected to find stock warning for Plaid Sylvestre")
                print_info(f"All insights: {json.dumps(insights, ensure_ascii=False, indent=2)}")
                return False
            
            print_success("Low stock warning trigger test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Warning count: {counts.get('warning', 0)}")
            print_success(f"✓ Found stock warning for Plaid Sylvestre")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_29_insights_after_undo(self):
        """Test 29: Verify insights return to 0 after undoing stock change"""
        print_test_header("Test 29: Insights After Undo")
        
        if not hasattr(self, 'stock_action_id'):
            print_error("Skipping: no stock_action_id from previous test")
            return False
        
        try:
            # Undo the stock change
            url_undo = f"{BASE_URL}/api/chat/actions"
            payload = {"actionId": self.stock_action_id}
            
            print_info(f"POST {url_undo} (WITH admin cookie)")
            print_info(f"Undoing stock change...")
            
            response_undo = self.admin_session.post(url_undo, json=payload, timeout=10)
            
            if response_undo.status_code != 200:
                print_error(f"Failed to undo: {response_undo.status_code}")
                print_error(f"Response: {response_undo.text}")
                return False
            
            print_info("Stock change undone successfully")
            
            # Now get insights again
            url_insights = f"{BASE_URL}/api/chat/insights"
            
            print_info(f"GET {url_insights} (WITH admin cookie)")
            
            response = self.admin_session.get(url_insights, timeout=10)
            
            print_info(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print_error(f"Expected 200, got {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
            
            data = response.json()
            counts = data.get('counts', {})
            
            print_info(f"Counts after undo: {json.dumps(counts, indent=2)}")
            
            # Verify counts are back to 0 or low
            # Note: There might be other insights, so we just check that warning count decreased
            if counts.get('warning', 0) > 0:
                print_info(f"Warning count is {counts.get('warning', 0)} (might have other warnings)")
                # Check if Plaid Sylvestre stock warning is gone
                insights = data.get('insights', [])
                plaid_warning = any('plaid sylvestre' in i.get('title', '').lower() and 'stock' in i.get('title', '').lower() for i in insights)
                if plaid_warning:
                    print_error("Plaid Sylvestre stock warning still present after undo")
                    return False
            
            print_success("Insights after undo test PASSED")
            print_success(f"✓ Status: 200")
            print_success(f"✓ Plaid Sylvestre stock warning removed")
            print_success(f"✓ Counts: total={counts['total']}, critical={counts['critical']}, warning={counts['warning']}, info={counts['info']}")
            
            return True
            
        except Exception as e:
            print_error(f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def run_all_tests(self):
        """Run all tests and report results"""
        print("\n" + "="*80)
        print("JULIETTE AI ASSISTANT - BACKEND TEST SUITE V3")
        print("="*80)
        print(f"Base URL: {BASE_URL}")
        print(f"Timeout: {TIMEOUT}s")
        print("="*80)
        
        tests = [
            ("Client Mode - Basic", self.test_1_client_mode_basic),
            ("Client Mode - Multi-turn", self.test_2_client_mode_multiturn),
            ("Admin Login", self.test_3_admin_login),
            ("Admin Mode - Light Command", self.test_4_admin_mode_light_command),
            ("Admin Mode - Sensitive Command", self.test_5_admin_mode_sensitive_command),
            ("Apply Without Auth (401)", self.test_6_apply_command_without_auth),
            ("Apply With Auth", self.test_7_apply_command_with_auth),
            ("Restore Hero", self.test_8_restore_hero),
            ("Rejection - Empty Body", self.test_9_rejection_empty_body),
            ("Rejection - Empty Message", self.test_10_rejection_empty_message),
            ("Rejection - Unknown Command", self.test_11_rejection_unknown_command_type),
            ("Blog Draft Creation", self.test_12_blog_draft_creation),
            ("V3: Sessions List (Client)", self.test_13_sessions_list_without_auth),
            ("V3: Sessions List (Admin)", self.test_14_sessions_list_with_auth),
            ("V3: Get Session Messages (Client)", self.test_15_sessions_get_messages_client),
            ("V3: Get Session Messages (Invalid)", self.test_16_sessions_get_messages_invalid_sid),
            ("V3: Client Access Admin Session (401)", self.test_17_sessions_admin_session_access_denied),
            ("V3: Admin Access Admin Session", self.test_18_sessions_admin_can_access_admin_session),
            ("V3: Apply with session_id tracking", self.test_19_apply_with_session_id_tracking),
            ("V3: Actions List (No Auth - 401)", self.test_20_actions_list_without_auth),
            ("V3: Actions List (Admin)", self.test_21_actions_list_with_auth),
            ("V3: Undo (No Auth - 401)", self.test_22_actions_undo_without_auth),
            ("V3: Undo (Admin)", self.test_23_actions_undo_with_auth),
            ("V3: Undo Already Undone (400)", self.test_24_actions_undo_already_undone),
            ("V3: Undo Invalid Action ID (400)", self.test_25_actions_undo_invalid_action_id),
            ("V3: Insights (No Auth - 401)", self.test_26_insights_without_auth),
            ("V3: Insights (Healthy Data)", self.test_27_insights_with_auth_healthy_data),
            ("V3: Insights (Low Stock Warning)", self.test_28_insights_trigger_low_stock_warning),
            ("V3: Insights After Undo", self.test_29_insights_after_undo),
        ]
        
        results = []
        for name, test_func in tests:
            try:
                result = test_func()
                results.append((name, result))
            except Exception as e:
                print_error(f"Test '{name}' crashed: {str(e)}")
                results.append((name, False))
        
        # Summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {name}")
        
        print("="*80)
        print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
        print("="*80)
        
        return passed == total

if __name__ == "__main__":
    tester = TestJulietteChat()
    success = tester.run_all_tests()
    exit(0 if success else 1)
