// import { describe, it, expect } from "@jest/globals";
import {
  getSuccessfulResults,
  getFailedResults,
  extractResponses,
  extractErrors,
} from "../batch-fetch";
import GlobalConfig, { getConfig } from "../config";
import GlobalFetchStore from "../store";
import type { BatchFetchResult } from "../types";

describe("Unit Tests", () => {
  describe("Store Configuration", () => {
    it("should have default configuration", () => {
      const status = GlobalFetchStore.instance.getStatus();
      expect(status.config.concurrency).toBeGreaterThan(0);
      expect(status.activeRequests).toBe(0);
      expect(status.queueLength).toBe(0);
      expect(status.config).toBeDefined();
    });

    it("should update concurrency", () => {
      GlobalConfig.instance.updateConfig({ concurrency: 8 });
      expect(GlobalConfig.instance.concurrency).toBe(8);
      expect(GlobalFetchStore.instance.config.concurrency).toBe(8);
      expect(getConfig().concurrency).toBe(8);
    });

    it("should throw error for invalid concurrency", () => {
      expect(() => {
        GlobalConfig.instance.updateConfig({ concurrency: 0 });
      }).toThrow("Concurrency must be at least 1");

      expect(() => {
        GlobalConfig.instance.updateConfig({ concurrency: -1 });
      }).toThrow("Concurrency must be at least 1");
    });

    it("should update configuration via GlobalConfig", () => {
      GlobalConfig.instance.updateConfig({
        concurrency: 6,
        timeout: 15000,
        defaultInit: { headers: { "User-Agent": "TestAgent" } },
      });

      const config = GlobalConfig.instance.config;
      expect(config.concurrency).toBe(6);
      expect(config.timeout).toBe(15000);
      expect(config.defaultInit).toEqual({
        headers: { "User-Agent": "TestAgent" },
      });
    });

    it("should return immutable config copy", () => {
      const status1 = GlobalFetchStore.instance.getStatus();
      const status2 = GlobalFetchStore.instance.getStatus();

      expect(status1.config).not.toBe(status2.config); // Different objects
      expect(status1.config).toEqual(status2.config); // Same values
    });
  });

  describe("Utility Functions", () => {
    describe("getSuccessfulResults", () => {
      it("should return only successful results", () => {
        const results: BatchFetchResult[] = [
          {
            resource: "https://catfact.ninja/fact",
            response: { ok: true, status: 200 } as Response,
            success: true,
            index: 0,
            error: undefined,
            init: undefined,
          },
          {
            resource: "https://invalid-domain.com/api",
            response: undefined,
            success: false,
            index: 1,
            error: new Error("Failed"),
            init: undefined,
          },
          {
            resource: "https://catfact.ninja/breeds",
            response: { ok: true, status: 201 } as Response,
            success: true,
            index: 2,
            error: undefined,
            init: undefined,
          },
        ];

        const successful = getSuccessfulResults(results);

        expect(successful).toHaveLength(2);
        expect(successful[0].resource).toBe("https://catfact.ninja/fact");
        expect(successful[1].resource).toBe("https://catfact.ninja/breeds");
        expect(successful.every((r) => r.success)).toBe(true);
      });

      it("should return empty array when no successful results", () => {
        const results: BatchFetchResult[] = [
          {
            resource: "https://invalid-domain.com/api",
            response: undefined,
            success: false,
            index: 0,
            error: new Error("Failed"),
            init: undefined,
          },
        ];

        const successful = getSuccessfulResults(results);
        expect(successful).toHaveLength(0);
      });
    });

    describe("getFailedResults", () => {
      it("should return only failed results", () => {
        const results: BatchFetchResult[] = [
          {
            resource: "https://catfact.ninja/fact",
            response: { ok: true, status: 200 } as Response,
            success: true,
            index: 0,
            error: undefined,
            init: undefined,
          },
          {
            resource: "https://invalid-domain.com/api",
            response: undefined,
            success: false,
            index: 1,
            error: new Error("Network error"),
            init: undefined,
          },
        ];

        const failed = getFailedResults(results);

        expect(failed).toHaveLength(1);
        expect(failed[0].resource).toBe("https://invalid-domain.com/api");
        expect(failed.every((r) => !r.success)).toBe(true);
      });
    });

    describe("extractResponses", () => {
      it("should extract responses from successful results", () => {
        const response1 = {
          ok: true,
          status: 200,
          json: async () => ({ id: 1 }),
        } as Response;

        const results: BatchFetchResult[] = [
          {
            resource: "https://catfact.ninja/fact",
            response: response1,
            success: true,
            index: 0,
            error: undefined,
            init: undefined,
          },
          {
            resource: "https://invalid-domain.com/api",
            response: undefined,
            success: false,
            index: 1,
            error: new Error("Failed"),
            init: undefined,
          },
        ];

        const responses = extractResponses(results);

        expect(responses).toHaveLength(1);
        expect(responses[0]).toBe(response1);
      });
    });

    describe("extractErrors", () => {
      it("should extract errors from failed results", () => {
        const error1 = new Error("Network error");

        const results: BatchFetchResult[] = [
          {
            resource: "https://catfact.ninja/fact",
            response: { ok: true, status: 200 } as Response,
            success: true,
            index: 0,
            error: undefined,
            init: undefined,
          },
          {
            resource: "https://invalid-domain.com/api",
            response: undefined,
            success: false,
            index: 1,
            error: error1,
            init: undefined,
          },
        ];

        const errors = extractErrors(results);

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBe(error1);
      });
    });
  });
});
