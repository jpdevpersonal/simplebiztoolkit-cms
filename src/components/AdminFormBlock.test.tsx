import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminFormBlock from "./AdminFormBlock";

const TestIcon = () => <svg data-testid="test-icon" />;

describe("AdminFormBlock", () => {
  it("renders the title", () => {
    render(
      <AdminFormBlock icon={<TestIcon />} title="My Section">
        <p>Body content</p>
      </AdminFormBlock>,
    );
    expect(screen.getByText("My Section")).toBeTruthy();
  });

  it("renders the icon", () => {
    render(
      <AdminFormBlock icon={<TestIcon />} title="Section">
        <p>Body</p>
      </AdminFormBlock>,
    );
    expect(screen.getByTestId("test-icon")).toBeTruthy();
  });

  it("renders children inside the body", () => {
    render(
      <AdminFormBlock icon={<TestIcon />} title="Section">
        <p>Hello World</p>
      </AdminFormBlock>,
    );
    expect(screen.getByText("Hello World")).toBeTruthy();
  });

  it("applies extra className to the wrapper", () => {
    const { container } = render(
      <AdminFormBlock icon={<TestIcon />} title="Section" className="mb-0">
        <p>Body</p>
      </AdminFormBlock>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("admin-form-block");
    expect(wrapper.className).toContain("mb-0");
  });

  it("omits extra class when className is not provided", () => {
    const { container } = render(
      <AdminFormBlock icon={<TestIcon />} title="Section">
        <p>Body</p>
      </AdminFormBlock>,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className.trim()).toBe("admin-form-block");
  });
});
