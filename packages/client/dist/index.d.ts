import { type AxiosInstance, type AxiosRequestConfig } from "axios";
export type ApiResponse<T = any> = {
    data: T | null;
    error: string | null;
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
export interface GoApiClientConfig {
    baseURL: string;
    axiosInstance?: AxiosInstance;
}
export declare class GoApiClient<TRouteMap extends Record<string, string> = Record<string, string>, TStrict extends boolean = true> {
    private axiosInstance;
    constructor(config: GoApiClientConfig);
    private _request;
    request<R extends ValidRoute<TRouteMap, TStrict>>(route: R, ...args: RequestArgs<R>): Promise<ApiResponse<any>>;
    expect<T>(): {
        request: <R extends ValidRoute<TRouteMap, TStrict>>(route: R, ...args: RequestArgs<R>) => Promise<ApiResponse<T>>;
    };
}
//# sourceMappingURL=index.d.ts.map