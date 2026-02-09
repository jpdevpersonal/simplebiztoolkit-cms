# Deployment notes (Next.js)

This project has been migrated to Next.js App Router.

## Recommended: Vercel
- Push the repo to GitHub.
- Import in Vercel.
- Build command: `npm run build`
- Output: handled by Vercel automatically.

## Node server (any VPS)
- Build: `npm run build`
- Start: `npm run start`
- Run behind a reverse proxy (nginx/Caddy) and enable HTTPS.

## Static hosting
This project currently uses Next features that expect a server runtime (e.g. dynamic `opengraph-image`).
If you want a fully static export, we can refactor to remove server-only features and set `output: 'export'`.

## SEO endpoints
- `GET /sitemap.xml` is generated from product categories + blog posts.
- `GET /robots.txt` references the sitemap automatically.

