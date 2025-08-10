import type { BatchFetchConfig, FetchStore, InternalRequestInit } from "./types";
/**
 * Global store for managing fetch concurrency across the entire application
 */
export default class GlobalFetchStore implements FetchStore {
    private _activeRequests;
    private _requestQueue;
    private static _instance;
    private constructor();
    static get instance(): GlobalFetchStore;
    get concurrency(): number;
    get activeRequests(): number;
    get requestQueue(): Array<() => Promise<void>>;
    get config(): BatchFetchConfig;
    /**
     * Execute a fetch request with concurrency management
     */
    executeFetch(resource: RequestInfo | URL, init?: InternalRequestInit): Promise<Response>;
    /**
     * Internal method to execute fetch and manage active request count
     */
    private _executeFetchInternal;
    /**
     * Process the next queued request if concurrency allows
     */
    private _processNextQueuedRequest;
    /**
     * Get current status of the store
     */
    getStatus(): {
        concurrency: number;
        activeRequests: number;
        queueLength: number;
        config: BatchFetchConfig;
    };
}
