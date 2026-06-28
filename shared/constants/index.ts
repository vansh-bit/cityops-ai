/**
 * Shared constants for CityOps AI.
 *
 * Export all shared constants from this barrel file.
 */

export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export * from './auth';
