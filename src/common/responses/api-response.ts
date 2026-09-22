export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export function buildSuccessResponse<T>(message: string, data?: T): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
}

export function buildErrorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    ...(error && { error }),
  };
}
