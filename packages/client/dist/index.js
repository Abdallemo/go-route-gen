import axios, { isAxiosError, } from "axios";
export * from "axios";
export { HttpStatus } from "./types.js";
export class GoApiClient {
    axiosInstance;
    hooks;
    config;
    constructor(config) {
        this.config = config.config || {};
        this.axiosInstance =
            config.axiosInstance ||
                axios.create({
                    baseURL: config.baseURL,
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: this.config.timeout || 15000,
                });
        this.hooks = config.hooks || {};
    }
    async _request(endpoint, config = {}) {
        try {
            const parts = endpoint.split(" ");
            const actualPath = parts.length === 2 ? parts[1] : parts[0];
            const method = parts.length === 2 ? parts[0] : config.method || "GET";
            const response = await this.axiosInstance({
                url: actualPath,
                method,
                ...config,
            });
            return {
                data: response.data,
                error: null,
                status: response.status,
            };
        }
        catch (error) {
            if (isAxiosError(error)) {
                const status = error.response?.status || 0;
                if (status === 401 && this.hooks.onUnauthorized) {
                    this.hooks.onUnauthorized();
                }
                const errObj = (error.response?.data ?? {
                    message: error.message,
                });
                if (this.hooks.onError && status !== 401 && status !== 0) {
                    this.hooks.onError(errObj, status);
                }
                return {
                    data: null,
                    error: errObj,
                    status,
                };
            }
            const fallback = { message: "Network error" };
            return {
                data: null,
                error: fallback,
                status: 0,
            };
        }
    }
    async request(route, ...args) {
        let finalPath = route;
        let config = {};
        if (route.includes("{")) {
            const params = args[0];
            config = args[1] || {};
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    finalPath = finalPath.replace(`{${key}}`, String(value));
                });
            }
        }
        else {
            config = args[0] || {};
        }
        return this._request(finalPath, config);
    }
    expect() {
        return {
            request: async (route, ...args) => {
                return this.request(route, ...args);
            },
        };
    }
}
//# sourceMappingURL=index.js.map