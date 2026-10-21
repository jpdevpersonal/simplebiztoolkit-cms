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
  /** The free-guide route remains a placeholder until a real delivery flow exists. */
  freeGuideAvailable: false,
} as const;
