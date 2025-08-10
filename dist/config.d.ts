import type { BatchFetchConfig } from "./types";
/**
 * Global configuration singleton for batch fetch operations
 */
export default class GlobalConfig {
    private _config;
    private static _instance;
    private constructor();
    static get instance(): GlobalConfig;
    get concurrency(): number;
    set concurrency(value: number);
    get timeout(): number;
    set timeout(value: number);
    get defaultInit(): RequestInit;
    set defaultInit(value: RequestInit);
    get config(): BatchFetchConfig;
    /**
     * Update the global configuration
     */
    updateConfig(config: Partial<BatchFetchConfig>): void;
    private validateConcurrency;
    private validateTimeout;
    private validateConfig;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void;
}
