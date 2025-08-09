import type {
  BatchFetchConfig,
  FetchStore,
  InternalRequestInit,
} from "./types";

/**
 * Default configuration for batch fetch operations
 */
const DEFAULT_CONFIG: Required<BatchFetchConfig> = {
  concurrency:
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 10,
  timeout: 30000, // 30 seconds
  defaultInit: {},
};

/**
 * Global store for managing fetch concurrency across the entire application
 */
class GlobalFetchStore implements FetchStore {
  private _concurrency: number;
  private _activeRequests: number = 0;
  private _requestQueue: Array<() => Promise<void>> = [];
  private _config: Required<BatchFetchConfig>;

  constructor(config: BatchFetchConfig = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._concurrency = this._config.concurrency;
  }

  get concurrency(): number {
    return this._concurrency;
  }

  set concurrency(value: number) {
    if (value < 1) {
      throw new Error("Concurrency must be at least 1");
    }
    this._concurrency = value;
    this._config.concurrency = value;
  }

  get activeRequests(): number {
    return this._activeRequests;
  }

  get requestQueue(): Array<() => Promise<void>> {
    return [...this._requestQueue];
  }

  get config(): BatchFetchConfig {
    return { ...this._config };
  }

  /**
   * Update the global configuration
   */
  updateConfig(config: Partial<BatchFetchConfig>): void {
    this._config = { ...this._config, ...config };
    if (config.concurrency !== undefined) {
      this.concurrency = config.concurrency;
    }
  }

  /**
   * Execute a fetch request with concurrency management
   */
  async executeFetch(
    resource: RequestInfo | URL,
    init?: InternalRequestInit
  ): Promise<Response> {
    // Create timeout controller if timeout is specified
    const timeoutMs = (init as any)?.timeout || this._config.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Merge default init with provided init
      const finalInit: RequestInit = {
        ...this._config.defaultInit,
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
    }
  }

  /**
   * Get current status of the store
   */
  getStatus(): {
    concurrency: number;
    activeRequests: number;
    queueLength: number;
    config: BatchFetchConfig;
  } {
    return {
      concurrency: this._concurrency,
      activeRequests: this._activeRequests,
      queueLength: this._requestQueue.length,
      config: this.config,
    };
  }
}

/**
 * Global singleton instance of the fetch store
 */
export const globalFetchStore = new GlobalFetchStore();

/**
 * Configure the global fetch store
 */
export function configureBatchFetch(config: BatchFetchConfig): void {
  globalFetchStore.updateConfig(config);
}

/**
 * Get the current status of the global fetch store
 */
export function getFetchStatus() {
  return globalFetchStore.getStatus();
}
