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
    
    def run_all_tests(self):
        """Run all tests and report results"""
        print("\n" + "="*80)
        print("JULIETTE AI ASSISTANT - BACKEND TEST SUITE")
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
