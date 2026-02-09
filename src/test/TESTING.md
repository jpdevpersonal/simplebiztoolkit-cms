# Testing Guide

This project uses **Vitest** and **React Testing Library** for unit testing.

## Setup

All testing dependencies are already installed:

- `vitest` - Fast unit test framework
- `@vitest/ui` - UI for running tests
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM implementation for Node.js

## Configuration

### Vite Configuration

The [vite.config.ts](../../vite.config.ts) includes Vitest configuration:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

### Test Setup

The [src/test/setup.ts](./setup.ts) file:
- Extends Vitest's `expect` with React Testing Library matchers
- Configures automatic cleanup after each test
- Ensures consistent test environment

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm test

# Run all tests once
npm test -- --run

# Run tests with UI dashboard
npm test:ui

# Run specific test file
npm test HomePage.test.tsx

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

Tests are organized alongside the components they test:

```
src/
├── pages/
│   ├── HomePage/
│   │   ├── HomePage.tsx        # Component
│   │   ├── HomePage.test.tsx   # Tests
│   │   ├── index.ts            # Barrel export
│   │   └── README.md           # Test documentation
│   └── ...
├── components/
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx
│   │   └── index.ts
│   └── ...
└── test/
    ├── setup.ts                # Global test setup
    └── mocks/                  # Shared mock implementations
        ├── react-router-dom.tsx
        └── components.tsx
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Feature Category', () => {
    it('should do something specific', () => {
      // Arrange - Set up test data and render component
      render(<ComponentName />);
      
      // Act - Interact with the component (if needed)
      const element = screen.getByRole('button');
      
      // Assert - Verify expected behavior
      expect(element).toBeInTheDocument();
    });
  });
});
```

### Mocking Dependencies

#### Mock Components
```typescript
vi.mock('../../components/Seo', () => ({
  default: ({ title, description }: any) => (
    <div data-testid="seo-mock" data-title={title} data-description={description} />
  ),
}));
```

#### Mock Modules
```typescript
vi.mock('../../data/products', () => ({
  categories: [
    {
      slug: 'test-category',
      name: 'Test Category',
      items: [
        { title: 'Product 1', price: '$10' },
      ],
    },
  ],
}));
```

#### Mock Router
```typescript
import { MemoryRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};
```

### Common Testing Patterns

#### Testing Text Content
```typescript
// Exact match
expect(screen.getByText('Exact Text')).toBeInTheDocument();

// Regex match (case insensitive)
expect(screen.getByText(/partial text/i)).toBeInTheDocument();

// Check for multiple occurrences
const elements = screen.getAllByText(/text/i);
expect(elements).toHaveLength(3);
```

#### Testing Roles
```typescript
// Buttons
const button = screen.getByRole('button', { name: /Click me/i });

// Links
const link = screen.getByRole('link', { name: /Learn more/i });

// Headings
const heading = screen.getByRole('heading', { name: /Title/i, level: 1 });

// Images
const image = screen.getByRole('img', { name: /Alt text/i });
```

#### Testing Attributes
```typescript
const link = screen.getByRole('link', { name: /External/i });

expect(link).toHaveAttribute('href', 'https://example.com');
expect(link).toHaveAttribute('target', '_blank');
expect(link).toHaveAttribute('rel', 'noopener noreferrer');
```

#### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event';

it('should handle click events', async () => {
  const user = userEvent.setup();
  render(<Button onClick={mockFn} />);
  
  const button = screen.getByRole('button');
  await user.click(button);
  
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

#### Testing Forms
```typescript
it('should submit form data', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  
  render(<Form onSubmit={handleSubmit} />);
  
  // Fill out form
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Verify submission
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
  });
});
```

## Best Practices

### 1. Write User-Centric Tests
Test what users see and do, not implementation details.

```typescript
// ✅ Good - Tests user behavior
expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();

// ❌ Bad - Tests implementation
expect(wrapper.find('.submit-button')).toHaveLength(1);
```

### 2. Use Semantic Queries
Prefer queries that mirror how users interact with your app.

**Query Priority:**
1. `getByRole` - Most accessible
2. `getByLabelText` - Form inputs
3. `getByPlaceholderText` - When label is missing
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

### 3. Add Descriptive Comments
Explain the purpose of each test and why it matters.

```typescript
it('should display error for invalid email', async () => {
  // User should see validation feedback immediately
  // This prevents form submission errors
  const user = userEvent.setup();
  render(<EmailForm />);
  
  await user.type(screen.getByLabelText(/email/i), 'invalid-email');
  await user.tab(); // Trigger blur event
  
  expect(screen.getByText(/valid email/i)).toBeInTheDocument();
});
```

### 4. Test One Thing Per Test
Keep tests focused and isolated.

```typescript
// ✅ Good - Focused test
it('should display error message when submission fails', () => {
  // Test implementation
});

it('should clear form after successful submission', () => {
  // Test implementation
});

// ❌ Bad - Testing too much
it('should handle form submission', () => {
  // Tests error handling AND success handling
});
```

### 5. Use beforeEach for Setup
Reset state and mocks before each test.

```typescript
describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ });
});
```

### 6. Test Accessibility
Ensure components are accessible.

```typescript
it('should have proper heading hierarchy', () => {
  render(<Page />);
  
  // Should have exactly one h1
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  
  // Should have section headings
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
});

it('should have descriptive alt text', () => {
  render(<Image src="/photo.jpg" alt="Product showcase" />);
  
  const img = screen.getByRole('img');
  expect(img).toHaveAttribute('alt');
  expect(img.getAttribute('alt')).toBeTruthy();
});
```

## Debugging Tests

### View Rendered Output
```typescript
import { screen } from '@testing-library/react';

// Print the entire DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Use logRoles
```typescript
import { render, logRoles } from '@testing-library/react';

const { container } = render(<Component />);
logRoles(container); // Shows all available roles
```

### Check Available Queries
```typescript
// If element not found, error message shows available elements
screen.getByRole('button', { name: /Submit/i });
// Error will list all buttons with their accessible names
```

## Common Issues

### "Unable to find element"
- Element might not be rendered yet (use `findBy` for async)
- Query might be too specific (check actual rendered text)
- Element might be in a different role than expected

```typescript
// ❌ Synchronous query for async element
expect(screen.getByText('Loading complete')).toBeInTheDocument();

// ✅ Async query
expect(await screen.findByText('Loading complete')).toBeInTheDocument();
```

### "Found multiple elements"
Use `getAllBy*` variant when multiple elements expected.

```typescript
// ❌ When multiple buttons exist
const button = screen.getByRole('button');

// ✅ Get first button or specific button
const buttons = screen.getAllByRole('button');
const submitButton = screen.getByRole('button', { name: /Submit/i });
```

### Mock not working
Ensure mock is defined before importing component.

```typescript
// ✅ Correct order
vi.mock('./dependency');
import Component from './Component';

// ❌ Wrong order
import Component from './Component';
vi.mock('./dependency'); // Too late!
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Playground](https://testing-playground.com/) - Test query strategies
