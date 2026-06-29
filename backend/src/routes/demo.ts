import { Router, Request, Response, RequestHandler } from 'express';
import { API_PREFIX } from 'cityops-ai-shared';
import { RuntimeFactory } from '../ai/factory/RuntimeFactory';
import { PerceptionResult } from '../ai/reasoning/models/decisionModels';
import { VisionProvider } from '../evidence/providers/vision/VisionProvider';
import { EvidenceFramework } from '../evidence/framework/EvidenceFramework';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';
import multer from 'multer';

const demoRouter = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

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
demoRouter.post(`${API_PREFIX}/analyze`, upload.single('image'), (async (req: Request, res: Response) => {
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

    const { latitude, longitude, description, demoMode } = req.body;

    // 1. Initialize Vision Provider
    const framework = new EvidenceFramework();
    const visionProvider = new VisionProvider(framework);
    await visionProvider.initialize();

    // 2. Fetch VisionResult
    const visionEvidence = await visionProvider.collectEvidence({
      requestId: randomUUID(),
      source: 'VISION_ANALYSIS',
      parameters: {
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype
      },
      timestamp: new Date().toISOString()
    });

    if (visionEvidence.status === 'ERROR') {
      const errorMsg = visionEvidence.errors?.[0] || 'Unknown error';
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
        latitude: parseFloat(latitude) || 40.7128,
        longitude: parseFloat(longitude) || -74.0060,
        citizenDescription: description || '',
        timestamp: new Date().toISOString()
      }
    };

    // 4. Execute Runtime
    const coordinator = await RuntimeFactory.create();
    logger.info(`Starting Production Execution for image upload`);
    const runtimeResponse = await coordinator.execute(perception);

    // 5. Build Final API Contract Response
    const responsePayload = {
      success: true,
      requestId: runtimeResponse.requestId,
      timestamp: runtimeResponse.timestamp,
      visionResult: visionResult,
      decision: {
        category: runtimeResponse.decision?.issueClassification || 'UNKNOWN',
        priority: runtimeResponse.decision?.priorityRecommendation || 'UNKNOWN',
        assignedDepartment: runtimeResponse.decision?.departmentRecommendation || 'UNKNOWN',
        reasoning: runtimeResponse.decision?.reasoning || 'No reasoning provided.'
      },
      confidence: {
        overallScore: runtimeResponse.confidence?.score || 0,
        confidenceLevel: runtimeResponse.confidence?.level || 'UNKNOWN',
        escalationRequired: runtimeResponse.confidence?.escalationRequired || false,
        reasoning: runtimeResponse.confidence?.explanation || 'No explanation provided.'
      },
      report: {
        reportTitle: `${runtimeResponse.decision?.issueClassification || 'Unknown'} Incident`,
        summary: runtimeResponse.decision?.reasoning || 'No summary available.',
        recommendedAction: `Dispatch ${runtimeResponse.decision?.departmentRecommendation || 'team'}`,
        status: "READY_FOR_SUBMISSION"
      }
    };

    res.status(200).json(responsePayload);

  } catch (error: any) {
    logger.error('Analyze route failed', { error });
    if (error.message === 'File too large') {
      return res.status(413).json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'File exceeds 10MB limit.' } });
    }
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
    });
  }
}) as RequestHandler);

export default demoRouter;
