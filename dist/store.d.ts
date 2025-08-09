import type { BatchFetchConfig, FetchStore, InternalRequestInit } from "./types.js";
/**
 * Global store for managing fetch concurrency across the entire application
 */
declare class GlobalFetchStore implements FetchStore {
    private _concurrency;
    private _activeRequests;
    private _requestQueue;
    private _config;
    constructor(config?: BatchFetchConfig);
    get concurrency(): number;
    set concurrency(value: number);
    get activeRequests(): number;
    get requestQueue(): Array<() => Promise<void>>;
    get config(): BatchFetchConfig;
    /**
     * Update the global configuration
     */
    updateConfig(config: Partial<BatchFetchConfig>): void;
    /**
     * Execute a fetch request with concurrency management
     */
    executeFetch(resource: RequestInfo | URL, init?: InternalRequestInit): Promise<Response>;
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
/**
 * Global singleton instance of the fetch store
 */
export declare const globalFetchStore: GlobalFetchStore;
/**
 * Configure the global fetch store
 */
export declare function configureBatchFetch(config: BatchFetchConfig): void;
/**
 * Get the current status of the global fetch store
 */
export declare function getFetchStatus(): {
    concurrency: number;
    activeRequests: number;
    queueLength: number;
    config: BatchFetchConfig;
};
export {};
