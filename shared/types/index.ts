/**
 * Shared type definitions for CityOps AI.
 *
 * Export all shared types from this barrel file.
 */

// ── Ch.4 §4.24 Common Success Response Contract ──
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

// ── Ch.4 §4.25 Common Error Response Contract ──
export interface ApiErrorDetail {
  code: string;
  message: string;
  details: string[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
}

// ── Union type for any API response ──
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Health endpoint data shape ──
export interface HealthData {
  status: string;
  uptime: number;
  environment: string;
}

export * from './auth';
