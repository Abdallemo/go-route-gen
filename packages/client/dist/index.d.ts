import { type AxiosInstance, type AxiosRequestConfig } from "axios";
export * from "axios";
export { HttpStatus, type HttpStatusCode } from "./types.js";
export type ApiResponse<T = any, E = unknown> = {
    data: T | null;
    error: E | null;
    status: number;
};
export type ExtractRouteParams<T extends string> = T extends `${infer _Start}{${infer Param}}${infer Rest}` ? Param | ExtractRouteParams<Rest> : never;
export type RequestArgs<R extends string> = [ExtractRouteParams<R>] extends [
    never
] ? [config?: AxiosRequestConfig] : [
    params: Record<ExtractRouteParams<R>, string | number>,
    config?: AxiosRequestConfig
];
export type ValidRoute<TRouteMap, TStrict extends boolean> = TStrict extends true ? TRouteMap[keyof TRouteMap] & string : (TRouteMap[keyof TRouteMap] & string) | (string & {});
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
export declare class GoApiClient<TRouteMap extends Record<string, string> = Record<string, string>, TStrict extends boolean = true, E = {
    message: string;
}> {
    private axiosInstance;
    private hooks;
    private config;
    constructor(config: GoApiClientConfig<E>);
    private _request;
    request<R extends ValidRoute<TRouteMap, TStrict>>(route: R, ...args: RequestArgs<R>): Promise<ApiResponse<any, E>>;
    expect<T>(): {
        request: <R extends ValidRoute<TRouteMap, TStrict>>(route: R, ...args: RequestArgs<R>) => Promise<ApiResponse<T, E>>;
    };
}
//# sourceMappingURL=index.d.ts.map