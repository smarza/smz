export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export interface ApiError {
  code?: number;
  message: string;
  details?: unknown;
}

// e um wrapper de resposta que pode conter dado ou erro:
export type ApiResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: ApiError };
