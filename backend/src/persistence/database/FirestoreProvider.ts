import { getFirestore } from '../../config/firebase';
import logger from '../../utils/logger';
import { withRetry } from '../utils/RetryHelper';
import { FinalAIResponse } from '../../ai/runtime/models/runtimeModels';

export interface FirestorePersistencePayload {
  trackingId: string;
  createdAt: string;
  submittedAt: string;
  status: string;
  storageObjectPath: string;
  municipality: string;
  visionResult: any;
  evidencePackage: any;
  decision: any;
  confidence: any;
  municipalityReport: any;
  metadata: {
    runtimeVersion: string;
    submissionSource: string;
    schemaVersion: string;
  };
}

export interface FirestoreResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Phase 5C - Firestore Provider
 * Handles saving complete reports to Firestore using the Tracking ID as the document ID.
 */
export class FirestoreProvider {
  private readonly COLLECTION_NAME = 'reports';

  /**
   * Persists the report to Firestore.
   * @param payload The complete report payload.
   */
  public async persistReport(payload: FirestorePersistencePayload): Promise<FirestoreResult> {
    const startTime = Date.now();
    logger.info('Firestore persistence started', { trackingId: payload.trackingId });

    // F-07: Payload size validation
    const payloadString = JSON.stringify(payload);
    const payloadSizeBytes = Buffer.byteLength(payloadString, 'utf8');
    if (payloadSizeBytes > 1000000) { // slightly less than 1MB
      logger.error('Firestore payload exceeds size limit', { trackingId: payload.trackingId, size: payloadSizeBytes });
      return {
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Report payload exceeds 1MB Firestore limit.' }
      };
    }

    try {
      const db = getFirestore();
      const docRef = db.collection(this.COLLECTION_NAME).doc(payload.trackingId);

      // F-02: Retry wrapper for transient failures
      await withRetry(`FirestorePersist-${payload.trackingId}`, async () => {
        await docRef.set(payload);
      });

      logger.info('Firestore persistence completed', {
        trackingId: payload.trackingId,
        durationMs: Date.now() - startTime
      });

      return {
        success: true
      };
    } catch (error: any) {
      logger.error('Firestore persistence failed', {
        trackingId: payload.trackingId,
        error: error.message,
        code: error.code,
        durationMs: Date.now() - startTime
      });

      // F-08: Improve error mapping
      let errorCode = 'FIRESTORE_PERSISTENCE_FAILURE';
      if (error.code === 7 || error.message.includes('permission denied')) errorCode = 'PERMISSION_DENIED';
      else if (error.code === 14 || error.message.includes('unavailable')) errorCode = 'FIRESTORE_UNAVAILABLE';
      else if (error.code === 4 || error.message.includes('deadline exceeded')) errorCode = 'FIRESTORE_TIMEOUT';

      return {
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to save report to Firestore.'
        }
      };
    }
  }
}
