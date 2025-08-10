import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { fetch, fetchList, GlobalConfig, GlobalFetchStore } from "../index";

describe("Real API Tests", () => {
  let originalFetch: typeof globalThis.fetch;
  let maxConcurrentCalls = 0,
    currentConcurrentCalls = 0;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (...args: Parameters<typeof originalFetch>) => {
      currentConcurrentCalls++;
      maxConcurrentCalls = Math.max(maxConcurrentCalls, currentConcurrentCalls);
      try {
        return await originalFetch(...args);
      } finally {
        currentConcurrentCalls--;
      }
    };
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    maxConcurrentCalls = 0;
    currentConcurrentCalls = 0;
    // Reset configuration before each test
    GlobalConfig.instance.updateConfig({
      concurrency: 3,
      timeout: 10000,
      defaultInit: {},
    });
  });

  describe("Cat Facts API Integration", () => {
    const CAT_FACT_API = "https://catfact.ninja/fact";
    const CAT_BREEDS_API = "https://catfact.ninja/breeds";

    it("should fetch a single cat fact", async () => {
      const response = await fetch(CAT_FACT_API);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("fact");
      expect(data).toHaveProperty("length");
      expect(typeof data.fact).toBe("string");
      expect(typeof data.length).toBe("number");
    }, 15000);

    it("should fetch multiple cat facts concurrently", async () => {
      const requests = Array.from({ length: 5 }, () => CAT_FACT_API);

      const results = await fetchList(requests, { concurrency: 2 });

      expect(maxConcurrentCalls).toBe(2);

      // All requests should succeed
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.index).toBe(index);
        expect(result.response?.ok).toBe(true);
        expect(result.error).toBeUndefined();
      });

      // Verify response data
      for (const result of results) {
        if (result.response) {
          const data = await result.response.json();
          expect(data).toHaveProperty("fact");
          expect(data).toHaveProperty("length");
        }
      }
    }, 20000);

    it("should handle mixed API endpoints", async () => {
      const requests = [
        CAT_FACT_API,
        `${CAT_BREEDS_API}?limit=5`,
        CAT_FACT_API,
        `${CAT_BREEDS_API}?limit=3`,
      ];

      const results = await fetchList(requests);

      expect(maxConcurrentCalls).toBe(3);

      expect(results).toHaveLength(4);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.response?.ok).toBe(true);
      });

      // Check specific response structures
      const factData1 = await results[0].response!.json();
      expect(factData1).toHaveProperty("fact");

      const breedsData1 = await results[1].response!.json();
      expect(breedsData1).toHaveProperty("data");
      expect(Array.isArray(breedsData1.data)).toBe(true);

      const factData2 = await results[2].response!.json();
      expect(factData2).toHaveProperty("fact");

      const breedsData2 = await results[3].response!.json();
      expect(breedsData2).toHaveProperty("data");
      expect(Array.isArray(breedsData2.data)).toBe(true);
    }, 20000);

    it("should respect concurrency limits", async () => {
      const requests = Array.from({ length: 10 }, () => CAT_FACT_API);

      // Set low concurrency to test queue management
      const results = await fetchList(requests, { concurrency: 2 });

      expect(maxConcurrentCalls).toBe(2);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    }, 30000);

    it("should use override config without affecting global state", async () => {
      // Get initial global concurrency
      const initialStatus = GlobalFetchStore.instance.getStatus();
      const initialConcurrency = initialStatus.concurrency;

      const requests = Array.from({ length: 3 }, () => CAT_FACT_API);

      // Use override config with different concurrency
      const results = await fetchList(requests, {
        concurrency: 1,
        timeout: 5000,
        defaultInit: { headers: { "X-Test": "override" } },
      });

      expect(maxConcurrentCalls).toBe(1);

      // Verify results
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Verify global state is unchanged
      const finalStatus = GlobalFetchStore.instance.getStatus();
      expect(finalStatus.concurrency).toBe(initialConcurrency);
      expect(finalStatus.config.timeout).toBe(10000); // Should still be the beforeEach value
    }, 20000);

    it("should limit concurrent fetch calls using global store", async () => {
      // Set low concurrency to test limiting
      GlobalConfig.instance.updateConfig({ concurrency: 2 });

      // Create multiple fetch promises that should be limited by concurrency
      const fetchPromises = Array.from({ length: 5 }, (_, i) =>
        fetch(`${CAT_FACT_API}?index=${i}`)
      );

      // All should complete successfully despite concurrency limit
      const responses = await Promise.all(fetchPromises);

      expect(maxConcurrentCalls).toBe(2);

      responses.forEach((response, i) => {
        expect(response.ok).toBe(true);
      });

      // Verify that the global store managed the concurrency
      const status = GlobalFetchStore.instance.getStatus();
      expect(status.concurrency).toBe(2);
    }, 20000);

    it("should handle request with custom headers", async () => {
      const response = await fetch(CAT_FACT_API, {
        headers: {
          "User-Agent": "batch-fetch-test/1.0",
          Accept: "application/json",
        },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("fact");
    }, 15000);

    it("should handle URL objects", async () => {
      const url = new URL(CAT_FACT_API);
      const response = await fetch(url);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("fact");
    }, 15000);

    it("should handle Request objects", async () => {
      const request = new Request(CAT_FACT_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const response = await fetch(request);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("fact");
    }, 15000);
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const requests = [
        "https://catfact.ninja/fact",
        "https://invalid-domain-that-does-not-exist-12345.com/api",
        "https://catfact.ninja/fact",
      ];

      const results = await fetchList(requests, { concurrency: 1 });

      expect(maxConcurrentCalls).toBe(1);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      expect(results[2].success).toBe(true);
    }, 20000);

    it("should handle 404 errors", async () => {
      const requests = [
        "https://catfact.ninja/fact",
        "https://catfact.ninja/nonexistent-endpoint",
      ];

      const results = await fetchList(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // 404 is still a successful fetch
      expect(results[1].response?.status).toBe(404);
    }, 20000);
  });

  describe("Configuration", () => {
    it("should apply global configuration", async () => {
      GlobalConfig.instance.updateConfig({
        concurrency: 1,
        timeout: 15000,
        defaultInit: {
          headers: {
            "User-Agent": "batch-fetch-global-test/1.0",
          },
        },
      });

      const status = GlobalFetchStore.instance.getStatus();
      expect(status.concurrency).toBe(1);
      expect(status.config.timeout).toBe(15000);

      const response = await fetch("https://catfact.ninja/fact");
      expect(response.ok).toBe(true);
    }, 20000);

    it("should track active requests", async () => {
      const requests = Array.from(
        { length: 5 },
        () => "https://catfact.ninja/fact"
      );

      const fetchPromise = fetchList(requests, { concurrency: 2 });

      // Note: In real scenarios, checking active requests during execution
      // might be tricky due to timing, so we just verify the final state
      const results = await fetchPromise;

      expect(maxConcurrentCalls).toBe(2);

      const finalStatus = GlobalFetchStore.instance.getStatus();
      expect(finalStatus.activeRequests).toBe(0);
      expect(results).toHaveLength(5);
    }, 25000);
  });

  describe("Utility Functions", () => {
    it("should work with utility functions on real data", async () => {
      const requests = [
        "https://catfact.ninja/fact",
        "https://invalid-domain-12345.com/api",
        "https://catfact.ninja/fact",
      ];

      const results = await fetchList(requests);

      // Import utility functions
      const {
        getSuccessfulResults,
        getFailedResults,
        extractResponses,
        extractErrors,
      } = await import("../batch-fetch.js");

      const successful = getSuccessfulResults(results);
      const failed = getFailedResults(results);
      const responses = extractResponses(results);
      const errors = extractErrors(results);

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);
      expect(responses).toHaveLength(2);
      expect(errors).toHaveLength(1);

      // Verify we can actually use the responses
      for (const response of responses) {
        const data = await response.json();
        expect(data).toHaveProperty("fact");
      }
    }, 20000);
  });
});
