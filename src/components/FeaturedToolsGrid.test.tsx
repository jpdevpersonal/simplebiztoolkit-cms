/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FeaturedToolsGrid from "./FeaturedToolsGrid";
import type { Tool } from "@/types/tool";

const mockTools: Tool[] = [
  {
    slug: "test-tool-1",
    title: "Test Tool 1",
    tagline: "This is a test tagline",
    bullets: ["Feature 1", "Feature 2", "Feature 3"],
    image: "/images/tools/featured/test-tool-1.webp",
    href: "/tools/test-tool-1",
  },
  {
    slug: "test-tool-2",
    title: "Test Tool 2",
    tagline: "Another test tagline",
    bullets: ["Benefit 1", "Benefit 2"],
    image: "/images/tools/featured/test-tool-2.webp",
    href: "/tools/test-tool-2",
  },
  {
    slug: "test-tool-3",
    title: "Test Tool 3",
    tagline: "Third test tagline",
    bullets: ["Point 1", "Point 2", "Point 3"],
    image: "/images/tools/featured/test-tool-3.webp",
    href: "/tools/test-tool-3",
  },
];

describe("FeaturedToolsGrid", () => {
  describe("Tool Display", () => {
    it("should render all tools", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);
    });

    it("should display tool images", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      const images = screen.getAllByRole("img");

      expect(images.length).toBe(3);
      expect(images[0]).toHaveAttribute(
        "src",
        "/images/tools/featured/test-tool-1.webp",
      );
      expect(images[0]).toHaveAttribute("alt", "Test Tool 1 preview");
    });

    it("should display tool taglines", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      expect(screen.getByText("This is a test tagline")).toBeInTheDocument();
      expect(screen.getByText("Another test tagline")).toBeInTheDocument();
      expect(screen.getByText("Third test tagline")).toBeInTheDocument();
    });

    it("should display tool bullets", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
      expect(screen.getByText("Benefit 1")).toBeInTheDocument();
    });

    it("should display a 'Free online tool' badge for each tool", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      expect(screen.getAllByText("Free online tool").length).toBe(3);
    });

    it("should render CTA links for all tools", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      const ctaAnchors = screen
        .getAllByText(/Try It Free/i)
        .map((el) => el.closest("a"));
      expect(ctaAnchors.length).toBe(3);
      expect(ctaAnchors[0]).toHaveAttribute("href", "/tools/test-tool-1");
    });

    it("should render thumbnail links for each tool", () => {
      const { container } = render(<FeaturedToolsGrid tools={mockTools} />);

      const thumbnailLinks = container.querySelectorAll(
        "a.tool-thumbnail-clickable",
      );
      expect(thumbnailLinks.length).toBe(3);
      expect(thumbnailLinks[0]).toHaveAttribute("href", "/tools/test-tool-1");
    });

    it("should display 'Try It Free' call-to-action text", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      const ctaTexts = screen.getAllByText(/Try It Free/i);
      expect(ctaTexts.length).toBe(3);
    });
  });

  describe("Thumbnail behavior", () => {
    it("should have clickable cursor styling on tool thumbnails", () => {
      render(<FeaturedToolsGrid tools={mockTools} />);

      const images = screen.getAllByRole("img");
      const firstImageContainer = images[0].closest(
        ".tool-thumbnail-clickable",
      );

      expect(firstImageContainer).toHaveClass("tool-thumbnail-clickable");
    });
  });

  describe("Responsive Behavior", () => {
    it("should render in a responsive grid", () => {
      const { container } = render(<FeaturedToolsGrid tools={mockTools} />);

      const gridRow = container.querySelector(".row.g-3");
      expect(gridRow).toBeInTheDocument();

      const gridCols = container.querySelectorAll(".col-md-4");
      expect(gridCols.length).toBe(3);
    });
  });

  describe("Empty State", () => {
    it("should handle empty tools array", () => {
      render(<FeaturedToolsGrid tools={[]} />);

      const images = screen.queryAllByRole("img");
      expect(images.length).toBe(0);
    });
  });
});
