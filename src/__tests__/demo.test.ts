/**
 * Simple demonstration test using Cat Facts API directly
 * This bypasses the ES module issues and shows real API testing
 */

describe("Cat Facts API Demo", () => {
  const CAT_FACT_API = "https://catfact.ninja/fact";

  it("should fetch a cat fact using native fetch", async () => {
    const response = await fetch(CAT_FACT_API);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("fact");
    expect(data).toHaveProperty("length");
    expect(typeof data.fact).toBe("string");
    expect(typeof data.length).toBe("number");
    expect(data.fact.length).toBeGreaterThan(0);

    console.log("🐱 Cat Fact:", data.fact);
  }, 10000);

  it("should fetch multiple cat facts concurrently", async () => {
    const promises = Array.from({ length: 5 }, () => fetch(CAT_FACT_API));

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`⏱️  Fetched 5 cat facts in ${endTime - startTime}ms`);

    expect(responses).toHaveLength(5);

    for (const response of responses) {
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("fact");
      console.log("🐱", data.fact.substring(0, 50) + "...");
    }
  }, 15000);

  it("should fetch cat breeds", async () => {
    const response = await fetch("https://catfact.ninja/breeds?limit=3");

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeLessThanOrEqual(3);

    data.data.forEach((breed: any) => {
      expect(breed).toHaveProperty("breed");
      expect(breed).toHaveProperty("country");
      console.log("🐱 Breed:", breed.breed, "from", breed.country);
    });
  }, 10000);

  it("should handle network errors gracefully", async () => {
    try {
      const response = await fetch(
        "https://invalid-domain-does-not-exist-12345.com/api"
      );
      // If we get here, the request somehow succeeded (shouldn't happen)
      expect(response.ok).toBe(false);
    } catch (error) {
      // This is expected for invalid domains
      expect(error).toBeDefined();
      console.log(
        "✅ Network error handled correctly:",
        (error as Error).message
      );
    }
  }, 10000);

  it("should demonstrate concurrency control concept", async () => {
    const REQUESTS = 10;
    const BATCH_SIZE = 3;

    console.log(
      `\n🚀 Demonstrating batch processing: ${REQUESTS} requests in batches of ${BATCH_SIZE}`
    );

    // Split requests into batches to simulate concurrency control
    const batches = [];
    for (let i = 0; i < REQUESTS; i += BATCH_SIZE) {
      const batch = Array.from(
        { length: Math.min(BATCH_SIZE, REQUESTS - i) },
        () => {
          return fetch(CAT_FACT_API).then((r) => r.json());
        }
      );
      batches.push(batch);
    }

    const startTime = Date.now();

    // Process batches sequentially (simulating concurrency limit)
    const allResults = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(batch);
      allResults.push(...batchResults);
      console.log(`📦 Completed batch of ${batchResults.length} requests`);
    }

    const endTime = Date.now();

    expect(allResults).toHaveLength(REQUESTS);
    console.log(
      `⏱️  Total time: ${endTime - startTime}ms for ${REQUESTS} requests`
    );
    console.log(
      `📊 Average per request: ${(endTime - startTime) / REQUESTS}ms`
    );

    // Verify all results are valid
    allResults.forEach((data) => {
      expect(data).toHaveProperty("fact");
      expect(data).toHaveProperty("length");
    });
  }, 30000);
});
