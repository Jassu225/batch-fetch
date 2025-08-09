/**
 * Configuration options for batch fetch operations
 */
export interface BatchFetchConfig {
  /** Maximum number of concurrent fetch requests. Defaults to navigator.hardwareConcurrency or 10 */
  concurrency?: number;
  /** Default timeout for fetch requests in milliseconds */
  timeout?: number;
  /** Default request init options to apply to all requests */
  defaultInit?: RequestInit;
}

/**
 * Extended RequestInit with batch-specific options
 */
export interface BatchRequestInit extends RequestInit {
  /** Override global concurrency for this specific request */
  concurrency?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Internal RequestInit that includes timeout for store operations
 */
export interface InternalRequestInit extends RequestInit {
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Fetch arguments as an object for fetchList function
 */
export interface FetchArgs {
  /** The resource to fetch */
  resource: RequestInfo | URL;
  /** Request options */
  init?: BatchRequestInit;
}

/**
 * Result of a batch fetch operation
 */
export interface BatchFetchResult {
  /** Original request resource */
  resource: RequestInfo | URL;
  /** Request options that were used */
  init?: BatchRequestInit;
  /** Response object if successful */
  response?: Response;
  /** Error if the request failed */
  error?: Error;
  /** Whether the request was successful */
  success: boolean;
  /** Index in the original batch request */
  index: number;
}

/**
 * Global store for managing fetch concurrency
 */
export interface FetchStore {
  /** Current concurrency limit */
  concurrency: number;
  /** Number of active requests */
  activeRequests: number;
  /** Queue of pending requests */
  requestQueue: Array<() => Promise<void>>;
  /** Default configuration */
  config: BatchFetchConfig;
}
