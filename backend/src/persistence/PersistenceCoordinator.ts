import { TrackingIdGenerator } from './tracking/TrackingIdGenerator';
import { CloudStorageProvider } from './storage/CloudStorageProvider';
import { FirestoreProvider, FirestorePersistencePayload } from './database/FirestoreProvider';
import logger from '../utils/logger';

export interface RuntimeReportData {
  visionResult: any;
  evidencePackage: any;
  decision: any;
  confidence: any;
  report: any;
}

export interface PersistenceRequest {
  imageBuffer: Buffer;
  mimeType: string;
  originalFilename?: string;
  imageSize: number;
  runtimeResponse: RuntimeReportData; // F-13 Strongly Typed
  location: { lat: number; lng: number };
  runtimeCompletedAt?: string; // F-06 Passed in from controller
}

export interface PersistenceResult {
  success: boolean;
  trackingId?: string;
  storageObjectPath?: string;
  submissionStatus?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Phase 5C - Persistence Coordinator
 * Orchestrates atomic persistence of reports.
 */
export class PersistenceCoordinator {
  private trackingIdGenerator: TrackingIdGenerator;
  private cloudStorageProvider: CloudStorageProvider;
  private firestoreProvider: FirestoreProvider;

  constructor() {
    this.trackingIdGenerator = new TrackingIdGenerator();
    this.cloudStorageProvider = new CloudStorageProvider();
    this.firestoreProvider = new FirestoreProvider();
  }

  /**
   * Executes the persistence workflow atomically.
   */
  public async persist(request: PersistenceRequest): Promise<PersistenceResult> {
    const startTime = Date.now();
    
    // F-05: Pre-persistence validation
    if (
      !request.runtimeResponse.visionResult ||
      !request.runtimeResponse.decision ||
      !request.runtimeResponse.confidence ||
      !request.runtimeResponse.report
    ) {
      logger.error('Pre-persistence validation failed: Missing required report elements');
      return {
        success: false,
        error: { code: 'VALIDATION_FAILED', message: 'Incomplete runtime response payload. Aborting persistence.' }
      };
    }

    // Step 1: Generate Tracking ID
    let trackingId: string;
    try {
      trackingId = this.trackingIdGenerator.generate();
    } catch (error: any) {
      logger.error('Tracking ID generation failed', { error: error.message });
      return {
        success: false,
        error: { code: 'TRACKING_ID_GENERATION_FAILURE', message: 'Failed to generate Tracking ID' }
      };
    }

    logger.info('Persistence workflow started', { trackingId });

    // Step 2: Upload Image to Cloud Storage
    const storageResult = await this.cloudStorageProvider.uploadImage(request.imageBuffer, {
      trackingId,
      mimeType: request.mimeType,
      originalFilename: request.originalFilename,
      size: request.imageSize,
      source: 'citizen_upload'
    });

    if (!storageResult.success || !storageResult.canonicalPath) {
      return {
        success: false,
        error: storageResult.error || { code: 'CLOUD_STORAGE_UPLOAD_FAILURE', message: 'Unknown upload error' }
      };
    }

    // Step 3: Persist to Firestore
    
    // F-01: Extract actual municipality from evidencePackage, not decision
    const evidenceMunicipality = request.runtimeResponse.evidencePackage?.municipalityInfo?.municipality || 'Unknown';

    const firestorePayload: FirestorePersistencePayload = {
      trackingId,
      createdAt: request.runtimeCompletedAt || new Date().toISOString(), // F-06: runtime completion time
      submittedAt: new Date().toISOString(), // F-06: persistence completion time
      status: 'SUBMITTED',
      storageObjectPath: storageResult.canonicalPath!,
      municipality: evidenceMunicipality,
      visionResult: request.runtimeResponse.visionResult,
      evidencePackage: request.runtimeResponse.evidencePackage || null,
      decision: request.runtimeResponse.decision,
      confidence: request.runtimeResponse.confidence,
      municipalityReport: request.runtimeResponse.report,
      metadata: {
        runtimeVersion: '1.0',
        submissionSource: 'web',
        schemaVersion: '1.1'
      }
    };

    const firestoreResult = await this.firestoreProvider.persistReport(firestorePayload);

    // Step 4: Handle Firestore Failure & Atomic Rollback
    if (!firestoreResult.success) {
      logger.warn('Initiating persistence rollback due to Firestore failure', { trackingId });
      
      const rollbackSuccess = await this.cloudStorageProvider.deleteImage((storageResult as any).internalFilePath || storageResult.canonicalPath!, trackingId);
      
      if (!rollbackSuccess) {
        // Rollback failed - this is critical
        logger.error('PERSISTENCE_ROLLBACK_FAILED', {
          trackingId,
          storageObjectPath: storageResult.canonicalPath,
          message: 'Manual remediation required. Orphaned Cloud Storage object exists.'
        });
        
        return {
          success: false,
          error: { code: 'PERSISTENCE_ROLLBACK_FAILED', message: 'Atomic persistence failed and rollback was unsuccessful.' }
        };
      }

      return {
        success: false,
        error: firestoreResult.error || { code: 'FIRESTORE_PERSISTENCE_FAILURE', message: 'Failed to save report to database.' }
      };
    }

    logger.info('Persistence workflow completed successfully', {
      trackingId,
      durationMs: Date.now() - startTime
    });

    return {
      success: true,
      trackingId,
      storageObjectPath: storageResult.canonicalPath,
      submissionStatus: 'SUBMITTED'
    };
  }
}
