import { MapsProvider } from '../providers/maps/MapsProvider';
import { EvidenceFramework } from '../framework/EvidenceFramework';
import { EvidenceRequest, EvidenceSource, EvidenceStatus } from '../contracts/evidenceContracts';

describe('MapsProvider', () => {
  let provider: MapsProvider;
  let framework: EvidenceFramework;

  beforeEach(() => {
    process.env.STUB_MODE = 'true';
    framework = new EvidenceFramework();
    provider = new MapsProvider(framework);
    // Suppress console logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates requests correctly', () => {
    const validRequest: EvidenceRequest = {
      requestId: 'req-1',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };
    expect(provider.validateRequest(validRequest)).toBe(true);

    const invalidSource: EvidenceRequest = { ...validRequest, source: EvidenceSource.VISION_ANALYSIS };
    expect(provider.validateRequest(invalidSource)).toBe(false);

    const invalidParams: EvidenceRequest = { ...validRequest, parameters: { lat: '40.7128' } };
    expect(provider.validateRequest(invalidParams)).toBe(false);
  });

  it('collects and normalizes evidence', async () => {
    await provider.initialize();
    jest.spyOn((provider as any).adapter, 'reverseGeocode').mockResolvedValue({
      formatted_address: '123 Fake St, Springfield',
      geometry: {
        location: { lat: 40.7128, lng: -74.0060 }
      },
      place_id: 'place123',
      isMunicipalJurisdiction: true
    });

    const request: EvidenceRequest = {
      requestId: 'req-1',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.formattedAddress).toBe('123 Fake St, Springfield');
    expect(response.evidence?.data.coordinates.lat).toBe(40.7128);
  });

  it('handles external provider failure', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'reverseGeocode').mockRejectedValue(new Error('Internal Server Error'));

    const request: EvidenceRequest = {
      requestId: 'req-2',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Internal Server Error');
    adapterMock.mockRestore();
  });

  it('handles provider timeout', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'reverseGeocode').mockRejectedValue(new Error('Timeout'));

    const request: EvidenceRequest = {
      requestId: 'req-3',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Timeout');
    adapterMock.mockRestore();
  });

  it('handles rate limiting', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'reverseGeocode').mockRejectedValue(new Error('Rate Limit Exceeded'));

    const request: EvidenceRequest = {
      requestId: 'req-4',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Rate Limit Exceeded');
    adapterMock.mockRestore();
  });

  it('handles malformed provider response (normalization fallback)', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'reverseGeocode').mockResolvedValue(null);

    const request: EvidenceRequest = {
      requestId: 'req-5',
      source: EvidenceSource.GOOGLE_MAPS,
      parameters: { lat: 40.7128, lng: -74.0060 }
    };

    const response = await provider.collectEvidence(request);

    // Assuming normalizer returns {} for null response, which passes our basic validation but has missing fields
    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence?.data?.formattedAddress).toBeUndefined();
    adapterMock.mockRestore();
  });
});
