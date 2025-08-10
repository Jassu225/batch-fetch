/**
 * batch-fetch - A concurrency-controlled fetch library for browsers
 * Built on top of ts-batch-processor for efficient request batching
 */
export { fetch, fetchList, createFetchArgs, getSuccessfulResults, getFailedResults, extractResponses, extractErrors, } from "./batch-fetch";
export { default as GlobalFetchStore } from "./store";
export { default as GlobalConfig } from "./config";
export type { BatchFetchConfig, BatchRequestInit, FetchArgs, BatchFetchResult, FetchStore, } from "./types";
export { TaskResponseStatus } from "ts-batch-processor/task";
export type { TaskResult } from "ts-batch-processor/task";
/**
 * Default export provides the main fetch function as a drop-in replacement
 */
export { fetch as default } from "./batch-fetch";
