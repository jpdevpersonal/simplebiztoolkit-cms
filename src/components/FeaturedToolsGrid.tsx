import Image from "next/image";
import Link from "next/link";
import type { Tool } from "@/types/tool";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";

export default function FeaturedToolsGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="row g-3 mt-2">
      {tools.map((tool) => (
        <div className="col-md-4" key={tool.slug}>
          <article className="sb-card h-100 tool-card">
            <div className="overflow-hidden tool-thumb-wrap">
              <span className="tool-card-badge">Free online tool</span>
              <Link
                href={tool.href}
                className="tool-thumbnail-clickable tool-thumb-link"
              >
                <picture className="tool-thumb-picture">
                  <Image
                    src={tool.image || "/images/placeholder-tool.png"}
                    alt={`${tool.title} preview`}
                    className="img-fluid tool-thumb-img"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={75}
                    loading="lazy"
                    unoptimized={shouldBypassNextImageOptimization(tool.image)}
                  />
                </picture>
              </Link>
            </div>
            <div className="tool-card-content">
              <h3 className="tool-card-title">{tool.title}</h3>
              <p className="tool-card-tagline">{tool.tagline}</p>
              <ul className="tool-card-bullets">
                {tool.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <span className="tool-card-cta">
                <Link href={tool.href} className="tool-card-link">
                  Try It Free
                </Link>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12L12 4M12 4H5M12 4v7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
