import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";
import type {
  BatchRequestInit,
  FetchArgs,
  BatchFetchResult,
  BatchFetchConfig,
} from "./types.js";
import { globalFetchStore } from "./store.js";

/**
 * Enhanced fetch function with concurrency control
 * Drop-in replacement for browser's fetch API with additional batch options
 */
export async function fetch(
  resource: RequestInfo | URL,
  init?: BatchRequestInit
): Promise<Response> {
  // Extract batch-specific options
  const { concurrency, timeout, ...fetchInit } = init || {};

  // Use per-request concurrency if specified, otherwise use global
  const effectiveConcurrency = concurrency || globalFetchStore.concurrency;

  // Create a single-item batch for this fetch
  const batch = new Batch({ concurrency: effectiveConcurrency });

  // Add the fetch task
  batch.add(async () => {
    return await globalFetchStore.executeFetch(resource, {
      ...fetchInit,
      ...(timeout && { timeout }),
    });
  });

  // Process the batch and return the single result
  const results = await batch.process();
  const result = results[0];

  if (result.responseStatus === TaskResponseStatus.SUCCESS) {
    return result.response as Response;
  } else {
    throw result.error || new Error("Fetch failed");
  }
}

/**
 * Fetch multiple resources with concurrency control
 * Takes an array of resources or fetch argument objects and returns responses
 */
export async function fetchList(
  requests: (RequestInfo | URL | FetchArgs)[],
  globalConfig?: BatchFetchConfig
): Promise<BatchFetchResult[]> {
  if (requests.length === 0) {
    return [];
  }

  // Apply global config if provided
  if (globalConfig) {
    globalFetchStore.updateConfig(globalConfig);
  }

  // Create a new batch processor for each fetchList call
  const batch = new Batch({ concurrency: globalFetchStore.concurrency });

  // Convert requests to standardized format and add to batch
  const standardizedRequests: FetchArgs[] = requests.map((request, index) => {
    if (
      typeof request === "string" ||
      request instanceof URL ||
      request instanceof Request
    ) {
      return { resource: request, init: undefined };
    } else {
      return request as FetchArgs;
    }
  });

  // Add all requests to the batch
  standardizedRequests.forEach((reqArgs, index) => {
    batch.add(async () => {
      try {
        const response = await globalFetchStore.executeFetch(
          reqArgs.resource,
          reqArgs.init
        );
        return {
          resource: reqArgs.resource,
          init: reqArgs.init,
          response,
          error: undefined,
          success: true,
          index,
        } as BatchFetchResult;
      } catch (error) {
        return {
          resource: reqArgs.resource,
          init: reqArgs.init,
          response: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
          success: false,
          index,
        } as BatchFetchResult;
      }
    });
  });

  // Process all requests
  const results = await batch.process();

  // Extract the actual results and maintain order
  return results.map((result) => {
    if (result.responseStatus === TaskResponseStatus.SUCCESS) {
      return result.response as BatchFetchResult;
    } else {
      // This shouldn't happen since we handle errors within the task
      const index = results.indexOf(result);
      const reqArgs = standardizedRequests[index];
      return {
        resource: reqArgs.resource,
        init: reqArgs.init,
        response: undefined,
        error: result.error || new Error("Unknown error"),
        success: false,
        index,
      } as BatchFetchResult;
    }
  });
}

/**
 * Utility function to create fetch arguments object
 */
export function createFetchArgs(
  resource: RequestInfo | URL,
  init?: BatchRequestInit
): FetchArgs {
  return { resource, init };
}

/**
 * Utility function to filter successful results from fetchList
 */
export function getSuccessfulResults(
  results: BatchFetchResult[]
): BatchFetchResult[] {
  return results.filter((result) => result.success);
}

/**
 * Utility function to filter failed results from fetchList
 */
export function getFailedResults(
  results: BatchFetchResult[]
): BatchFetchResult[] {
  return results.filter((result) => !result.success);
}

/**
 * Utility function to extract just the responses from successful results
 */
export function extractResponses(results: BatchFetchResult[]): Response[] {
  return getSuccessfulResults(results)
    .map((result) => result.response!)
    .filter(Boolean);
}

/**
 * Utility function to extract just the errors from failed results
 */
export function extractErrors(results: BatchFetchResult[]): Error[] {
  return getFailedResults(results)
    .map((result) => result.error!)
    .filter(Boolean);
}
