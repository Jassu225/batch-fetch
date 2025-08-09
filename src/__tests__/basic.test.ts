import { describe, it, expect } from "@jest/globals";

// Simple tests to verify Jest setup works
describe("Basic functionality", () => {
  it("should have a working test environment", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have fetch available", () => {
    expect(fetch).toBeDefined();
    expect(typeof fetch).toBe("function");
  });

  it("should have URL constructor available", () => {
    expect(URL).toBeDefined();
    const url = new URL("https://example.com");
    expect(url.origin).toBe("https://example.com");
  });

  it("should have Request constructor available", () => {
    expect(Request).toBeDefined();
    const request = new Request("https://example.com");
    expect(request.url).toBe("https://example.com/");
  });

  it("should have AbortController available", () => {
    expect(AbortController).toBeDefined();
    const controller = new AbortController();
    expect(controller.abort).toBeDefined();
    expect(controller.signal).toBeDefined();
  });
});
