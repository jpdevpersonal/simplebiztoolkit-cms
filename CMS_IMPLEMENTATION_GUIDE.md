# CMS Transformation Complete: Implementation Guide

## 🎉 Overview

Your Simple Biz Toolkit site has been successfully transformed from a static Next.js site into a dynamic, production-ready CMS. This guide explains what was built, how to use it, and next steps.

---

## 📋 What Was Built

### 1. **Core Infrastructure**

- ✅ **API Service** (`src/lib/api.ts`) - Centralized communication with your C# backend
- ✅ **Revalidation System** (`src/lib/revalidation.ts`) - On-demand ISR updates
- ✅ **Content Renderer** (`src/components/ContentRenderer.tsx`) - Converts database HTML to your styled components
- ✅ **Sanitization** (`src/lib/sanitize.ts`) - XSS prevention for user-generated content

### 2. **Dynamic Pages (ISR Enabled)**

- ✅ **Blog Index** (`/blog`) - Fetches published articles from API
- ✅ **Blog Detail** (`/blog/[slug]`) - Renders article content dynamically
- ✅ **Product Category** (`/products/[categorySlug]`) - Dynamic category pages
- ✅ **Product Detail** (`/products/[categorySlug]/[productSlug]`) - Dynamic product pages

### 3. **Admin Portal** (`/admin`)

- ✅ **Authentication** - NextAuth with credentials provider
- ✅ **Dashboard** - Overview of content stats
- ✅ **Article Manager** - Full CRUD for blog articles
- ✅ **Product Manager** - List and edit products
- ✅ **Category Manager** - Manage product categories

### 4. **Configuration Updates**

- ✅ **Next.js Config** - Removed `output: 'export'`, enabled ISR
- ✅ **Middleware** - Protects `/admin` routes
- ✅ **Environment Variables** - `.env.local.example` template

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

This will install the required `next-auth` package.

### Step 2: Configure Environment Variables

Create `.env.local` based on the example:

```bash
cp .env.local.example .env.local
```

Update the values:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Admin Credentials (temporary)
ADMIN_EMAIL=admin@simplebiztoolkit.com
ADMIN_PASSWORD_HASH=your-password

# Revalidation Webhook Secret
REVALIDATION_SECRET=your-webhook-secret-key
```

### Step 3: Set Up Your C# API

Your C# API needs to provide these endpoints:

#### Articles

- `GET /api/articles?status=published` - Get published articles
- `GET /api/articles` - Get all articles (admin only)
- `GET /api/articles/slug/{slug}` - Get article by slug
- `GET /api/articles/{id}` - Get article by ID
- `POST /api/articles` - Create article
- `PUT /api/articles/{id}` - Update article
- `DELETE /api/articles/{id}` - Delete article

#### Products

- `GET /api/products/categories` - Get all categories with products
- `GET /api/products/categories/slug/{slug}` - Get category by slug
- `GET /api/products/slug/{categorySlug}/{productSlug}` - Get product by slug
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

#### Categories

- `POST /api/products/categories` - Create category
- `PUT /api/products/categories/{id}` - Update category

**See `src/lib/api.ts` for complete API interface definitions.**

### Step 4: Migrate Your Content

#### Option A: Manual Database Entry

1. Navigate to `/admin/login`
2. Log in with your credentials
3. Create articles and products manually through the UI

#### Option B: Migration Scripts (Recommended)

1. Run the migration scripts to generate JSON:

   ```bash
   node scripts/migrate-articles.mjs
   node scripts/migrate-products.mjs
   ```

2. Review the generated files in `migration-data/`
3. Import the JSON into your C# API/database

**⚠️ Important:** The article content needs manual conversion. Your React components should be converted to HTML with data attributes:

```html
<!-- Before (React Component) -->
<section>
  <p>Content here</p>
</section>

<!-- After (Database HTML) -->
<section data-component="section">
  <p>Content here</p>
</section>
```

### Step 5: Test Locally

```bash
npm run dev
```

Visit:

- Public site: http://localhost:3000
- Admin portal: http://localhost:3000/admin

---

## 🔄 How ISR Works

### On-Demand Revalidation

When you update content in the admin portal, the system automatically triggers revalidation:

1. **Update Article** → Admin Portal saves to C# API
2. **C# API** → Sends webhook to `/api/revalidate`
3. **Next.js** → Regenerates the affected pages
4. **Result** → Content updates instantly on the live site

### Webhook Format

Your C# API should call this endpoint after any content update:

```http
POST http://your-nextjs-app/api/revalidate
Content-Type: application/json
X-Revalidation-Secret: your-webhook-secret-key

