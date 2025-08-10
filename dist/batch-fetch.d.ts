import type { BatchRequestInit, FetchRequestInit, FetchArgs, BatchFetchResult, BatchFetchConfig } from "./types";
/**
 * Enhanced fetch function with timeout support
 * Drop-in replacement for browser's fetch API with additional timeout options
 * Uses global store to manage request queuing if concurrency limit is reached
 */
export declare function fetch(resource: RequestInfo | URL, init?: FetchRequestInit): Promise<Response>;
/**
 * Fetch multiple resources with concurrency control
 * Takes an array of resources or fetch argument objects and returns responses
 */
export declare function fetchList(requests: (RequestInfo | URL | FetchArgs)[], overrideConfig?: Partial<BatchFetchConfig>): Promise<BatchFetchResult[]>;
/**
 * Utility function to create fetch arguments object
 */
export declare function createFetchArgs(resource: RequestInfo | URL, init?: BatchRequestInit): FetchArgs;
/**
 * Utility function to filter successful results from fetchList
 */
export declare function getSuccessfulResults(results: BatchFetchResult[]): BatchFetchResult[];
/**
 * Utility function to filter failed results from fetchList
 */
export declare function getFailedResults(results: BatchFetchResult[]): BatchFetchResult[];
/**
 * Utility function to extract just the responses from successful results
 */
export declare function extractResponses(results: BatchFetchResult[]): Response[];
/**
 * Utility function to extract just the errors from failed results
 */
export declare function extractErrors(results: BatchFetchResult[]): Error[];
