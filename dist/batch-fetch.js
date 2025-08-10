import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";
import GlobalFetchStore from "./store";
import GlobalConfig from "./config";
/**
 * Enhanced fetch function with timeout support
 * Drop-in replacement for browser's fetch API with additional timeout options
 * Uses global store to manage request queuing if concurrency limit is reached
 */
export async function fetch(resource, init) {
    // Extract timeout option
    const { timeout, ...fetchInit } = init || {};
    // Use the global store to execute fetch
    // The store will queue requests if concurrency limit is reached
    return await GlobalFetchStore.instance.executeFetch(resource, {
        ...fetchInit,
        ...(timeout && { timeout }),
    });
}
/**
 * Fetch multiple resources with concurrency control
 * Takes an array of resources or fetch argument objects and returns responses
 */
export async function fetchList(requests, overrideConfig) {
    if (requests.length === 0) {
        return [];
    }
    // Use override config for this call only, fallback to global config
    const effectiveConfig = {
        ...GlobalConfig.instance.config,
        ...overrideConfig,
    };
    // Create a new batch processor for each fetchList call
    const batch = new Batch({ concurrency: effectiveConfig.concurrency });
    // Convert requests to standardized format and add to batch
    const standardizedRequests = requests.map((request, index) => {
        if (typeof request === "string" ||
            request instanceof URL ||
            request instanceof Request) {
            return { resource: request, init: undefined };
        }
        else {
            return request;
        }
    });
    // Add all requests to the batch
    standardizedRequests.forEach((reqArgs, index) => {
        batch.add(async () => {
            try {
                // Create timeout controller if timeout is specified
                const timeoutMs = reqArgs.init?.timeout || effectiveConfig.timeout;
                const controller = new AbortController();
                const timeoutId = timeoutMs
                    ? setTimeout(() => controller.abort(), timeoutMs)
                    : null;
                try {
                    // Merge default init with provided init
                    const finalInit = {
                        ...effectiveConfig.defaultInit,
                        ...reqArgs.init,
                        signal: controller.signal,
                    };
                    const response = await fetch(reqArgs.resource, finalInit);
                    if (timeoutId)
                        clearTimeout(timeoutId);
                    return {
                        resource: reqArgs.resource,
                        init: reqArgs.init,
                        response,
                        error: undefined,
                        success: true,
                        index,
                    };
                }
                catch (error) {
                    if (timeoutId)
                        clearTimeout(timeoutId);
                    throw error;
                }
            }
            catch (error) {
                return {
                    resource: reqArgs.resource,
                    init: reqArgs.init,
                    response: undefined,
                    error: error instanceof Error ? error : new Error(String(error)),
                    success: false,
                    index,
                };
            }
        });
    });
    // Process all requests
    const results = await batch.process();
    // Extract the actual results and maintain order
    return results.map((result) => {
        if (result.responseStatus === TaskResponseStatus.SUCCESS) {
            return result.response;
        }
        else {
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
            };
        }
    });
}
/**
 * Utility function to filter successful results from fetchList
 */
export function getSuccessfulResults(results) {
    return results.filter((result) => result.success);
}
/**
 * Utility function to filter failed results from fetchList
 */
export function getFailedResults(results) {
    return results.filter((result) => !result.success);
}
/**
 * Utility function to extract just the responses from successful results
 */
export function extractResponses(results) {
    return getSuccessfulResults(results)
        .map((result) => result.response)
        .filter(Boolean);
}
/**
 * Utility function to extract just the errors from failed results
 */
export function extractErrors(results) {
    return getFailedResults(results)
        .map((result) => result.error)
        .filter(Boolean);
}
