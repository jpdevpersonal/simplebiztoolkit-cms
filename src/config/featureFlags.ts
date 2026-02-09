/**
 * Feature Flags Configuration
 *
 * These flags control feature visibility across the site.
 * Values are read from environment variables at build time.
 *
 * To enable/disable features in Azure Static Web Apps:
 * 1. Go to Azure Portal > Your Static Web App > Configuration
 * 2. Add/Update Application Settings with the environment variable name
 * 3. Rebuild and redeploy the site for changes to take effect
 */

export const featureFlags = {
  /**
   * Show "Get Your Free Guide" button across the site
   * Environment variable: NEXT_PUBLIC_NEXT_PUBLIC_ SHOW_FREE_GUIDE_BUTTON
   * Default: true (shown)
   * Set to 'false' in Azure to hide the button
   */
  showFreeGuideButton:
    process.env.NEXT_PUBLIC_SHOW_FREE_GUIDE_BUTTON !== "false",
} as const;
