import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  isAxiosError,
} from "axios";

export * from "axios";
export { HttpStatus, type HttpStatusCode } from "./types.js";
export type ApiResponse<T = any, E = unknown> = {
  data: T | null;
  error: E | null;
  status: number;
};

export type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Param | ExtractRouteParams<Rest>
    : never;

export type RequestArgs<R extends string> = [ExtractRouteParams<R>] extends [
  never,
]
  ? [config?: AxiosRequestConfig]
  : [
      params: Record<ExtractRouteParams<R>, string | number>,
      config?: AxiosRequestConfig,
    ];

export type ValidRoute<
  TRouteMap,
  TStrict extends boolean,
> = TStrict extends true
  ? TRouteMap[keyof TRouteMap] & string
  : (TRouteMap[keyof TRouteMap] & string) | (string & {});

export interface GoApiClientConfig<E = any> {
  baseURL: string;
  axiosInstance?: AxiosInstance;
  config?: {
    timeout?: number;
  };
  hooks?: {
    onUnauthorized?: () => Promise<void> | void;
    onError?: (error: E, status: number) => void;
  };
}

export class GoApiClient<
  TRouteMap extends Record<string, string> = Record<string, string>,
  TStrict extends boolean = true,
  E = { message: string },
> {
  private axiosInstance: AxiosInstance;
  private hooks: NonNullable<GoApiClientConfig<E>["hooks"]>;
  private config: NonNullable<GoApiClientConfig["config"]>;

  constructor(config: GoApiClientConfig<E>) {
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

  private async _request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {},
  ): Promise<ApiResponse<T, E>> {
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
        data: response.data as T,
        error: null,
        status: response.status,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status || 0;

        if (status === 401 && this.hooks.onUnauthorized) {
          this.hooks.onUnauthorized();
        }

        const errObj = (error.response?.data ?? {
          message: error.message,
        }) as E;

        if (this.hooks.onError && status !== 401 && status !== 0) {
          this.hooks.onError(errObj, status);
        }

        return {
          data: null,
          error: errObj,
          status,
        };
      }

      const fallback = { message: "Network error" } as E;

      return {
        data: null,
        error: fallback,
        status: 0,
      };
    }
  }

  async request<R extends ValidRoute<TRouteMap, TStrict>>(
    route: R,
    ...args: RequestArgs<R>
  ): Promise<ApiResponse<any, E>> {
    let finalPath = route as string;
    let config: AxiosRequestConfig = {};

    if (route.includes("{")) {
      const params = args[0] as Record<string, string | number> | undefined;
      config = (args[1] as AxiosRequestConfig) || {};
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          finalPath = finalPath.replace(`{${key}}`, String(value));
        });
      }
    } else {
      config = (args[0] as AxiosRequestConfig) || {};
    }

    return this._request<any>(finalPath, config);
  }

  public expect<T>() {
    return {
      request: async <R extends ValidRoute<TRouteMap, TStrict>>(
        route: R,
        ...args: RequestArgs<R>
      ): Promise<ApiResponse<T, E>> => {
        return this.request(route, ...args) as Promise<ApiResponse<T, E>>;
      },
    };
  }
}
