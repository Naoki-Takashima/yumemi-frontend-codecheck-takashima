export const SHARED_API_ERROR_CODES = [
  'UPSTREAM_ERROR',
  'UPSTREAM_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type SharedApiErrorCode = (typeof SHARED_API_ERROR_CODES)[number];

export type ApiErrorBody<Code extends string = SharedApiErrorCode> = {
  error: {
    code: Code;
    message: string;
  };
};
