/**
 * Test script to verify admin login and product update through the frontend
 */

const BASE_URL = 'http://localhost:3001';

// ANSI color codes
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

async function testFrontendLogin() {
  log('\n=== Testing Frontend Login via NextAuth ===', 'info');
  
  try {
    // Get CSRF token first
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    log(`✅ Got CSRF token: ${csrfToken.substring(0, 20)}...`, 'success');

    // Now try to sign in using the credentials callback
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfToken,
        email: 'admin@simplebiztoolkit.com',
        password: 'T0mbraider&1',
        callbackUrl: `${BASE_URL}/admin`,
        json: 'true'
      }).toString(),
      redirect: 'manual'
    });

    // Extract session cookie
    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      log('❌ No session cookie received', 'error');
      return null;
    }

    log(`✅ Login successful! Got session cookie`, 'success');
    return cookies;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return null;
  }
}

async function testGetSession(sessionCookie) {
  log('\n=== Testing Session Retrieval ===', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': sessionCookie
      }
    });

    const session = await response.json();
    
    if (session && session.user) {
      log(`✅ Session retrieved! User: ${session.user.email}`, 'success');
      log(`   Session has accessToken: ${session.accessToken ? 'YES' : 'NO'}`, 'info');
      return session;
    } else {
      log('❌ No valid session found', 'error');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return null;
  }
}

async function testUpdateProduct(sessionCookie, productId) {
  log('\n=== Testing Product Update via Frontend API ===', 'info');
  
  const updatedData = {
    title: 'Frontend Test Update ' + Date.now(),
    slug: 'test-update',
    problem: 'Testing problem',
    description: 'Testing description',
    bullets: ['Test 1', 'Test 2'],
    image: '/test.jpg',
    etsyUrl: 'https://etsy.com/test',
    price: '$99.99',
    categoryId: '99e25874-1333-976d-6330-a885b1a94287', // Use a known category ID
    status: 'draft'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`❌ Failed to update product: ${response.status} - ${errorText}`, 'error');
      return false;
    }

    const result = await response.json();
    log(`✅ Product updated successfully via frontend!`, 'success');
    log(`   Response: ${JSON.stringify(result).substring(0, 100)}...`, 'info');
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  log('\n╔═══════════════════════════════════════════╗', 'info');
  log('║  Frontend Auth & Product Update Test     ║', 'info');
  log('╚═══════════════════════════════════════════╝', 'info');

  // Test 1: Login
  const sessionCookie = await testFrontendLogin();
  if (!sessionCookie) {
    log('\n❌ Tests aborted: Login failed', 'error');
    process.exit(1);
  }

  // Test 2: Get session
  const session = await testGetSession(sessionCookie);
  if (!session) {
    log('\n❌ Tests aborted: Session not found', 'error');
    process.exit(1);
  }

  // Test 3: Update a product (using a known product ID)
  const testProductId = '063c0604-1016-1865-e627-03e819be08df';
  const updateSuccess = await testUpdateProduct(sessionCookie, testProductId);

  // Summary
  log('\n╔═══════════════════════════════════════════╗', 'info');
  log('║  Test Summary                             ║', 'info');
  log('╚═══════════════════════════════════════════╝', 'info');
  log(`✅ Frontend Login: PASSED`, 'success');
  log(`✅ Session Retrieval: PASSED`, 'success');
  log(`${updateSuccess ? '✅' : '❌'} Product Update: ${updateSuccess ? 'PASSED' : 'FAILED'}`, updateSuccess ? 'success' : 'error');
  
  if (updateSuccess) {
    log('\n🎉 All tests passed! The admin panel should work correctly now.', 'success');
  } else {
    log('\n⚠️  Product update failed. Check the backend API connection.', 'warning');
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
