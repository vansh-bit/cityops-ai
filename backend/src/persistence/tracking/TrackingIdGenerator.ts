import { randomBytes } from 'crypto';

/**
 * Phase 5C - Tracking ID Generator
 * Generates cryptographically secure, random, non-enumerable, globally unique, URL-safe identifiers.
 */
export class TrackingIdGenerator {
  /**
   * Generates a new Tracking ID.
   * @returns {string} The generated Tracking ID.
   */
  public generate(): string {
    // Generate 16 bytes of cryptographically secure random data
    // Encode as base64url to ensure URL safety and compactness
    // This results in a 22-character string that is non-enumerable and globally unique
    return randomBytes(16).toString('base64url');
  }
}
