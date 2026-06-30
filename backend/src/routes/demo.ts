import { Router, Request, Response, RequestHandler } from 'express';
import { API_PREFIX } from 'cityops-ai-shared';
import { RuntimeFactory } from '../ai/factory/RuntimeFactory';
import { PerceptionResult } from '../ai/reasoning/models/decisionModels';
import { VisionProvider } from '../evidence/providers/vision/VisionProvider';
import { EvidenceFramework } from '../evidence/framework/EvidenceFramework';
import { EvidenceSource } from '../evidence/contracts/evidenceContracts';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { PersistenceCoordinator } from '../persistence/PersistenceCoordinator';

const demoRouter = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    // Validate MIME type before allocating memory
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_MEDIA_TYPE'));
    }
  }
});

/**
 * Phase 5A Architectural Decision: In-Memory Uploads
 * 
 * For Phase 5A, uploaded images are held entirely in memory via multer.memoryStorage().
 * This allows fast integration with the Gemini Vision API without introducing Cloud Storage dependencies.
 * The buffer is explicitly released after processing to minimize memory footprint.
 * Cloud Storage persistence will be introduced in Phase 5C.
 */

/**
 * POST /api/v1/demo/analyze
 * Old endpoint for engineering validation demo.
 */
demoRouter.post(`${API_PREFIX}/demo/analyze`, (async (req: Request, res: Response) => {
  try {
    const { imageUri, location, description } = req.body;

    const perception: PerceptionResult = {
      detectedIssue: 'Unknown',
      severityEstimate: 'Unknown',
      visualObservations: [],
      metadata: {
        imageRef: imageUri || 'gs://cityops-demo/sample.jpg',
        latitude: location?.lat || 40.7128,
        longitude: location?.lng || -74.0060,
        citizenDescription: description || 'No description provided.',
        timestamp: new Date().toISOString()
      }
    };

    const coordinator = await RuntimeFactory.create();
    
    logger.info(`Starting Vertical Slice Demo Execution for ${perception.metadata.citizenDescription}`);
    const response = await coordinator.execute(perception);

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Demo route failed', { error });
    res.status(500).json({
      success: false,
      message: 'Demo execution failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}) as RequestHandler);


/**
 * POST /api/v1/analyze
 * Production Gemini Vision Endpoint for Phase 5A
 */
export const analyzeHandler = (async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Image file is required.' }
      });
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(req.file.mimetype)) {
      return res.status(415).json({
        success: false,
        error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Only JPG, PNG, and WEBP formats are supported.' }
      });
    }

    const { latitude, longitude, description } = req.body;

    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Latitude and longitude must be valid numbers.' }
      });
    }

    logger.info('Analyze request accepted', {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      latitude: parsedLat,
      longitude: parsedLng
    });

    // 1. Initialize Vision Provider
    const framework = new EvidenceFramework();
    const visionProvider = new VisionProvider(framework);
    await visionProvider.initialize();

    // 2. Fetch VisionResult
    const visionEvidence = await visionProvider.collectEvidence({
      requestId: randomUUID(),
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: {
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype
      }
    });
    
    // Explicitly delete buffer after persistence, not here
    // delete req.file.buffer;

    if (visionEvidence.status === 'ERROR') {
      const errorMsg = visionEvidence.errors?.[0] || 'Unknown error';
      if (errorMsg.includes('CONTENT_NOT_SUPPORTED')) {
        return res.status(422).json({ success: false, error: { code: 'CONTENT_NOT_SUPPORTED', message: 'The uploaded image could not be analyzed.' } });
      }
      if (errorMsg.includes('TIMEOUT')) {
        return res.status(504).json({ success: false, error: { code: 'GATEWAY_TIMEOUT', message: 'Image analysis timed out.' } });
      }
      return res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Gemini Service Failure.' } });
    }

    const visionResult = visionEvidence.evidence?.data;
    if (!visionResult) {
      return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Vision analysis failed to return data.' } });
    }

    // 3. Map to PerceptionResult for the Runtime
    const perception: PerceptionResult = {
      detectedIssue: visionResult.issueType,
      severityEstimate: visionResult.severity,
      visualObservations: visionResult.observations || [],
      metadata: {
        imageRef: 'uploaded-image',
        latitude: parsedLat,
        longitude: parsedLng,
        citizenDescription: description || '',
        timestamp: new Date().toISOString()
      }
    };

    // 4. Execute Runtime
    const coordinator = await RuntimeFactory.create();
    logger.info(`Starting Production Execution for image upload`);
    const runtimeResponse = await coordinator.execute(perception);
    const runtimeCompletedAt = new Date().toISOString(); // F-06: Capture runtime completion time

    if (runtimeResponse.status === 'FAILED') {
      logger.error('Runtime failed to execute properly:', runtimeResponse.failureDetails);
      return res.status(500).json({ 
        success: false, 
        error: { 
          code: 'RUNTIME_ERROR', 
          message: runtimeResponse.failureDetails?.message || 'Runtime execution failed.' 
        },
        failureDetails: runtimeResponse.failureDetails
      });
    }

    // 5. Build Final API Contract Response
    
    let evidencePkgData = undefined;
    if (runtimeResponse.evidence && runtimeResponse.evidence.length > 0) {
      const evidencePkg = runtimeResponse.evidence.find(e => e.source === 'evidence_collection_tool' || e.data?.package);
      if (evidencePkg) {
        evidencePkgData = evidencePkg.data?.package || evidencePkg.data;
      }
    }

    const reportBase = {
      visionResult: visionResult,
      evidencePackage: evidencePkgData,
      decision: {
        category: runtimeResponse.decision?.issueClassification || 'UNKNOWN',
        priority: runtimeResponse.decision?.priorityRecommendation || 'UNKNOWN',
        assignedDepartment: runtimeResponse.decision?.departmentRecommendation || 'UNKNOWN',
        reasoning: runtimeResponse.decision?.reasoning || 'No reasoning provided.'
      },
      confidence: {
        overallScore: runtimeResponse.confidence?.confidenceValue || 0,
        confidenceLevel: runtimeResponse.confidence?.confidenceLevel || 'UNKNOWN',
        escalationRequired: runtimeResponse.confidence?.escalationRequired || false,
        reasoning: runtimeResponse.confidence?.evaluationSummary || 'No explanation provided.',
        supportingFactors: runtimeResponse.confidence?.supportingFactors || [],
        explanation: runtimeResponse.confidence?.explanation
      },
      report: {
        reportTitle: `${runtimeResponse.decision?.issueClassification || 'Unknown'} Incident`,
        summary: runtimeResponse.decision?.reasoning || 'No summary available.',
        recommendedAction: `Dispatch ${runtimeResponse.decision?.departmentRecommendation || 'team'}`,
        status: "SUBMITTED"
      }
    };

    // 6. Persistence
    const persistenceCoordinator = new PersistenceCoordinator();
    const persistenceResult = await persistenceCoordinator.persist({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalFilename: req.file.originalname,
      imageSize: req.file.size || req.file.buffer.length,
      runtimeResponse: reportBase,
      location: { lat: parsedLat, lng: parsedLng },
      runtimeCompletedAt // F-06
    });

    // Clean up memory
    delete req.file.buffer;

    const fallbackTrackingId = runtimeResponse.correlationId || runtimeResponse.runtimeId || randomUUID();

    if (!persistenceResult.success) {
      logger.warn('Persistence failed after successful AI analysis; returning runtime result without submission record', {
        fallbackTrackingId,
        persistenceError: persistenceResult.error
      });

      return res.status(200).json({
        success: true,
        trackingId: fallbackTrackingId,
        submissionStatus: "ANALYSIS_COMPLETE",
        timestamp: new Date().toISOString(),
        location: {
          latitude: parsedLat,
          longitude: parsedLng
        },
        persistence: {
          firestoreStatus: "FAILED",
          cloudStorageStatus: "FAILED",
          storageObjectPath: null
        },
        warning: persistenceResult.error?.message || 'Analysis succeeded, but persistence failed.',
        ...reportBase
      });
    }

    // Combine for final API Response
    const responsePayload = {
      success: true,
      trackingId: persistenceResult.trackingId,
      submissionStatus: "SUBMITTED",
      timestamp: new Date().toISOString(),
      location: {
        latitude: parsedLat,
        longitude: parsedLng
      },
      persistence: {
        firestoreStatus: "PERSISTED",
        cloudStorageStatus: "UPLOADED",
        storageObjectPath: persistenceResult.storageObjectPath
      },
      ...reportBase
    };

    res.status(200).json(responsePayload);

  } catch (error: any) {
    logger.error('Analyze route failed', { error });
    if (error.code === 'LIMIT_FILE_SIZE' || error.message === 'File too large') {
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'File exceeds 10MB limit.' } });
    }
    if (error.message === 'UNSUPPORTED_MEDIA_TYPE') {
      return res.status(415).json({ success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Only JPG, PNG, and WEBP formats are supported.' } });
    }
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
    });
  }
}) as RequestHandler;

demoRouter.post(`${API_PREFIX}/analyze`, upload.single('image'), analyzeHandler);

export default demoRouter;
