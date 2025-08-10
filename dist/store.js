import GlobalConfig from "./config";
/**
 * Global store for managing fetch concurrency across the entire application
 */
export default class GlobalFetchStore {
    constructor() {
        this._activeRequests = 0;
        this._requestQueue = [];
    }
    static get instance() {
        if (!GlobalFetchStore._instance) {
            GlobalFetchStore._instance = new GlobalFetchStore();
        }
        return GlobalFetchStore._instance;
    }
    get concurrency() {
        return GlobalConfig.instance.concurrency;
    }
    get activeRequests() {
        return this._activeRequests;
    }
    get requestQueue() {
        return [...this._requestQueue];
    }
    get config() {
        return GlobalConfig.instance.config;
    }
    /**
     * Execute a fetch request with concurrency management
     */
    async executeFetch(resource, init) {
        // If we're at the concurrency limit, queue this request
        if (this._activeRequests >= this.concurrency) {
            return new Promise((resolve, reject) => {
                this._requestQueue.push(async () => {
                    try {
                        const result = await this._executeFetchInternal(resource, init);
                        resolve(result);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            });
        }
        // Otherwise execute immediately
        return this._executeFetchInternal(resource, init);
    }
    /**
     * Internal method to execute fetch and manage active request count
     */
    async _executeFetchInternal(resource, init) {
        // Create timeout controller if timeout is specified
        const timeoutMs = init?.timeout || GlobalConfig.instance.timeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            // Merge default init with provided init
            const finalInit = {
                ...GlobalConfig.instance.defaultInit,
                ...init,
                signal: controller.signal,
            };
            // Execute the fetch
            this._activeRequests++;
            const response = await fetch(resource, finalInit);
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
        finally {
            this._activeRequests--;
            // Process next queued request if any
            this._processNextQueuedRequest();
        }
    }
    /**
     * Process the next queued request if concurrency allows
     */
    _processNextQueuedRequest() {
        if (this._requestQueue.length > 0 &&
            this._activeRequests < this.concurrency) {
            const nextRequest = this._requestQueue.shift();
            if (nextRequest) {
                nextRequest();
            }
        }
    }
    /**
     * Get current status of the store
     */
    getStatus() {
        return {
            concurrency: this.concurrency,
            activeRequests: this._activeRequests,
            queueLength: this._requestQueue.length,
            config: this.config,
        };
    }
}
