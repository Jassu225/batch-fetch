/**
 * batch-fetch - A concurrency-controlled fetch library for browsers
 * Built on top of ts-batch-processor for efficient request batching
 */

// Main fetch functions
export {
  fetch,
  fetchList,
  getSuccessfulResults,
  getFailedResults,
  extractResponses,
  extractErrors,
} from "./batch-fetch";

// Configuration and store management
export { default as GlobalFetchStore } from "./store";
export { default as GlobalConfig } from "./config";

// Types
export type {
  BatchFetchConfig,
  BatchRequestInit,
  FetchArgs,
  BatchFetchResult,
  FetchStore,
} from "./types";

// Re-export useful types from ts-batch-processor
export { TaskResponseStatus } from "ts-batch-processor/task";
export type { TaskResult } from "ts-batch-processor/task";

/**
 * Default export provides the main fetch function as a drop-in replacement
 */
export { fetch as default } from "./batch-fetch";
