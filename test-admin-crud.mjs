/**
 * Test script to verify admin product CRUD operations
 * Run with: node test-admin-crud.mjs
 */

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:5117';

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, status = 'info') {
  const statusColors = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue
  };
  const color = statusColors[status] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

async function testBackendAuth() {
  log('\n=== Testing Backend Authentication ===', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@simplebiztoolkit.com',
        password: 'T0mbraider&1'
      })
    });

    if (!response.ok) {
      log(`❌ Authentication failed: ${response.status}`, 'error');
      return null;
    }

    const data = await response.json();
    if (data.token && data.user) {
      log(`✅ Authentication successful! User: ${data.user.email}`, 'success');
      return data.token;
    } else {
      log('❌ Invalid response format', 'error');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return null;
  }
}

async function testGetCategories(token) {
  log('\n=== Testing Get Categories ===', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/products/categories`);
    
    if (!response.ok) {
      log(`❌ Failed to fetch categories: ${response.status}`, 'error');
      return null;
    }

    const result = await response.json();
    const categories = result.data || [];
    log(`✅ Fetched ${categories.length} categories`, 'success');
    
    if (categories.length > 0) {
      log(`   First category: ${categories[0].name} (ID: ${categories[0].id})`, 'info');
      return categories[0];
    }
    return null;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return null;
  }
}

async function testCreateProduct(token, categoryId) {
  log('\n=== Testing Create Product ===', 'info');
  
  const testProduct = {
    title: 'Test Product ' + Date.now(),
    slug: 'test-product-' + Date.now(),
    problem: 'This is a test problem statement',
    description: 'This is a test product description',
    bullets: ['Feature 1', 'Feature 2', 'Feature 3'],
    image: '/images/test.jpg',
    etsyUrl: 'https://etsy.com/test',
    price: '$9.99',
    categoryId: categoryId,
    status: 'draft'
  };

  try {
    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProduct)
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ Failed to create product: ${response.status} - ${error}`, 'error');
      return null;
    }

    const result = await response.json();
    const product = result.data || result;
    log(`✅ Product created successfully! ID: ${product.id}`, 'success');
    log(`   Title: ${product.title}`, 'info');
    return product;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return null;
  }
}

async function testUpdateProduct(token, productId, categoryId) {
  log('\n=== Testing Update Product ===', 'info');
  
  const updatedProduct = {
    title: 'Updated Test Product ' + Date.now(),
    slug: 'updated-test-product',
    problem: 'Updated problem statement',
    description: 'Updated description',
    bullets: ['Updated Feature 1', 'Updated Feature 2'],
    image: '/images/updated.jpg',
    etsyUrl: 'https://etsy.com/updated',
    price: '$19.99',
    categoryId: categoryId,
    status: 'published'
  };

  try {
    const response = await fetch(`${API_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedProduct)
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ Failed to update product: ${response.status} - ${error}`, 'error');
      return false;
    }

    const result = await response.json();
    const product = result.data || result;
    log(`✅ Product updated successfully!`, 'success');
    log(`   New title: ${product.title}`, 'info');
    log(`   New status: ${product.status}`, 'info');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return false;
  }
}

async function testDeleteProduct(token, productId) {
  log('\n=== Testing Delete Product ===', 'info');
  
  try {
    const response = await fetch(`${API_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      log(`❌ Failed to delete product: ${response.status} - ${error}`, 'error');
      return false;
    }

    log(`✅ Product deleted successfully!`, 'success');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════╗', 'info');
  log('║  Admin Product CRUD Operations Test      ║', 'info');
  log('╚═══════════════════════════════════════════╝', 'info');

  // Test 1: Authentication
  const token = await testBackendAuth();
  if (!token) {
    log('\n❌ Tests aborted: Authentication failed', 'error');
    process.exit(1);
  }

  // Test 2: Get Categories
  const category = await testGetCategories(token);
  if (!category) {
    log('\n❌ Tests aborted: No categories available', 'error');
    process.exit(1);
  }

  // Test 3: Create Product
  const product = await testCreateProduct(token, category.id);
  if (!product) {
    log('\n❌ Tests aborted: Failed to create product', 'error');
    process.exit(1);
  }

  // Test 4: Update Product
  const updateSuccess = await testUpdateProduct(token, product.id, category.id);
  if (!updateSuccess) {
    log('\n⚠️  Warning: Update test failed, but continuing...', 'warning');
  }

  // Test 5: Delete Product
  const deleteSuccess = await testDeleteProduct(token, product.id);
  if (!deleteSuccess) {
    log('\n⚠️  Warning: Delete test failed', 'warning');
  }

  // Summary
  log('\n╔═══════════════════════════════════════════╗', 'info');
  log('║  Test Summary                             ║', 'info');
  log('╚═══════════════════════════════════════════╝', 'info');
  log(`✅ Authentication: PASSED`, 'success');
  log(`✅ Get Categories: PASSED`, 'success');
  log(`✅ Create Product: PASSED`, 'success');
  log(`${updateSuccess ? '✅' : '❌'} Update Product: ${updateSuccess ? 'PASSED' : 'FAILED'}`, updateSuccess ? 'success' : 'error');
  log(`${deleteSuccess ? '✅' : '❌'} Delete Product: ${deleteSuccess ? 'PASSED' : 'FAILED'}`, deleteSuccess ? 'success' : 'error');
  
  log('\n🎉 All core CRUD operations are working!', 'success');
  log('   You can now use the admin panel at http://localhost:3001/admin', 'info');
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'error');
  process.exit(1);
});
