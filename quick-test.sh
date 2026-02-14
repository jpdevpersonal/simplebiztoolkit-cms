#!/bin/bash

# Quick Test for Admin Product Update
# This tests the complete flow with cookies

echo "================================================"
echo "Testing Admin Product CRUD with Session Cookies"
echo "================================================"
echo ""

# Detect which port Next.js is running on
NEXT_PORT=""
for port in 3000 3001 3002; do
  if curl -s http://localhost:$port 2>&1 | grep -q "Simple Biz\|DOCTYPE"; then
    NEXT_PORT=$port
    break
  fi
done

if [ -z "$NEXT_PORT" ]; then
  echo "❌ Could not find Next.js server on ports 3000, 3001, or 3002"
  exit 1
fi

echo "✓ Found Next.js on port $NEXT_PORT"
BASE_URL="http://localhost:$NEXT_PORT"
echo "  URL: $BASE_URL"
echo ""

# Clean up old cookies
rm -f test-cookies.txt

# Step 1: Get CSRF token
echo "1. Getting CSRF token..."
CSRF_JSON=$(curl -s -c test-cookies.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_JSON" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
  echo "   ❌ Failed to get CSRF token"
  echo "   Response: $CSRF_JSON"
  exit 1
fi
echo "   ✓ CSRF: ${CSRF_TOKEN:0:30}..."
echo ""

# Step 2: Login
echo "2. Logging in..."
LOGIN_RESULT=$(curl -s -b test-cookies.txt -c test-cookies.txt \
  -X POST "${BASE_URL}/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=${CSRF_TOKEN}&email=admin@simplebiztoolkit.com&password=T0mbraider%261&callbackUrl=${BASE_URL}/admin&json=true" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESULT" | grep "HTTP_CODE:" | cut -d: -f2)
echo "   HTTP Status: $HTTP_CODE"

# Check for session cookie
if grep -q "session-token" test-cookies.txt; then
  echo "   ✓ Session cookie received"
  SESSION_COOKIE=$(grep "session-token" test-cookies.txt | awk '{print $7}')
  echo "   Cookie: ${SESSION_COOKIE:0:40}..."
else
  echo "   ❌ No session cookie found"
  echo "   Cookies:"
  cat test-cookies.txt
  exit 1
fi
echo ""

# Step 3: Verify session
echo "3. Verifying session..."
SESSION_DATA=$(curl -s -b test-cookies.txt "${BASE_URL}/api/auth/session")
if echo "$SESSION_DATA" | grep -q '"user"'; then
  USER_EMAIL=$(echo "$SESSION_DATA" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
  echo "   ✓ Session active for: $USER_EMAIL"
else
  echo "   ❌ No active session"
  echo "   Response: $SESSION_DATA"
  exit 1
fi
echo ""

# Step 4: Update a product
echo "4. Testing product update..."
PRODUCT_ID="063c0604-1016-1865-e627-03e819be08df"

UPDATE_DATA='{
  "title": "Test Update '"$(date +%s)"'",
  "slug": "test-update",
  "problem": "Testing from script",
  "description": "This is a test",
  "bullets": ["Test 1", "Test 2"],
  "image": "/test.jpg",
  "etsyUrl": "https://etsy.com/test",
  "price": "$99.99",
  "categoryId": "99e25874-1333-976d-6330-a885b1a94287",
  "status": "draft"
}'

UPDATE_RESULT=$(curl -s -b test-cookies.txt \
  -X PUT "${BASE_URL}/api/products/${PRODUCT_ID}" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA" \
  -w "\nHTTP_CODE:%{http_code}")

UPDATE_HTTP=$(echo "$UPDATE_RESULT" | grep "HTTP_CODE:" | cut -d: -f2)
UPDATE_BODY=$(echo "$UPDATE_RESULT" | sed '/HTTP_CODE:/d')

echo "   HTTP Status: $UPDATE_HTTP"

if [ "$UPDATE_HTTP" = "200" ]; then
  echo "   ✓ Product updated successfully!"
  echo ""
  echo "================================================"
  echo "✅ ALL TESTS PASSED!"
  echo "================================================"
  echo ""
  echo "The admin panel should now work correctly at:"
  echo "  $BASE_URL/admin/login"
  echo ""
elif [ "$UPDATE_HTTP" = "401" ]; then
  echo "   ❌ Got 401 Unauthorized"
  echo "   Response: $UPDATE_BODY"
  echo ""
  echo "Session cookie is not being passed to API route."
  echo "Check the Next.js terminal for debug logs."
else
  echo "   ❌ Unexpected status: $UPDATE_HTTP"
  echo "   Response: ${UPDATE_BODY:0:200}"
fi

# Cleanup
rm -f test-cookies.txt
