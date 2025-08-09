# batch-fetch

A powerful, concurrency-controlled fetch library for browsers built on top of [ts-batch-processor](https://www.npmjs.com/package/ts-batch-processor). Provides a drop-in replacement for the browser's fetch API with built-in concurrency management and batch processing capabilities.

## ✨ Features

- 🚀 **Drop-in Replacement**: Compatible with standard fetch API
- ⚡ **Concurrency Control**: Limit simultaneous requests with global or per-request settings
- 📦 **Batch Processing**: Process multiple requests efficiently with `fetchList`
- 🛡️ **Error Handling**: Graceful error handling with detailed error information
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🌐 **Browser-First**: Optimized for browser environments
- 📊 **Progress Tracking**: Built-in progress tracking and status monitoring
- 🔄 **Promise-Based**: Modern async/await support

## 📦 Installation

```bash
npm install batch-fetch
```

## 🚀 Quick Start

### Basic Usage - Drop-in fetch replacement

```typescript
import { fetch } from "batch-fetch";

// Use exactly like regular fetch, but with automatic concurrency control
const response = await fetch("/api/data");
const data = await response.json();
```

### Batch Processing with fetchList

```typescript
import { fetchList } from "batch-fetch";

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

Drop-in replacement for browser's fetch with additional concurrency options.

```typescript
import { fetch } from "batch-fetch";

// Basic usage
const response = await fetch("/api/data");

// With concurrency override
const response = await fetch("/api/data", {
  concurrency: 1, // Override global concurrency for this request
  timeout: 5000, // Request timeout in ms
});
```

#### Parameters

- `resource`: `RequestInfo | URL` - The resource to fetch
- `init?`: `BatchRequestInit` - Request options with additional batch-specific properties
  - `concurrency?`: `number` - Override global concurrency for this request
  - `timeout?`: `number` - Request timeout in milliseconds
  - All other standard `RequestInit` properties

#### Returns

- `Promise<Response>` - Standard fetch Response object

### `fetchList(requests, globalConfig?)`

Fetch multiple resources with concurrency control.

```typescript
import { fetchList, createFetchArgs } from "batch-fetch";

const requests = [
  "/api/endpoint1",
  new URL("https://api.example.com/data"),
  createFetchArgs("/api/endpoint2", { method: "POST" }),
  {
    resource: "/api/endpoint3",
    init: { headers: { Accept: "application/json" } },
  },
];

const results = await fetchList(requests, { concurrency: 3 });
```

#### Parameters

- `requests`: `(RequestInfo | URL | FetchArgs)[]` - Array of requests to process
- `globalConfig?`: `BatchFetchConfig` - Optional configuration for this batch

#### Returns

- `Promise<BatchFetchResult[]>` - Array of results in the same order as input

### Configuration

#### Global Configuration

```typescript
import { configureBatchFetch, getFetchStatus } from "batch-fetch";

// Configure global defaults
configureBatchFetch({
  concurrency: 5, // Max concurrent requests
  timeout: 30000, // Default timeout (30s)
  defaultInit: {
    // Default RequestInit for all requests
    headers: {
      "User-Agent": "MyApp/1.0",
    },
  },
});

// Check current status
const status = getFetchStatus();
console.log(`Active requests: ${status.activeRequests}/${status.concurrency}`);
```

#### Per-Request Configuration

```typescript
// Override concurrency for specific requests
const response = await fetch("/api/data", { concurrency: 1 });

// Set timeout for specific requests
const response = await fetch("/api/data", { timeout: 10000 });
```

## 🧩 Utility Functions

### Result Processing

```typescript
import {
  getSuccessfulResults,
  getFailedResults,
  extractResponses,
  extractErrors,
} from "batch-fetch";

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

### Creating Fetch Arguments

```typescript
import { createFetchArgs } from "batch-fetch";

// Helper for creating FetchArgs objects
const args = createFetchArgs("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ data: "value" }),
});
```

## 📖 Usage Examples

### Example 1: API Batch Processing

```typescript
import { fetchList, getSuccessfulResults } from "batch-fetch";

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
import { fetchList, createFetchArgs } from "batch-fetch";

const requests = [
  // Simple GET requests
  "/api/config",
  "/api/status",

  // POST request with body
  createFetchArgs("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update" }),
  }),

  // Custom timeout
  {
    resource: "/api/slow-endpoint",
    init: { timeout: 60000 },
  },
];

const results = await fetchList(requests);
console.log(`Completed ${results.length} requests`);
```

### Example 3: Error Handling and Retries

```typescript
import { fetch } from "batch-fetch";

async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

### Example 4: Progress Monitoring

```typescript
import { fetchList, getFetchStatus } from "batch-fetch";

const requests = Array.from({ length: 20 }, (_, i) => `/api/item/${i}`);

// Monitor progress
const progressInterval = setInterval(() => {
  const status = getFetchStatus();
  console.log(`Progress: ${status.activeRequests} active requests`);
}, 1000);

try {
  const results = await fetchList(requests, { concurrency: 5 });
  console.log(`Completed ${results.length} requests`);
} finally {
  clearInterval(progressInterval);
}
```

## 🔧 TypeScript Types

```typescript
interface BatchFetchConfig {
  concurrency?: number;
  timeout?: number;
  defaultInit?: RequestInit;
}

interface BatchRequestInit extends RequestInit {
  concurrency?: number;
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
4. **Monitor active requests**: Use `getFetchStatus()` to track performance

## 🔗 Dependencies

- [ts-batch-processor](https://www.npmjs.com/package/ts-batch-processor) - Underlying batch processing engine

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

Found a bug or have a feature request? Please create an issue on GitHub.
