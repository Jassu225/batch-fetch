/**
 * Default configuration for batch fetch operations
 */
const DEFAULT_CONFIG = {
    concurrency: typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 10,
    timeout: 30000, // 30 seconds
    defaultInit: {},
};
/**
 * Global configuration singleton for batch fetch operations
 */
export default class GlobalConfig {
    constructor() {
        this._config = { ...DEFAULT_CONFIG };
    }
    static get instance() {
        if (!GlobalConfig._instance) {
            GlobalConfig._instance = new GlobalConfig();
        }
        return GlobalConfig._instance;
    }
    get concurrency() {
        return this._config.concurrency;
    }
    set concurrency(value) {
        this.validateConcurrency(value);
        this._config.concurrency = value;
    }
    get timeout() {
        return this._config.timeout;
    }
    set timeout(value) {
        this.validateTimeout(value);
        this._config.timeout = value;
    }
    get defaultInit() {
        return { ...this._config.defaultInit };
    }
    set defaultInit(value) {
        this._config.defaultInit = { ...value };
    }
    get config() {
        return { ...this._config };
    }
    /**
     * Update the global configuration
     */
    updateConfig(config) {
        this.validateConfig(config);
        this._config = {
            concurrency: config.concurrency ?? this._config.concurrency,
            timeout: config.timeout ?? this._config.timeout,
            defaultInit: config.defaultInit ?? this._config.defaultInit,
        };
    }
    validateConcurrency(concurrency) {
        if (concurrency < 1) {
            throw new Error("Concurrency must be at least 1");
        }
    }
    validateTimeout(timeout) {
        if (timeout < 0) {
            throw new Error("Timeout must be non-negative");
        }
    }
    validateConfig(config) {
        if (Number.isInteger(config.concurrency)) {
            this.validateConcurrency(config.concurrency);
        }
        if (config.timeout) {
            this.validateTimeout(config.timeout);
        }
    }
    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        this._config = { ...DEFAULT_CONFIG };
    }
}
