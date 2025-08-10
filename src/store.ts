import type {
  BatchFetchConfig,
  FetchStore,
  InternalRequestInit,
} from "./types";
import GlobalConfig from "./config";

/**
 * Global store for managing fetch concurrency across the entire application
 */
export default class GlobalFetchStore implements FetchStore {
  private _activeRequests: number = 0;
  private _requestQueue: Array<() => Promise<void>> = [];
  private static _instance: GlobalFetchStore;

  private constructor() {}
  static get instance(): GlobalFetchStore {
    if (!GlobalFetchStore._instance) {
      GlobalFetchStore._instance = new GlobalFetchStore();
    }
    return GlobalFetchStore._instance;
  }

  get activeRequests(): number {
    return this._activeRequests;
  }

  get requestQueue(): Array<() => Promise<void>> {
    return [...this._requestQueue];
  }

  get config() {
    return GlobalConfig.instance.config;
  }

  /**
   * Execute a fetch request with concurrency management
   */
  async executeFetch(
    resource: RequestInfo | URL,
    init?: InternalRequestInit
  ): Promise<Response> {
    // If we're at the concurrency limit, queue this request
    if (this._activeRequests >= this.config.concurrency) {
      return new Promise((resolve, reject) => {
        this._requestQueue.push(async () => {
          try {
            const result = await this._executeFetchInternal(resource, init);
            resolve(result);
          } catch (error) {
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
  private async _executeFetchInternal(
    resource: RequestInfo | URL,
    init?: InternalRequestInit
  ): Promise<Response> {
    // Create timeout controller if timeout is specified
    const timeoutMs = (init as any)?.timeout || GlobalConfig.instance.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Merge default init with provided init
      const finalInit: RequestInit = {
        ...GlobalConfig.instance.defaultInit,
        ...init,
        signal: controller.signal,
      };

      // Execute the fetch
      this._activeRequests++;
      const response = await fetch(resource, finalInit);

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    } finally {
      this._activeRequests--;
      // Process next queued request if any
      this._processNextQueuedRequest();
    }
  }

  /**
   * Process the next queued request if concurrency allows
   */
  private _processNextQueuedRequest(): void {
    if (
      this._requestQueue.length > 0 &&
      this._activeRequests < this.config.concurrency
    ) {
      const nextRequest = this._requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
  }

  /**
   * Get current status of the store
   */
  getStatus(): {
    activeRequests: number;
    queueLength: number;
    config: BatchFetchConfig;
  } {
    return {
      activeRequests: this._activeRequests,
      queueLength: this._requestQueue.length,
      config: this.config,
    };
  }
}
