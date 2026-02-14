# Session Authentication Debugging Guide

## Current Issue
Getting 401 Unauthorized errors when trying to save products in the admin panel.

## Root Cause
In NextAuth v5 with Next.js 15 App Router, the `auth()` function in API routes needs special handling to properly access cookies.

## Fixes Applied

1. **Added `await headers()` before `auth()`** in all API routes
   - This ensures cookies are properly read in API routes
   
2. **Set `session.strategy` to "jwt"** in NextAuth config
   - Explicitly tells NextAuth to use JWT-based sessions

3. **Added `trustHost: true`** in NextAuth config
   - Required for NextAuth v5 to work properly

## Manual Testing Steps

### Step 1: Open Browser DevTools

1. Open your browser (Chrome/Edge/Firefox)
2. Press F12 to open Developer Tools
3. Go to the **Console** tab

### Step 2: Navigate to Admin Login

Open: `http://localhost:3002/admin/login` (or whatever port your Next.js is running on)

- If port 3002 doesn't work, try 3001 or 3000
- Check your terminal for the actual port number

### Step 3: Login

1. Email: `admin@simplebiztoolkit.com`
2. Password: `T0mbraider&1`
3. Click "Sign In"

### Step 4: Check Cookies

In DevTools:
1. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Click on **Cookies** → `http://localhost:XXXX`
3. Look for a cookie named `authjs.session-token` or similar
4. **IMPORTANT**: Take a screenshot if you see it

### Step 5: Check Session

In the Console tab, run:
```javascript
fetch('/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(data => console.log('Session:', data))
```

You should see something like:
```json
{
  "user": {
    "email": "admin@simplebiztoolkit.com",
    "name": "Admin User"
  },
  "accessToken": "eyJ..."
}
```

If you see `null`, the session is not working.

### Step 6: Go to Products Page

Navigate to: `http://localhost:XXXX/admin/products`

### Step 7:  Edit a Product

1. Click "Edit" on any product
2. Change the title or any field
3. Click "Save Changes"
4. **Watch the Console and Network tabs**

### Step 8: Check for Errors

In the Console tab, look for:
- ✅ GOOD: "Product saved successfully!"
- ❌ BAD: "Error: Unauthorized" or 401 status

In the Network tab:
1. Click on the PUT request to `/api/products/...`
2. Check the **Headers** tab
3. Look for cookies being sent
4. Check the **Response** tab for error details

## What to Report Back

Please tell me:

1. **Which port is Next.js running on?** (3000, 3001, 3002?)

2. **Do you see the session cookie?** (authjs.session-token)
   - YES/NO
   - If YES, what's its value (first 20 characters is fine)

3. **What does `/api/auth/session` return?**
   - The user object
   - OR `null`

4. **When you try to save a product:**
   - What HTTP status code do you get? (200, 401, 500?)
   - What does the response say?

5. **Check your Next.js terminal** for these debug logs:
   ```
   [API PUT /products/[id]] Session: EXISTS or NULL
   ```
   - What does it say?

## Alternative: Use the Test Page

Open in your browser:
```
http://localhost:XXXX/test-auth.html
```

Click through the steps and report what you see.

## If Still Getting 401

If you're still getting 401 after these fixes, the issue might be:

1. **Cookie not being set** - Check DevTools → Application → Cookies
2. **Cookie not being sent** - Check DevTools → Network → Request Headers
3. **Session not being read** - Check terminal logs for session status
4. **Port mismatch** - Make sure you're using the same port everywhere

Let me know what you find and I'll help you resolve it!
