import { VisionProvider } from '../providers/vision/VisionProvider';
import { EvidenceFramework } from '../framework/EvidenceFramework';
import { EvidenceRequest, EvidenceSource, EvidenceStatus } from '../contracts/evidenceContracts';

describe('VisionProvider', () => {
  let provider: VisionProvider;
  let framework: EvidenceFramework;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test_key';
    framework = new EvidenceFramework();
    provider = new VisionProvider(framework);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates requests correctly', () => {
    const validRequest: EvidenceRequest = {
      requestId: 'req-1',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };
    expect(provider.validateRequest(validRequest)).toBe(true);

    const invalidParams: EvidenceRequest = { ...validRequest, parameters: { imageUrl: '' } };
    expect(provider.validateRequest(invalidParams)).toBe(false);
  });

  it('collects and normalizes evidence', async () => {
    const request: EvidenceRequest = {
      requestId: 'req-1',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };

    await provider.initialize();
    jest.spyOn((provider as any).adapter, 'extractObservations').mockResolvedValue({
      issueType: 'POTHOLE',
      severity: 'HIGH',
      observations: ['Pothole detected']
    });

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.severity).toBe('HIGH');
    expect(response.evidence?.data.observations).toContain('Pothole detected');
  });

  it('handles external provider failure', async () => {
    await provider.initialize();
    const adapterMock = jest.spyOn((provider as any).adapter, 'extractObservations').mockRejectedValue(new Error('Internal Server Error'));

    const request: EvidenceRequest = {
      requestId: 'req-2',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Internal Server Error');
    adapterMock.mockRestore();
  });

  it('handles provider timeout', async () => {
    await provider.initialize();
    const adapterMock = jest.spyOn((provider as any).adapter, 'extractObservations').mockRejectedValue(new Error('Timeout'));

    const request: EvidenceRequest = {
      requestId: 'req-3',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Timeout');
    adapterMock.mockRestore();
  });

  it('handles rate limiting', async () => {
    await provider.initialize();
    const adapterMock = jest.spyOn((provider as any).adapter, 'extractObservations').mockRejectedValue(new Error('Rate Limit Exceeded'));

    const request: EvidenceRequest = {
      requestId: 'req-4',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Rate Limit Exceeded');
    adapterMock.mockRestore();
  });

  it('handles malformed provider response (normalization fallback)', async () => {
    await provider.initialize();
    const adapterMock = jest.spyOn((provider as any).adapter, 'extractObservations').mockResolvedValue(null);

    const request: EvidenceRequest = {
      requestId: 'req-5',
      source: EvidenceSource.VISION_ANALYSIS,
      parameters: { imageBuffer: Buffer.from('test'), mimeType: 'image/jpeg' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence?.data).toBeNull();
    adapterMock.mockRestore();
  });
});
