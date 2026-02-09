# Feature Flag Configuration for Azure Static Web Apps

This document explains how to configure feature flags for the Simple Biz Toolkit website in Azure Static Web Apps.

## Available Feature Flags

### Show Free Guide Button
- **Environment Variable**: `NEXT_PUBLIC_ SHOW_FREE_GUIDE_BUTTON`
- **Default Value**: `true` (button is shown)
- **Possible Values**: 
  - `true` or not set → Button is visible
  - `false` → Button is hidden

This flag controls the visibility of the "Get Your Free Guide" button across all pages of the site, including:
- Mobile sticky CTA bar
- Navigation menu
- Other locations where the button appears

## How to Configure in Azure Static Web Apps

### Option 1: Using Azure Portal (Recommended)

# Feature Flag Configuration

This document explains how feature flags work for Simple Biz Toolkit and how to configure them for Azure Static Web Apps.

## Key point

- This site is exported as static HTML/JS (`output: "export"`). Environment variables prefixed with `NEXT_PUBLIC_` are substituted at build time into the generated files. They are NOT read at runtime by the browser.

## The flag: Show Free Guide Button

- Variable name: `NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON`
- Behavior: if set to the string `"false"` at build time the button will be hidden; any other value or not set → button is shown.

## How to set this value for your deployment

1) Recommended — set it in your GitHub Actions workflow (build-time)

Add the variable to the deploy/build step so it is available during `npm run build`. Example snippet (already used in this repo):

```yaml
      - name: Deploy to Azure Static Web Apps
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          # ... other build settings ...
        env:
          NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON: "false"
```

2) Alternative — GitHub Actions repository variable

- Go to your repo → Settings → Secrets and variables → Actions → Variables
- Add `NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON` with value `false`
- Use it in the workflow with: `NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON: ${{ vars.NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON }}`

3) Azure Portal / CLI

- You can add an application setting in Azure Portal → Your Static Web App → Configuration. However, because this site is a static build, the value must be present at build time — adding it in the portal alone will not change already-built static files. You must trigger a rebuild after changing the portal setting.

## Important: rebuild required

- Changing the environment variable requires a new build and redeploy. Restarting the static site will not recompile HTML/JS with new values.
- Trigger a rebuild by pushing a commit, re-running the GitHub Actions workflow, or creating a new deployment.

## Local testing

- For local builds, create `.env.local` (gitignored) and add:

```
NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON=false
```

Then run:

```bash
npm run build
npm run start
```

## Troubleshooting

- Confirm the exact variable name `NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON` (no extra spaces).
- Check GitHub Actions build logs to ensure the env value appears when `npm run build` runs.
- If you use the Azure portal to set variables, make sure you trigger a new build afterward.

If you want, I can also add a small console.log in the build output to confirm the flag value at build time.
   - Run `npm run build` and `npm run start` to test the static build locally
