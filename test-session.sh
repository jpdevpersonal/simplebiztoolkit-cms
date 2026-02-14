#!/bin/bash

# Test NextAuth Session in API Routes
# This script tests if the session cookie is properly being read in API routes

BASE_URL="http://localhost:3002"
BACKEND_URL="http://localhost:5117"

echo "========================================="
echo "Testing NextAuth Session in API Routes"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Get CSRF Token
echo "Step 1: Getting CSRF token..."
CSRF_RESPONSE=$(curl -s -c cookies.txt "${BASE_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
    echo -e "${RED}✗ Failed to get CSRF token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Got CSRF token: ${CSRF_TOKEN:0:20}...${NC}"
echo ""

# Step 2: Login
echo "Step 2: Logging in..."
LOGIN_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt -X POST \
    "${BASE_URL}/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=${CSRF_TOKEN}&email=admin@simplebiztoolkit.com&password=T0mbraider%261&callbackUrl=/admin&json=true")

# Check if we got a session cookie
if grep -q "next-auth.session-token" cookies.txt || grep -q "__Secure-next-auth.session-token" cookies.txt; then
    echo -e "${GREEN}✓ Login successful! Session cookie set${NC}"
    echo "Cookie content:"
    cat cookies.txt | grep "session-token" || echo "  (no session token found)"
else
    echo -e "${RED}✗ Login failed - no session cookie${NC}"
    echo "Cookies file:"
    cat cookies.txt
    exit 1
fi
echo ""

# Step 3: Check session
echo "Step 3: Checking session..."
SESSION_RESPONSE=$(curl -s -b cookies.txt "${BASE_URL}/api/auth/session")
echo "Session response:"
echo "$SESSION_RESPONSE" | head -c 200
echo ""

if echo "$SESSION_RESPONSE" | grep -q '"user"'; then
    echo -e "${GREEN}✓ Session is active${NC}"
else
    echo -e "${RED}✗ No active session found${NC}"
    echo "Full response: $SESSION_RESPONSE"
fi
echo ""

# Step 4: Test updating a product
echo "Step 4: Testing product update via API route..."
TEST_PRODUCT_ID="063c0604-1016-1865-e627-03e819be08df"

UPDATE_RESPONSE=$(curl -s -b cookies.txt -X PUT \
    "${BASE_URL}/api/products/${TEST_PRODUCT_ID}" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Update '"$(date +%s)"'",
        "slug": "test-update",
        "problem": "Test problem",
        "description": "Test description",
        "bullets": ["Feature 1", "Feature 2"],
        "image": "/test.jpg",
        "etsyUrl": "https://etsy.com/test",
        "price": "$19.99",
        "categoryId": "99e25874-1333-976d-6330-a885b1a94287",
        "status": "draft"
    }' \
    -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$UPDATE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: $HTTP_STATUS"
echo "Response:"
echo "$RESPONSE_BODY" | head -c 300
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Product update successful!${NC}"
elif [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${RED}✗ Product update failed with 401 Unauthorized${NC}"
    echo -e "${YELLOW}The session is not being passed to the API route correctly.${NC}"
    echo ""
    echo "Debug info:"
    echo "1. Check if cookies.txt has the session token:"
    cat cookies.txt | grep "session-token"
    echo ""
    echo "2. Check the Next.js terminal for session debug logs"
else
    echo -e "${RED}✗ Product update failed with status $HTTP_STATUS${NC}"
    echo "Response: $RESPONSE_BODY"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="

# Cleanup
rm -f cookies.txt
