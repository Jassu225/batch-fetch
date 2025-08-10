import type { BatchFetchConfig } from "./types";

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
 * Global configuration singleton for batch fetch operations
 */
export default class GlobalConfig {
  private _config: Required<BatchFetchConfig>;
  private static _instance: GlobalConfig;

  private constructor() {
    this._config = { ...DEFAULT_CONFIG };
  }

  static get instance(): GlobalConfig {
    if (!GlobalConfig._instance) {
      GlobalConfig._instance = new GlobalConfig();
    }
    return GlobalConfig._instance;
  }

  get concurrency(): number {
    return this._config.concurrency;
  }

  set concurrency(value: number) {
    this.validateConcurrency(value);
    this._config.concurrency = value;
  }

  get timeout(): number {
    return this._config.timeout;
  }

  set timeout(value: number) {
    this.validateTimeout(value);
    this._config.timeout = value;
  }

  get defaultInit(): RequestInit {
    return { ...this._config.defaultInit };
  }

  set defaultInit(value: RequestInit) {
    this._config.defaultInit = { ...value };
  }

  get config(): BatchFetchConfig {
    return { ...this._config };
  }

  /**
   * Update the global configuration
   */
  updateConfig(config: Partial<BatchFetchConfig>): void {
    this.validateConfig(config);
    this._config = {
      concurrency: config.concurrency ?? this._config.concurrency,
      timeout: config.timeout ?? this._config.timeout,
      defaultInit: config.defaultInit ?? this._config.defaultInit,
    };
  }

  private validateConcurrency(concurrency: number): void {
    if (concurrency < 1) {
      throw new Error("Concurrency must be at least 1");
    }
  }

  private validateTimeout(timeout: number): void {
    if (timeout < 0) {
      throw new Error("Timeout must be non-negative");
    }
  }

  private validateConfig(config: Partial<BatchFetchConfig>): void {
    if (Number.isInteger(config.concurrency)) {
      this.validateConcurrency(config.concurrency!);
    }
    if (config.timeout) {
      this.validateTimeout(config.timeout);
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this._config = { ...DEFAULT_CONFIG };
  }
}
