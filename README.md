# ts-batch-fetch

![NPM Version](https://img.shields.io/npm/v/ts-batch-fetch)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jassu225/batch-fetch/build-test-publish.yaml?color=f7643b)

A powerful, concurrency-controlled fetch library for browsers built on top of [ts-batch-processor](https://www.npmjs.com/package/ts-batch-processor). Provides a drop-in replacement for the browser's fetch API with built-in concurrency management and batch processing capabilities.

## ✨ Features

- 🚀 **Drop-in Replacement**: Compatible with standard fetch API
- ⚡ **Concurrency Control**: Limit simultaneous requests with global or per-request settings
- 📦 **Batch Processing**: Process multiple requests efficiently with `fetchList`
- 🛡️ **Error Handling**: Graceful error handling with detailed error information
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🌐 **Browser-First**: Optimized for browser environments

- 🔄 **Promise-Based**: Modern async/await support

## 📦 Installation

```bash
npm install ts-batch-fetch
```

## 🚀 Quick Start

### Basic Usage - Drop-in fetch replacement

```typescript
import { fetch } from "ts-batch-fetch";
// Or use as default export
import batchFetch from "ts-batch-fetch";

// Use exactly like regular fetch, but with automatic concurrency control
const response = await fetch("/api/data");
const data = await response.json();

// Same with default export
const response2 = await batchFetch("/api/data");
```

### Batch Processing with fetchList

```typescript
import { fetchList } from "ts-batch-fetch";

// Fetch multiple resources with concurrency control
const requests = [
  "/api/users/1",
  "/api/users/2",
  "/api/users/3",
  { resource: "/api/users/4", init: { method: "POST" } },
];

const results = await fetchList(requests, { concurrency: 2 });

// Process results
results.forEach((result, index) => {
  if (result.success) {
    console.log(`Request ${index} succeeded:`, result.response.status);
  } else {
    console.log(`Request ${index} failed:`, result.error.message);
  }
});
```

## 📚 API Reference

### `fetch(resource, init?)`

Drop-in replacement for browser's fetch with additional timeout options.

```typescript
import { fetch } from "ts-batch-fetch";

// Basic usage
const response = await fetch("/api/data");

// With timeout
const response = await fetch("/api/data", {
  timeout: 5000, // Request timeout in ms
});
```

#### Parameters

- `resource`: `RequestInfo | URL` - The resource to fetch
- `init?`: `FetchRequestInit` - Request options with additional timeout property
  - `timeout?`: `number` - Request timeout in milliseconds
  - All other standard `RequestInit` properties

#### Returns

- `Promise<Response>` - Standard fetch Response object

### `fetchList(requests, overrideConfig?)`

Fetch multiple resources with concurrency control.

```typescript
import { fetchList } from "ts-batch-fetch";

const requests = [
  "/api/endpoint1",
  new URL("https://api.example.com/data"),
  {
    resource: "/api/endpoint2",
    init: { method: "POST" },
  },
  {
    resource: "/api/endpoint3",
    init: { headers: { Accept: "application/json" } },
  },
];

const results = await fetchList(requests, { concurrency: 3 });
```

#### Parameters

- `requests`: `(RequestInfo | URL | FetchArgs)[]` - Array of requests to process
- `overrideConfig?`: `BatchFetchConfig` - Optional configuration for this batch. Overrides global config

#### Returns

- `Promise<BatchFetchResult[]>` - Array of results in the same order as input

### Configuration

#### Global Configuration

```typescript
import { updateConfig, getConfig, resetConfig } from "ts-batch-fetch";

// Configure global defaults
updateConfig({
  concurrency: 5, // Max concurrent requests
  timeout: 15000, // Default timeout (15s)
  defaultInit: {
    // Default RequestInit for all requests
    headers: {
      "User-Agent": "MyApp/1.0",
    },
  },
});

// Get current configuration
const config = getConfig();
console.log(`Current concurrency: ${config.concurrency}`);

// Reset to defaults if needed
resetConfig();
```

#### Per-Request Configuration

```typescript
// Set timeout for specific requests
const response = await fetch("/api/data", { timeout: 10000 });

// Override concurrency for specific batch
const results = await fetchList(requests, { concurrency: 1 });
```

#### Configuration Helper Functions

```typescript
import { getConfig, updateConfig, resetConfig } from "ts-batch-fetch";

// Get current configuration
const currentConfig = getConfig();

// Update specific settings
updateConfig({ concurrency: 8, timeout: 20000 });

// Reset to defaults
resetConfig();
```

## 🧩 Utility Functions

### Result Processing

```typescript
import {
  getSuccessfulResults,
  getFailedResults,
  extractResponses,
  extractErrors,
} from "ts-batch-fetch";

const results = await fetchList(["/api/1", "/api/2", "/api/3"]);

// Get only successful results
const successful = getSuccessfulResults(results);

// Get only failed results
const failed = getFailedResults(results);

// Extract just the Response objects
const responses = extractResponses(results);

// Extract just the Error objects
const errors = extractErrors(results);
```

## 📖 Usage Examples

### Example 1: API Batch Processing

```typescript
import { fetchList, getSuccessfulResults } from "ts-batch-fetch";

async function fetchUserData() {
  const userIds = [1, 2, 3, 4, 5];

  const requests = userIds.map((id) => `/api/users/${id}`);

  const results = await fetchList(requests, { concurrency: 2 });

  const successful = getSuccessfulResults(results);
  const userData = await Promise.all(
    successful.map((result) => result.response!.json())
  );

  return userData;
}
```

### Example 2: Mixed Request Types

```typescript
import { fetchList } from "ts-batch-fetch";

const requests = [
  // Simple GET requests
  "/api/config",
  "/api/status",

  // POST request with body
  {
    resource: "/api/data",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update" }),
    },
  },

  // Custom timeout
  {
    resource: "/api/slow-endpoint",
    init: { timeout: 60000 },
  },
];

const results = await fetchList(requests);
console.log(`Completed ${results.length} requests`);
```

## 🔧 TypeScript Types

```typescript
interface BatchFetchConfig {
  concurrency: number;
  timeout?: number;
  defaultInit?: RequestInit;
}

interface BatchRequestInit extends RequestInit {
  timeout?: number;
}

interface FetchRequestInit extends RequestInit {
  timeout?: number;
}

interface FetchArgs {
  resource: RequestInfo | URL;
  init?: BatchRequestInit;
}

interface BatchFetchResult {
  resource: RequestInfo | URL;
  init?: BatchRequestInit;
  response?: Response;
  error?: Error;
  success: boolean;
  index: number;
}
```

## ⚡ Performance Tips

1. **Choose appropriate concurrency**: Balance between performance and resource usage
2. **Use timeouts**: Prevent hanging requests from blocking the queue
3. **Batch similar requests**: Group related requests together for better efficiency
4. **Use configuration helpers**: Use `getConfig()` and `updateConfig()` for dynamic configuration management

## 🔗 Dependencies

- [ts-batch-processor](https://www.npmjs.com/package/ts-batch-processor) - Underlying batch processing engine

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

Found a bug or have a feature request? Please create an issue on GitHub.
