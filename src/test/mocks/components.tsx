import { vi } from "vitest";

/**
 * Mock implementations of custom components
 * These mocks allow us to test HomePage in isolation without rendering complex child components
 */

// Mock Seo component - just renders a placeholder div with test data
export const Seo = vi.fn(
  ({ title, description }: { title: string; description: string }) => (
    <div
      data-testid="seo-mock"
      data-title={title}
      data-description={description}
    />
  )
);

// Mock TrustBar component - renders items as a simple list
export const TrustBar = vi.fn(({ items }: { items: string[] }) => (
  <div data-testid="trust-bar-mock">
    {items?.map((item: string, i: number) => (
      <span key={i}>{item}</span>
    ))}
  </div>
));

// Mock EmailCaptureForm component - renders a simple form placeholder
export const EmailCaptureForm = vi.fn(({ source }: { source: string }) => (
  <div data-testid="email-capture-form-mock" data-source={source}>
    Email Form
  </div>
));

// Mock TestimonialGrid component - renders a placeholder
export const TestimonialGrid = vi.fn(() => (
  <div data-testid="testimonial-grid-mock">Testimonials</div>
));

// Mock ProductGrid component - renders product count
export const ProductGrid = vi.fn(({ products }: { products: unknown[] }) => (
  <div
    data-testid="product-grid-mock"
    data-product-count={products?.length || 0}
  >
    {products?.length} Products
  </div>
));