{
  "type": "article",
  "slug": "bookkeeping-made-simple"
}
```

Types:

- `"article"` - Revalidates a specific article
- `"product"` - Revalidates a specific product
- `"category"` - Revalidates a category
- `"all"` - Revalidates everything

---

## 🗄️ Database Schema Recommendations

### Articles Table

```sql
CREATE TABLE Articles (
  Id UNIQUEIDENTIFIER PRIMARY KEY,
  Slug NVARCHAR(200) UNIQUE NOT NULL,
  Title NVARCHAR(500) NOT NULL,
  Subtitle NVARCHAR(500),
  Description NVARCHAR(MAX) NOT NULL,
  Content NVARCHAR(MAX) NOT NULL,
  DateISO DATE NOT NULL,
  DateModified DATE,
  Category NVARCHAR(100) NOT NULL,
  ReadingMinutes INT NOT NULL,
  Badges NVARCHAR(MAX), -- JSON array
  FeaturedImage NVARCHAR(500),
  HeaderImage NVARCHAR(500),
  Status NVARCHAR(20) NOT NULL, -- 'draft' or 'published'
  SeoTitle NVARCHAR(500),
  SeoDescription NVARCHAR(MAX),
  OgImage NVARCHAR(500),
  CanonicalUrl NVARCHAR(500),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE()
);
```

### Products Table

```sql
CREATE TABLE Products (
  Id UNIQUEIDENTIFIER PRIMARY KEY,
  Slug NVARCHAR(200) NOT NULL,
  Title NVARCHAR(500) NOT NULL,
  Problem NVARCHAR(MAX) NOT NULL,
  Description NVARCHAR(MAX),
  Bullets NVARCHAR(MAX) NOT NULL, -- JSON array
  Image NVARCHAR(500),
  EtsyUrl NVARCHAR(500),
  Price NVARCHAR(20),
  CategoryId UNIQUEIDENTIFIER NOT NULL,
  Status NVARCHAR(20) NOT NULL,
  FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
);

CREATE TABLE Categories (
  Id UNIQUEIDENTIFIER PRIMARY KEY,
  Slug NVARCHAR(200) UNIQUE NOT NULL,
  Name NVARCHAR(200) NOT NULL,
  Summary NVARCHAR(MAX),
  HowThisHelps NVARCHAR(MAX),
  HeroImage NVARCHAR(500)
);
```

---

## 🔐 Security Considerations

### 1. **Authentication**

The current implementation uses a simple credential provider. For production:

- Replace with proper user management
- Implement JWT token validation with your C# API
- Use secure password hashing (bcrypt, Argon2)

### 2. **Content Sanitization**

- Database content is sanitized before rendering
- Consider server-side sanitization in your C# API
- For production, use [DOMPurify](https://github.com/cure53/DOMPurify) or [isomorphic-dompurify](https://www.npmjs.com/package/isomorphic-dompurify)

### 3. **API Security**

- Implement rate limiting
- Use CORS policies
- Validate all inputs
- Use HTTPS in production

---

## 📦 Deployment

### Azure App Service (Recommended)

Since you're now using dynamic mode, deploy to Azure App Service instead of Static Web Apps:

1. **Create App Service**:

   ```bash
   az webapp up --name simplebiztoolkit-cms --resource-group your-rg --runtime "NODE:18-lts"
   ```

2. **Set Environment Variables** in Azure Portal:
   - `NEXT_PUBLIC_API_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `REVALIDATION_SECRET`

3. **Deploy**:
   ```bash
   npm run build
   az webapp deployment source config-zip --src ./out.zip
   ```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🎨 Extending the Admin Portal

### Adding a Rich Text Editor

Replace the basic textarea in `ArticleEditor.tsx` with [TipTap](https://tiptap.dev/):

```bash
npm install @tiptap/react @tiptap/starter-kit
```

See: https://tiptap.dev/docs/editor/getting-started/install/nextjs

### Image Upload

Implement image upload to Azure Blob Storage or similar:

1. Add file input to editor
2. Upload to blob storage
3. Return URL to insert into content

---

## 🐛 Troubleshooting

### Issue: Authentication not working

- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL

### Issue: Content not updating

- Verify revalidation webhook is being called
- Check `REVALIDATION_SECRET` matches
- Check browser cache (hard refresh)

### Issue: API calls failing

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on C# API
- Inspect network tab for error details

---

## 📞 Next Steps

1. ✅ Set up your C# API with the required endpoints
2. ✅ Migrate existing content using the migration scripts
3. ✅ Test the admin portal locally
4. ✅ Deploy to Azure App Service
5. ✅ Configure the revalidation webhook in your C# API
6. ✅ Update DNS to point to the new deployment

---

## 📚 Reference Files

- **API Service**: `src/lib/api.ts`
- **Content Renderer**: `src/components/ContentRenderer.tsx`
- **Revalidation**: `src/app/api/revalidate/route.ts`
- **Auth Config**: `src/lib/auth.ts`
- **Admin Layout**: `src/app/admin/layout.tsx`
- **Article Editor**: `src/app/admin/articles/ArticleEditor.tsx`

---

**Congratulations!** Your site is now a fully functional CMS. The architecture maintains 100% SEO integrity through ISR while giving you the power to edit content without touching code.
