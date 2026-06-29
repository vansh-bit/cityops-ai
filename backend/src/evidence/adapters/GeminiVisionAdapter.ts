import { GoogleGenerativeAI, Schema, Type } from '@google/generative-ai';
import logger from '../../utils/logger';

export class GeminiVisionAdapter {
  private apiKey: string;
  public stubMode: boolean;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.stubMode = process.env.STUB_MODE === 'true';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      if (!this.stubMode) {
        throw new Error('Configuration Error: GEMINI_API_KEY is missing and STUB_MODE is not enabled.');
      }
      logger.warn('GeminiVisionAdapter initialized in STUB_MODE because GEMINI_API_KEY is missing.');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Invokes the vision API to extract observations from an image.
   * Returns a deterministic stub if API key is missing.
   */
  async extractObservations(imageBuffer: Buffer, mimeType: string): Promise<any> {
    if (this.stubMode && !this.apiKey) {
      // Deterministic stub
      return {
        issueType: 'POTHOLE',
        severity: 'HIGH',
        description: 'A large pothole with visible water accumulation on the asphalt.',
        observations: ['Pothole detected', 'Water pooling around edge'],
        potentialHazards: ['Vehicle damage risk', 'Trip hazard'],
        infrastructure: 'ROAD',
        inspectionPriority: 'HIGH',
        reasoningSummary: 'Visible structural damage indicating an infrastructure defect.',
        limitations: []
      };
    }

    if (!this.genAI) {
      throw new Error('GeminiVisionAdapter not properly initialized.');
    }

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        issueType: {
          type: Type.STRING,
          description: "Detected issue type, e.g. POTHOLE, GARBAGE, BROKEN_STREETLIGHT, DRAIN_OVERFLOW, FALLEN_TREE, ROAD_DAMAGE, WATER_LEAK, GRAFFITI, TRAFFIC_SIGNAL, UNKNOWN",
        },
        severity: {
          type: Type.STRING,
          description: "Severity level, e.g. LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN",
        },
        description: {
          type: Type.STRING,
          description: "Human-readable description of the visible issue (max 500 characters)",
        },
        observations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of visible observations",
        },
        potentialHazards: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Possible risks inferred from visible evidence",
        },
        infrastructure: {
          type: Type.STRING,
          description: "Primary infrastructure affected, e.g. ROAD, FOOTPATH, DRAIN, STREETLIGHT, TRAFFIC_SIGNAL, PARK, PUBLIC_PROPERTY, UNKNOWN",
        },
        inspectionPriority: {
          type: Type.STRING,
          description: "Suggested inspection urgency, e.g. LOW, MEDIUM, HIGH, CRITICAL, UNKNOWN",
        },
        reasoningSummary: {
          type: Type.STRING,
          description: "Short explanation describing why the issue was classified (max 300 characters)",
        },
        limitations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Known uncertainties, e.g. poor lighting, blurry image",
        }
      },
      required: [
        "issueType", "severity", "description", "observations", 
        "potentialHazards", "infrastructure", "inspectionPriority", 
        "reasoningSummary", "limitations"
      ]
    };

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    const prompt = `You are an AI vision system for CityOps AI.
Your responsibility is to analyze a citizen-submitted municipal image.
Only describe what can reasonably be observed.
Never fabricate information.
Never guess invisible details.
Never invent locations.
Never assign municipal departments.
Never calculate confidence scores.
Never generate reports.
Never produce conversational responses.
Return structured JSON only.
If information cannot be determined from the image, explicitly return "UNKNOWN".

Analyze the uploaded image.
Identify:
* incident category
* visible severity
* visible observations
* potential hazards
* infrastructure affected
* recommended inspection priority

Only use information visible in the image.
Do not speculate.
Return valid JSON matching the VisionResult schema.`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      }
    };

    let retries = 0;
    const maxRetries = 1;
    
    while (retries <= maxRetries) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT: Gemini request exceeded 30 seconds')), 30000)
        );

        const generatePromise = model.generateContent([prompt, imagePart]);
        const result = await Promise.race([generatePromise, timeoutPromise]) as any;

        const responseText = result.response.text();
        return JSON.parse(responseText);
      } catch (error: any) {
        if (error.message.includes('TIMEOUT') || error.message.includes('503') || error.message.includes('network')) {
          retries++;
          logger.warn(`Gemini API transient error, retry ${retries}/${maxRetries}`, { error: error.message });
          if (retries > maxRetries) {
            throw error;
          }
        } else {
          logger.error('Gemini API non-retryable error', { error: error.message });
          throw error;
        }
      }
    }
  }
}
