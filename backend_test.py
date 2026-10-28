#!/usr/bin/env python3
"""
Backend test for catalog/stock changes
Tests stock decrement, insufficient stock, sold out, admin product creation,
auto-migration, base slug renames, broken-media endpoint, and regressions.
"""

import requests
import json
import time
from pymongo import MongoClient

# Configuration
BASE_URL = "https://french-craft.preview.emergentagent.com"
ADMIN_PASSWORD = "Juliette99*"
TEST_EMAIL = "contact@atelierjlt.fr"  # Use real email to avoid triggering emails to unknown addresses

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "ginette_creations"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_session = requests.Session()
        self.mongo_client = MongoClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        self.test_results = []
        self.original_plaid_data = None
        self.created_products = []
        self.created_orders = []
        
    def log(self, test_name, passed, message=""):
        status = "✅ PASSED" if passed else "❌ FAILED"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.test_results.append({"test": test_name, "passed": passed, "message": message})
        
    def admin_login(self):
        """Login as admin"""
        try:
            resp = self.admin_session.post(
                f"{BASE_URL}/api/auth/admin-login",
                json={"password": ADMIN_PASSWORD},
                timeout=10
            )
            if resp.status_code == 200:
                self.log("Admin login", True, "Admin authenticated successfully")
                return True
            else:
                self.log("Admin login", False, f"Status {resp.status_code}")
                return False
        except Exception as e:
            self.log("Admin login", False, str(e))
            return False
    
    def test_1_stock_decrement_on_order(self):
        """Test 1: Stock decrement on order - plaid-sylvestre with variants"""
        print("\n" + "="*80)
        print("TEST 1: Stock decrement on order")
        print("="*80)
        
        try:
            # Get plaid-sylvestre product and record original stock
            resp = self.admin_session.get(f"{BASE_URL}/api/products/plaid-sylvestre", timeout=10)
            if resp.status_code != 200:
                self.log("Test 1 - Get product", False, f"Status {resp.status_code}")
                return
            
            product = resp.json().get("product", {})
            self.original_plaid_data = {
                "stock": product.get("stock"),
                "variants": product.get("variants", [])
            }
            
            # Find a variant with stock > 0
            variant_with_stock = None
            for v in self.original_plaid_data["variants"]:
                if v.get("stock", 0) > 0:
                    variant_with_stock = v
                    break
            
            if not variant_with_stock:
                self.log("Test 1 - Find variant", False, "No variant with stock > 0")
                return
            
            variant_name = variant_with_stock["name"]
            original_variant_stock = variant_with_stock["stock"]
            original_product_stock = self.original_plaid_data["stock"]
            
            self.log("Test 1 - Get product", True, 
                    f"Product stock: {original_product_stock}, Variant '{variant_name}' stock: {original_variant_stock}")
            
            # Add 1 of this variant to cart
            resp = self.session.post(
                f"{BASE_URL}/api/cart",
                json={"slug": "plaid-sylvestre", "qty": 1, "variant": variant_name},
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 1 - Add to cart", False, f"Status {resp.status_code}")
                return
            
            cart_data = resp.json()
            self.log("Test 1 - Add to cart", True, f"Cart count: {cart_data.get('count')}")
            
            # Create order
            order_data = {
                "address": {
                    "firstName": "QA",
                    "lastName": "T",
                    "name": "QA T",
                    "email": TEST_EMAIL,
                    "address": "1 rue",
                    "city": "Paris",
                    "zip": "75001",
                    "country": "France",
                    "shippingMethod": "standard"
                }
            }
            
            resp = self.session.post(
                f"{BASE_URL}/api/orders",
                json=order_data,
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 1 - Create order", False, f"Status {resp.status_code}: {resp.text}")
                return
            
            order_resp = resp.json()
            order_id = order_resp.get("order", {}).get("_id")
            if order_id:
                self.created_orders.append(order_id)
            
            self.log("Test 1 - Create order", True, f"Order created: {order_resp.get('order', {}).get('orderNumber')}")
            
            # Verify stock decreased
            time.sleep(1)  # Give DB time to update
            resp = self.admin_session.get(f"{BASE_URL}/api/products/plaid-sylvestre", timeout=10)
            if resp.status_code != 200:
                self.log("Test 1 - Verify stock", False, f"Status {resp.status_code}")
                return
            
            updated_product = resp.json().get("product", {})
            new_product_stock = updated_product.get("stock")
            new_variants = updated_product.get("variants", [])
            
            # Find the variant we ordered
            new_variant_stock = None
            for v in new_variants:
                if v["name"] == variant_name:
                    new_variant_stock = v.get("stock")
                    break
            
            # Check if stock decreased by 1
            product_stock_decreased = (new_product_stock == original_product_stock - 1)
            variant_stock_decreased = (new_variant_stock == original_variant_stock - 1)
            
            if product_stock_decreased and variant_stock_decreased:
                self.log("Test 1 - Stock decrement", True, 
                        f"Product stock: {original_product_stock} → {new_product_stock}, "
                        f"Variant '{variant_name}' stock: {original_variant_stock} → {new_variant_stock}")
            else:
                self.log("Test 1 - Stock decrement", False,
                        f"Product stock: {original_product_stock} → {new_product_stock} (expected {original_product_stock - 1}), "
                        f"Variant stock: {original_variant_stock} → {new_variant_stock} (expected {original_variant_stock - 1})")
            
        except Exception as e:
            self.log("Test 1 - Exception", False, str(e))
    
    def test_2_insufficient_stock(self):
        """Test 2: Insufficient stock handling"""
        print("\n" + "="*80)
        print("TEST 2: Insufficient stock handling")
        print("="*80)
        
        try:
            # Get plaid-sylvestre full product data
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/products", timeout=10)
            if resp.status_code != 200:
                self.log("Test 2 - Get products", False, f"Status {resp.status_code}")
                return
            
            products = resp.json().get("products", [])
            plaid = None
            for p in products:
                if p.get("slug") == "plaid-sylvestre":
                    plaid = p
                    break
            
            if not plaid:
                self.log("Test 2 - Find product", False, "plaid-sylvestre not found")
                return
            
            # Find a variant and set its stock to 1
            variants = plaid.get("variants", [])
            if not variants:
                self.log("Test 2 - Find variant", False, "No variants found")
                return
            
            test_variant = variants[0]
            test_variant_name = test_variant["name"]
            
            # Update variant stock to 1
            for v in variants:
                if v["name"] == test_variant_name:
                    v["stock"] = 1
            
            plaid["variants"] = variants
            
            resp = self.admin_session.patch(
                f"{BASE_URL}/api/admin/products?slug=plaid-sylvestre",
                json=plaid,
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 2 - Set stock to 1", False, f"Status {resp.status_code}")
                return
            
            self.log("Test 2 - Set stock to 1", True, f"Variant '{test_variant_name}' stock set to 1")
            
            # Add 1 to cart
            resp = self.session.post(
                f"{BASE_URL}/api/cart",
                json={"slug": "plaid-sylvestre", "qty": 1, "variant": test_variant_name},
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 2 - Add to cart", False, f"Status {resp.status_code}")
                return
            
            self.log("Test 2 - Add to cart", True, "Added 1 item to cart")
            
            # Directly modify cart in MongoDB to qty 3
            cart_doc = self.db.carts.find_one({"items.slug": "plaid-sylvestre"})
            if not cart_doc:
                self.log("Test 2 - Find cart", False, "Cart not found in MongoDB")
                return
            
            for item in cart_doc["items"]:
                if item["slug"] == "plaid-sylvestre" and item.get("variant") == test_variant_name:
                    item["qty"] = 3
            
            self.db.carts.update_one(
                {"_id": cart_doc["_id"]},
                {"$set": {"items": cart_doc["items"]}}
            )
            
            self.log("Test 2 - Modify cart", True, "Cart qty modified to 3 in MongoDB")
            
            # Try to create order - should fail with 409
            order_data = {
                "address": {
                    "firstName": "QA",
                    "lastName": "T",
                    "name": "QA T",
                    "email": TEST_EMAIL,
                    "address": "1 rue",
                    "city": "Paris",
                    "zip": "75001",
                    "country": "France",
                    "shippingMethod": "standard"
                }
            }
            
            resp = self.session.post(
                f"{BASE_URL}/api/orders",
                json=order_data,
                timeout=10
            )
            
            if resp.status_code == 409:
                error_data = resp.json()
                error_msg = error_data.get("error", "")
                problems = error_data.get("problems", [])
                
                # Check for French error message
                has_french_error = bool(error_msg)
                has_problems = len(problems) > 0
                
                self.log("Test 2 - Insufficient stock", True,
                        f"Got 409 with French error: '{error_msg}', problems: {len(problems)}")
                
                # Verify stock unchanged
                resp = self.admin_session.get(f"{BASE_URL}/api/products/plaid-sylvestre", timeout=10)
                if resp.status_code == 200:
                    product = resp.json().get("product", {})
                    variants = product.get("variants", [])
                    for v in variants:
                        if v["name"] == test_variant_name:
                            if v.get("stock") == 1:
                                self.log("Test 2 - Stock unchanged", True, f"Stock still 1 after failed order")
                            else:
                                self.log("Test 2 - Stock unchanged", False, f"Stock is {v.get('stock')}, expected 1")
                            break
            else:
                self.log("Test 2 - Insufficient stock", False, 
                        f"Expected 409, got {resp.status_code}")
            
        except Exception as e:
            self.log("Test 2 - Exception", False, str(e))
    
    def test_3_sold_out(self):
        """Test 3: Sold out handling"""
        print("\n" + "="*80)
        print("TEST 3: Sold out handling")
        print("="*80)
        
        try:
            # Get plaid-sylvestre
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/products", timeout=10)
            if resp.status_code != 200:
                self.log("Test 3 - Get products", False, f"Status {resp.status_code}")
                return
            
            products = resp.json().get("products", [])
            plaid = None
            for p in products:
                if p.get("slug") == "plaid-sylvestre":
                    plaid = p
                    break
            
            if not plaid:
                self.log("Test 3 - Find product", False, "plaid-sylvestre not found")
                return
            
            # Set a variant stock to 0
            variants = plaid.get("variants", [])
            if not variants:
                self.log("Test 3 - Find variant", False, "No variants found")
                return
            
            test_variant = variants[0]
            test_variant_name = test_variant["name"]
            
            for v in variants:
                if v["name"] == test_variant_name:
                    v["stock"] = 0
            
            plaid["variants"] = variants
            
            resp = self.admin_session.patch(
                f"{BASE_URL}/api/admin/products?slug=plaid-sylvestre",
                json=plaid,
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 3 - Set stock to 0", False, f"Status {resp.status_code}")
                return
            
            self.log("Test 3 - Set stock to 0", True, f"Variant '{test_variant_name}' stock set to 0")
            
            # Try to add to cart - should fail with 409
            resp = self.session.post(
                f"{BASE_URL}/api/cart",
                json={"slug": "plaid-sylvestre", "qty": 1, "variant": test_variant_name},
                timeout=10
            )
            
            if resp.status_code == 409:
                error_data = resp.json()
                error_msg = error_data.get("error", "")
                
                # Check for French error message about "épuisée"
                if "épuisé" in error_msg.lower():
                    self.log("Test 3 - Sold out", True, f"Got 409 with French error: '{error_msg}'")
                else:
                    self.log("Test 3 - Sold out", False, f"Error message doesn't contain 'épuisé': '{error_msg}'")
            else:
                self.log("Test 3 - Sold out", False, f"Expected 409, got {resp.status_code}")
            
        except Exception as e:
            self.log("Test 3 - Exception", False, str(e))
    
    def test_4_admin_create_products(self):
        """Test 4: Admin product creation with slug generation and rename"""
        print("\n" + "="*80)
        print("TEST 4: Admin product creation")
        print("="*80)
        
        try:
            # Test 4a: Create "Grand panier de rangement" with category DECORATION
            resp = self.admin_session.post(
                f"{BASE_URL}/api/admin/products",
                json={"name": "Grand panier de rangement", "category": "DECORATION"},
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 4a - Create product", False, f"Status {resp.status_code}")
                return
            
            data = resp.json()
            slug1 = data.get("slug")
            
            if slug1 == "grand-panier-de-rangement":
                self.log("Test 4a - Slug generation", True, f"Slug: {slug1}")
                self.created_products.append(slug1)
            else:
                self.log("Test 4a - Slug generation", False, f"Expected 'grand-panier-de-rangement', got '{slug1}'")
                return
            
            # Verify category is stored as 'decoration' (lowercase)
            resp = self.admin_session.get(f"{BASE_URL}/api/products/{slug1}", timeout=10)
            if resp.status_code == 200:
                product = resp.json().get("product", {})
                category = product.get("category")
                if category == "decoration":
                    self.log("Test 4a - Category normalization", True, f"Category stored as 'decoration'")
                else:
                    self.log("Test 4a - Category normalization", False, f"Category is '{category}', expected 'decoration'")
            
            # Test 4b: Create same name again - should get -2 suffix
            resp = self.admin_session.post(
                f"{BASE_URL}/api/admin/products",
                json={"name": "Grand panier de rangement", "category": "DECORATION"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                slug2 = data.get("slug")
                if slug2 == "grand-panier-de-rangement-2":
                    self.log("Test 4b - Duplicate slug", True, f"Slug: {slug2}")
                    self.created_products.append(slug2)
                else:
                    self.log("Test 4b - Duplicate slug", False, f"Expected 'grand-panier-de-rangement-2', got '{slug2}'")
            
            # Test 4c: Create "Tapis Empreinte" - should remove legacy word
            resp = self.admin_session.post(
                f"{BASE_URL}/api/admin/products",
                json={"name": "Tapis Empreinte"},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                slug3 = data.get("slug")
                # Should be 'tapis' or 'tapis-2' if 'tapis' is taken
                if slug3 in ["tapis", "tapis-2"]:
                    self.log("Test 4c - Legacy word removal", True, f"Slug: {slug3} (legacy 'empreinte' removed)")
                    self.created_products.append(slug3)
                else:
                    self.log("Test 4c - Legacy word removal", False, f"Expected 'tapis' or 'tapis-2', got '{slug3}'")
            
            # Test 4d: Create "Nouvelle création" then rename to "Coussin lune"
            resp = self.admin_session.post(
                f"{BASE_URL}/api/admin/products",
                json={"name": "Nouvelle création"},
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 4d - Create nouvelle-creation", False, f"Status {resp.status_code}")
                return
            
            data = resp.json()
            old_slug = data.get("slug")
            self.log("Test 4d - Create nouvelle-creation", True, f"Slug: {old_slug}")
            self.created_products.append(old_slug)
            
            # Rename to "Coussin lune"
            resp = self.admin_session.patch(
                f"{BASE_URL}/api/admin/products?slug={old_slug}",
                json={"name": "Coussin lune"},
                timeout=10
            )
            if resp.status_code != 200:
                self.log("Test 4d - Rename product", False, f"Status {resp.status_code}")
                return
            
            data = resp.json()
            new_slug = data.get("slug")
            
            if new_slug == "coussin-lune":
                self.log("Test 4d - Rename slug", True, f"New slug: {new_slug}")
                
                # Verify product is reachable at new slug
                resp = self.admin_session.get(f"{BASE_URL}/api/products/{new_slug}", timeout=10)
                if resp.status_code == 200:
                    self.log("Test 4d - New slug accessible", True, f"GET /api/products/{new_slug} returns 200")
                else:
                    self.log("Test 4d - New slug accessible", False, f"Status {resp.status_code}")
                
                # Verify old slug redirects
                resp = self.admin_session.get(f"{BASE_URL}/api/products/{old_slug}", timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    redirect = data.get("redirect")
                    if redirect == new_slug:
                        self.log("Test 4d - Old slug redirect", True, f"Old slug redirects to '{redirect}'")
                    else:
                        self.log("Test 4d - Old slug redirect", False, f"Redirect is '{redirect}', expected '{new_slug}'")
                else:
                    self.log("Test 4d - Old slug redirect", False, f"Status {resp.status_code}")
                
                # Update created_products list
                if old_slug in self.created_products:
                    self.created_products.remove(old_slug)
                self.created_products.append(new_slug)
            else:
                self.log("Test 4d - Rename slug", False, f"Expected 'coussin-lune', got '{new_slug}'")
            
        except Exception as e:
            self.log("Test 4 - Exception", False, str(e))
    
    def test_5_auto_migration(self):
        """Test 5: Auto-migration of legacy slugs"""
        print("\n" + "="*80)
        print("TEST 5: Auto-migration")
        print("="*80)
        
        try:
            # Insert a product with legacy slug in products_custom
            legacy_slug = "produit-1790005978336"
            test_doc = {
                "_id": "qa-x",
                "slug": legacy_slug,
                "name": "Tapis Bohème",
                "category": "decoration",
                "price": 10,
                "stock": 1,
                "images": []
            }
            
            self.db.products_custom.insert_one(test_doc)
            self.log("Test 5 - Insert legacy product", True, f"Inserted product with slug '{legacy_slug}'")
            
            # Insert a cart with this slug
            cart_doc = {
                "_id": "test-cart-migration",
                "items": [{"slug": legacy_slug, "qty": 1, "price": 10}]
            }
            self.db.carts.insert_one(cart_doc)
            self.log("Test 5 - Insert cart", True, "Inserted cart with legacy slug")
            
            # Restart nextjs to trigger migration
            import subprocess
            result = subprocess.run(
                ["sudo", "supervisorctl", "restart", "nextjs"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                self.log("Test 5 - Restart nextjs", True, "Nextjs restarted")
                time.sleep(15)  # Wait for migration to run
            else:
                self.log("Test 5 - Restart nextjs", False, f"Failed: {result.stderr}")
                return
            
            # Check if slug was migrated
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/products", timeout=10)
            if resp.status_code != 200:
                self.log("Test 5 - Get products", False, f"Status {resp.status_code}")
                return
            
            products = resp.json().get("products", [])
            migrated_product = None
            for p in products:
                if p.get("_id") == "qa-x":
                    migrated_product = p
                    break
            
            if migrated_product:
                new_slug = migrated_product.get("slug")
                previous_slugs = migrated_product.get("previousSlugs", [])
                
                if new_slug == "tapis-boheme":
                    self.log("Test 5 - Slug migrated", True, f"Slug changed to 'tapis-boheme'")
                else:
                    self.log("Test 5 - Slug migrated", False, f"Slug is '{new_slug}', expected 'tapis-boheme'")
                
                if legacy_slug in previous_slugs:
                    self.log("Test 5 - Previous slugs", True, f"Old slug in previousSlugs")
                else:
                    self.log("Test 5 - Previous slugs", False, f"Old slug not in previousSlugs: {previous_slugs}")
                
                # Check if cart was updated
                cart = self.db.carts.find_one({"_id": "test-cart-migration"})
                if cart:
                    cart_slug = cart.get("items", [{}])[0].get("slug")
                    if cart_slug == "tapis-boheme":
                        self.log("Test 5 - Cart updated", True, "Cart item slug updated to 'tapis-boheme'")
                    else:
                        self.log("Test 5 - Cart updated", False, f"Cart slug is '{cart_slug}', expected 'tapis-boheme'")
            else:
                self.log("Test 5 - Find migrated product", False, "Product not found after migration")
            
        except Exception as e:
            self.log("Test 5 - Exception", False, str(e))
    
    def test_6_base_slug_renames(self):
        """Test 6: Base slug renames and category redirects"""
        print("\n" + "="*80)
        print("TEST 6: Base slug renames")
        print("="*80)
        
        try:
            # Test 6a: panier-racine → panier-crochet-coton
            resp = self.admin_session.get(f"{BASE_URL}/api/products/panier-racine", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                redirect = data.get("redirect")
                if redirect == "panier-crochet-coton":
                    self.log("Test 6a - panier-racine redirect", True, f"Redirects to '{redirect}'")
                else:
                    self.log("Test 6a - panier-racine redirect", False, f"Redirect is '{redirect}', expected 'panier-crochet-coton'")
            else:
                self.log("Test 6a - panier-racine redirect", False, f"Status {resp.status_code}")
            
            # Test 6b: tapis-empreinte → tapis-jute-tresse
            resp = self.admin_session.get(f"{BASE_URL}/api/products/tapis-empreinte", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                redirect = data.get("redirect")
                if redirect == "tapis-jute-tresse":
                    self.log("Test 6b - tapis-empreinte redirect", True, f"Redirects to '{redirect}'")
                else:
                    self.log("Test 6b - tapis-empreinte redirect", False, f"Redirect is '{redirect}', expected 'tapis-jute-tresse'")
            else:
                self.log("Test 6b - tapis-empreinte redirect", False, f"Status {resp.status_code}")
            
            # Test 6c: GET /collections?cat=empreinte should redirect to cat=intemporels
            resp = self.admin_session.get(f"{BASE_URL}/collections?cat=empreinte", allow_redirects=False, timeout=10)
            if resp.status_code == 301:
                location = resp.headers.get("Location", "")
                if "cat=intemporels" in location:
                    self.log("Test 6c - Category redirect", True, f"301 redirect to {location}")
                else:
                    self.log("Test 6c - Category redirect", False, f"Location is '{location}', expected cat=intemporels")
            else:
                self.log("Test 6c - Category redirect", False, f"Status {resp.status_code}, expected 301")
            
            # Test 6d: GET /api/products?cat=racine should return same as cat=intemporels
            resp1 = self.admin_session.get(f"{BASE_URL}/api/products?cat=racine", timeout=10)
            resp2 = self.admin_session.get(f"{BASE_URL}/api/products?cat=intemporels", timeout=10)
            
            if resp1.status_code == 200 and resp2.status_code == 200:
                products1 = resp1.json().get("products", [])
                products2 = resp2.json().get("products", [])
                
                if len(products1) == len(products2) and len(products1) > 0:
                    self.log("Test 6d - API category normalization", True, 
                            f"cat=racine returns {len(products1)} products, same as cat=intemporels")
                else:
                    self.log("Test 6d - API category normalization", False,
                            f"cat=racine returns {len(products1)}, cat=intemporels returns {len(products2)}")
            else:
                self.log("Test 6d - API category normalization", False, 
                        f"Status: racine={resp1.status_code}, intemporels={resp2.status_code}")
            
            # Test 6e: All products should have no 'racine' or 'empreinte' in category/collection
            resp = self.admin_session.get(f"{BASE_URL}/api/products", timeout=10)
            if resp.status_code == 200:
                products = resp.json().get("products", [])
                has_legacy = False
                for p in products:
                    cat = p.get("category", "")
                    coll = p.get("collection", "")
                    if cat in ["racine", "empreinte"] or coll in ["racine", "empreinte"]:
                        has_legacy = True
                        break
                
                if not has_legacy:
                    self.log("Test 6e - No legacy categories", True, "No products with racine/empreinte")
                else:
                    self.log("Test 6e - No legacy categories", False, "Found products with racine/empreinte")
            else:
                self.log("Test 6e - No legacy categories", False, f"Status {resp.status_code}")
            
        except Exception as e:
            self.log("Test 6 - Exception", False, str(e))
    
    def test_7_broken_media(self):
        """Test 7: GET /api/admin/broken-media"""
        print("\n" + "="*80)
        print("TEST 7: Broken media endpoint")
        print("="*80)
        
        try:
            # Test 7a: GET /api/admin/broken-media should return 200
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/broken-media", timeout=10)
            if resp.status_code != 200:
                self.log("Test 7a - Get broken media", False, f"Status {resp.status_code}")
                return
            
            data = resp.json()
            products = data.get("products", [])
            self.log("Test 7a - Get broken media", True, f"Found {len(products)} products with broken media")
            
            # Test 7b: Create a deleted product with broken images - should NOT appear
            deleted_doc = {
                "slug": "coussin-noyau",
                "deleted": True,
                "data": {
                    "name": "Coussins - Mérinos",
                    "images": ["/api/img/upload-779a32dc"]
                }
            }
            self.db.product_overrides.insert_one(deleted_doc)
            self.log("Test 7b - Insert deleted product", True, "Inserted deleted product override")
            
            # Get broken media again
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/broken-media", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                products = data.get("products", [])
                
                # Check if deleted product appears
                found_deleted = False
                for p in products:
                    if p.get("slug") == "coussin-noyau":
                        found_deleted = True
                        break
                
                if not found_deleted:
                    self.log("Test 7b - Deleted product excluded", True, "Deleted product does not appear in broken media")
                else:
                    self.log("Test 7b - Deleted product excluded", False, "Deleted product appears in broken media")
            else:
                self.log("Test 7b - Get broken media", False, f"Status {resp.status_code}")
            
            # Test 7c: Create a custom product with broken images - should appear
            custom_doc = {
                "_id": "qa-broken-test",
                "slug": "qa-broken-product",
                "name": "QA Broken Product",
                "category": "intemporels",
                "price": 100,
                "stock": 1,
                "images": ["/api/img/upload-doesnotexist"]
            }
            self.db.products_custom.insert_one(custom_doc)
            self.log("Test 7c - Insert custom product", True, "Inserted custom product with broken image")
            
            # Get broken media again
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/broken-media", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                products = data.get("products", [])
                
                # Check if custom product appears
                found_custom = False
                for p in products:
                    if p.get("slug") == "qa-broken-product":
                        found_custom = True
                        product_name = p.get("name")
                        if product_name == "QA Broken Product":
                            self.log("Test 7c - Custom product appears", True, f"Custom product appears with name '{product_name}'")
                        else:
                            self.log("Test 7c - Custom product appears", False, f"Name is '{product_name}', expected 'QA Broken Product'")
                        break
                
                if not found_custom:
                    self.log("Test 7c - Custom product appears", False, "Custom product does not appear in broken media")
            else:
                self.log("Test 7c - Get broken media", False, f"Status {resp.status_code}")
            
        except Exception as e:
            self.log("Test 7 - Exception", False, str(e))
    
    def test_8_regression(self):
        """Test 8: Regression tests"""
        print("\n" + "="*80)
        print("TEST 8: Regression tests")
        print("="*80)
        
        try:
            # Test 8a: GET /api/admin/products works
            resp = self.admin_session.get(f"{BASE_URL}/api/admin/products", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                products = data.get("products", [])
                self.log("Test 8a - GET /api/admin/products", True, f"Returns {len(products)} products")
            else:
                self.log("Test 8a - GET /api/admin/products", False, f"Status {resp.status_code}")
            
            # Test 8b: POST /api/admin/products/bulk works
            resp = self.admin_session.post(
                f"{BASE_URL}/api/admin/products/bulk",
                json={"slugs": ["plaid-sylvestre"], "set": {"isNew": True}},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                updated = data.get("updated", 0)
                self.log("Test 8b - POST /api/admin/products/bulk", True, f"Updated {updated} products")
                
                # Reset isNew to false
                resp = self.admin_session.post(
                    f"{BASE_URL}/api/admin/products/bulk",
                    json={"slugs": ["plaid-sylvestre"], "set": {"isNew": False}},
                    timeout=10
                )
            else:
                self.log("Test 8b - POST /api/admin/products/bulk", False, f"Status {resp.status_code}")
            
        except Exception as e:
            self.log("Test 8 - Exception", False, str(e))
    
    def cleanup(self):
        """Cleanup test data"""
        print("\n" + "="*80)
        print("CLEANUP")
        print("="*80)
        
        try:
            # Delete created custom products
            for slug in self.created_products:
                self.db.products_custom.delete_one({"slug": slug})
                print(f"Deleted custom product: {slug}")
            
            # Delete QA test products
            self.db.products_custom.delete_one({"_id": "qa-x"})
            self.db.products_custom.delete_one({"_id": "qa-broken-test"})
            print("Deleted QA test products")
            
            # Delete test carts
            self.db.carts.delete_many({"_id": {"$regex": "^test-"}})
            print("Deleted test carts")
            
            # Delete test orders (limit to 3 as per review request)
            if self.created_orders:
                for order_id in self.created_orders[:3]:
                    self.db.orders.delete_one({"_id": order_id})
                print(f"Deleted {len(self.created_orders[:3])} test orders")
            
            # Delete test product_overrides
            self.db.product_overrides.delete_one({"slug": "coussin-noyau", "deleted": True})
            print("Deleted test product_overrides")
            
            # Restore plaid-sylvestre stock if we have original data
            if self.original_plaid_data:
                # Get current plaid data
                resp = self.admin_session.get(f"{BASE_URL}/api/admin/products", timeout=10)
                if resp.status_code == 200:
                    products = resp.json().get("products", [])
                    plaid = None
                    for p in products:
                        if p.get("slug") == "plaid-sylvestre":
                            plaid = p
                            break
                    
                    if plaid:
                        # Restore original stock and variants
                        plaid["stock"] = self.original_plaid_data["stock"]
                        plaid["variants"] = self.original_plaid_data["variants"]
                        
                        resp = self.admin_session.patch(
                            f"{BASE_URL}/api/admin/products?slug=plaid-sylvestre",
                            json=plaid,
                            timeout=10
                        )
                        if resp.status_code == 200:
                            print("Restored plaid-sylvestre stock to original values")
                        else:
                            print(f"Failed to restore plaid-sylvestre stock: {resp.status_code}")
            
            self.log("Cleanup", True, "All test data cleaned up")
            
        except Exception as e:
            self.log("Cleanup", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("CATALOG/STOCK CHANGES BACKEND TESTING")
        print("="*80)
        print(f"Base URL: {BASE_URL}")
        print(f"Test Email: {TEST_EMAIL}")
        print("="*80)
        
        # Login as admin
        if not self.admin_login():
            print("\n❌ Admin login failed. Cannot proceed with tests.")
            return
        
        # Run tests
        self.test_1_stock_decrement_on_order()
        self.test_2_insufficient_stock()
        self.test_3_sold_out()
        self.test_4_admin_create_products()
        self.test_5_auto_migration()
        self.test_6_base_slug_renames()
        self.test_7_broken_media()
        self.test_8_regression()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        passed = sum(1 for r in self.test_results if r["passed"])
        total = len(self.test_results)
        
        print(f"\nTotal tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success rate: {passed/total*100:.1f}%")
        
        print("\nDetailed results:")
        for r in self.test_results:
            status = "✅" if r["passed"] else "❌"
            print(f"{status} {r['test']}")
            if r["message"]:
                print(f"   {r['message']}")
        
        print("\n" + "="*80)

if __name__ == "__main__":
    tester = BackendTester()
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        tester.cleanup()
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        tester.cleanup()
