import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  isAxiosError,
} from "axios";

export type ApiResponse<T = any> = {
  data: T | null;
  error: string | null;
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

export interface GoApiClientConfig {
  baseURL: string;
  axiosInstance?: AxiosInstance;
}

export class GoApiClient<
  TRouteMap extends Record<string, string> = Record<string, string>,
  TStrict extends boolean = true,
> {
  private axiosInstance: AxiosInstance;

  constructor(config: GoApiClientConfig) {
    this.axiosInstance =
      config.axiosInstance ||
      axios.create({
        baseURL: config.baseURL,
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
  }

  private async _request<T>(
    endpoint: string,
    config: AxiosRequestConfig = {},
  ): Promise<ApiResponse<T>> {
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
        const serverMsg = error.response?.data?.message || error.message;

        return {
          data: null,
          error: serverMsg,
          status: status,
        };
      }
      console.error(error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async request<R extends ValidRoute<TRouteMap, TStrict>>(
    route: R,
    ...args: RequestArgs<R>
  ): Promise<ApiResponse<any>> {
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
      ): Promise<ApiResponse<T>> => {
        return this.request(route, ...args) as Promise<ApiResponse<T>>;
      },
    };
  }
}
