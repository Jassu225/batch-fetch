/**
 * batch-fetch - A concurrency-controlled fetch library for browsers
 * Built on top of ts-batch-processor for efficient request batching
 */
// Main fetch functions
export { fetch, fetchList, createFetchArgs, getSuccessfulResults, getFailedResults, extractResponses, extractErrors, } from "./batch-fetch.js";
// Configuration and store management
export { configureBatchFetch, getFetchStatus, globalFetchStore, } from "./store.js";
// Re-export useful types from ts-batch-processor
export { TaskResponseStatus } from "ts-batch-processor/task";
/**
 * Default export provides the main fetch function as a drop-in replacement
 */
export { fetch as default } from "./batch-fetch.js";
