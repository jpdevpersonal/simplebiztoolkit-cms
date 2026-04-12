import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { site } from "@/config/site";

type RevalidateRequestBody = {
  paths?: unknown;
  tags?: unknown;
  type?: unknown;
  slug?: unknown;
  previousSlug?: unknown;
};

type RevalidatePathTarget = {
  path: string;
  type?: "page" | "layout";
};

type WarmResult = {
  attempted: boolean;
  baseUrl?: string;
  warmedPaths: string[];
  failedPaths: string[];
};

type EdgePurgeResult = {
  attempted: boolean;
  ok?: boolean;
  status?: number;
  error?: string;
};

function parseStringArray(value: unknown, field: "paths" | "tags") {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid ${field} payload`);
  }

  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function uniquePathTargets(targets: RevalidatePathTarget[]) {
  return Array.from(
    new Map(
      targets.map((target) => [
        `${target.path}:${target.type ?? "path"}`,
        target,
      ]),
    ).values(),
  );
}

function isConcretePublicPath(path: string) {
  return (
    path.startsWith("/") && !path.startsWith("/api") && !/\[[^/]+\]/.test(path)
  );
}

function getWarmBaseUrl() {
  const configuredBaseUrl = process.env.REVALIDATE_WARM_BASE_URL?.trim();
  const baseUrl = configuredBaseUrl || site.url;

  if (!/^https?:\/\//i.test(baseUrl)) {
    return undefined;
  }

  return baseUrl.replace(/\/+$/, "");
}

async function warmConcretePaths(
  targets: RevalidatePathTarget[],
): Promise<WarmResult> {
  if (process.env.REVALIDATE_WARMING_ENABLED !== "true") {
    return {
      attempted: false,
      warmedPaths: [],
      failedPaths: [],
    };
  }

  const baseUrl = getWarmBaseUrl();
  if (!baseUrl) {
    return {
      attempted: false,
      warmedPaths: [],
      failedPaths: [],
    };
  }

  const concretePaths = Array.from(
    new Set(targets.map((target) => target.path).filter(isConcretePublicPath)),
  );

  if (concretePaths.length === 0) {
    return {
      attempted: true,
      baseUrl,
      warmedPaths: [],
      failedPaths: [],
    };
  }

  const warmAttempts = await Promise.allSettled(
    concretePaths.map(async (path) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "x-revalidate-warm": "1",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return path;
    }),
  );

  const warmedPaths: string[] = [];
  const failedPaths: string[] = [];

  warmAttempts.forEach((attempt, index) => {
    const path = concretePaths[index];
    if (attempt.status === "fulfilled") {
      warmedPaths.push(attempt.value);
    } else {
      failedPaths.push(path);
    }
  });

  return {
    attempted: true,
    baseUrl,
    warmedPaths,
    failedPaths,
  };
}

async function triggerEdgePurge(
  targets: RevalidatePathTarget[],
  tags: string[],
): Promise<EdgePurgeResult> {
  const purgeUrl = process.env.EDGE_CACHE_PURGE_URL?.trim();
  if (!purgeUrl) {
    return { attempted: false };
  }

  const token = process.env.EDGE_CACHE_PURGE_TOKEN?.trim();
  const requestedPaths = targets.map((target) => target.path);
  const concretePaths = requestedPaths.filter(isConcretePublicPath);

  try {
    const response = await fetch(purgeUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        requestedPaths,
        concretePaths,
        tags,
        siteUrl: getWarmBaseUrl() ?? site.url,
        source: "/api/revalidate",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return {
        attempted: true,
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }

    return {
      attempted: true,
      ok: true,
      status: response.status,
    };
  } catch (error) {
    return {
      attempted: true,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizeLegacyTargets(body: RevalidateRequestBody): {
  paths: RevalidatePathTarget[];
  tags: string[];
} | null {
  const type = parseOptionalString(body.type);
  const slug = parseOptionalString(body.slug);
  const previousSlug = parseOptionalString(body.previousSlug);

  if (!type) {
    return null;
  }

  switch (type) {
    case "product":
      return {
        paths: [
          { path: "/templates" },
          { path: "/templates/[categorySlug]", type: "page" },
          { path: "/templates/[categorySlug]/[productSlug]", type: "page" },
          { path: "/sitemap.xml" },
        ],
        tags: ["products"],
      };
    case "category":
      return {
        paths: [
          { path: "/templates" },
          { path: "/templates/[categorySlug]", type: "page" },
          { path: "/templates/[categorySlug]/[productSlug]", type: "page" },
          { path: "/sitemap.xml" },
        ],
        tags: slug ? ["products", `category-${slug}`] : ["products"],
      };
    case "page": {
      const pageSlugs = Array.from(
        new Set([slug, previousSlug].filter(Boolean)),
      );
      return {
        paths: uniquePathTargets([
          { path: "/pages" },
          { path: "/pages/[menuItemSlug]", type: "page" },
          { path: "/pages/[menuItemSlug]/[categorySlug]", type: "page" },
          { path: "/sitemap.xml" },
          ...pageSlugs.map((pageSlug) => ({ path: `/${pageSlug}` })),
        ]),
        tags: pageSlugs.map((pageSlug) => `page-${pageSlug}`),
      };
    }
    case "all":
      return {
        paths: [
          { path: "/templates" },
          { path: "/templates/[categorySlug]", type: "page" },
          { path: "/templates/[categorySlug]/[productSlug]", type: "page" },
          { path: "/pages" },
          { path: "/pages/[menuItemSlug]", type: "page" },
          { path: "/pages/[menuItemSlug]/[categorySlug]", type: "page" },
          { path: "/[slug]", type: "page" },
          { path: "/sitemap.xml" },
        ],
        tags: ["products"],
      };
    default:
      throw new Error("Invalid revalidation type");
  }
}

function normalizeTargets(body: RevalidateRequestBody) {
  const explicitPaths: RevalidatePathTarget[] = parseStringArray(
    body.paths,
    "paths",
  ).map((path) => ({
    path,
  }));
  const explicitTags = parseStringArray(body.tags, "tags");

  if (explicitPaths.length > 0 || explicitTags.length > 0) {
    return {
      mode: "targeted",
      paths: explicitPaths,
      tags: explicitTags,
    };
  }

  const legacyTargets = normalizeLegacyTargets(body);

  if (legacyTargets) {
    return {
      mode: "legacy",
      paths: legacyTargets.paths,
      tags: legacyTargets.tags,
    };
  }

  return {
    mode: "empty",
    paths: [] as RevalidatePathTarget[],
    tags: [] as string[],
  };
}

export async function POST(request: NextRequest) {
  const expectedSecret =
    process.env.REVALIDATE_SECRET ?? process.env.REVALIDATION_SECRET;
  const providedSecret =
    request.headers.get("x-revalidate-secret") ??
    request.headers.get("x-revalidation-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    console.error("[revalidate] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as RevalidateRequestBody;
    const { mode, paths, tags } = normalizeTargets(body);

    if (paths.length === 0 && tags.length === 0) {
      console.info("[revalidate] No paths or tags supplied");
      return NextResponse.json({
        revalidated: false,
        paths,
        tags,
        message: "No paths or tags provided",
      });
    }

    console.info("[revalidate] Revalidating", {
      mode,
      paths: paths.map((target) => target.path),
      tags,
    });

    for (const target of paths) {
      if (target.type) {
        revalidatePath(target.path, target.type);
      } else {
        revalidatePath(target.path);
      }
    }

    for (const tag of tags) {
      revalidateTag(tag);
    }

    const [warmResult, edgePurgeResult] = await Promise.all([
      warmConcretePaths(paths),
      triggerEdgePurge(paths, tags),
    ]);

    if (warmResult.failedPaths.length > 0) {
      console.warn("[revalidate] Warm-up failed for some paths", {
        baseUrl: warmResult.baseUrl,
        failedPaths: warmResult.failedPaths,
      });
    }

    if (edgePurgeResult.attempted && edgePurgeResult.ok === false) {
      console.warn("[revalidate] Edge purge webhook failed", edgePurgeResult);
    }

    return NextResponse.json({
      revalidated: true,
      mode,
      paths: paths.map((target) => target.path),
      tags,
      warm: warmResult,
      edgePurge: edgePurgeResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.startsWith("Invalid ")) {
      console.error("[revalidate] Invalid request", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("[revalidate] Failed", message);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
