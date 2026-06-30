import { MunicipalProvider } from '../providers/municipal/MunicipalProvider';
import { EvidenceFramework } from '../framework/EvidenceFramework';
import { EvidenceRequest, EvidenceSource, EvidenceStatus } from '../contracts/evidenceContracts';

describe('MunicipalProvider', () => {
  let provider: MunicipalProvider;
  let framework: EvidenceFramework;

  beforeEach(() => {
    process.env.STUB_MODE = 'true';
    framework = new EvidenceFramework();
    provider = new MunicipalProvider(framework);
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
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };
    expect(provider.validateRequest(validRequest)).toBe(true);

    const invalidParams: EvidenceRequest = { ...validRequest, parameters: {} };
    expect(provider.validateRequest(invalidParams)).toBe(false);
  });

  it('collects and normalizes evidence', async () => {
    await provider.initialize();
    jest.spyOn((provider as any).adapter, 'fetchAssetContext').mockResolvedValue({
      asset_id: 'ASSET-999',
      department_owner: 'Department of Transportation',
      lastInspected: '2026-06-01'
    });

    const request: EvidenceRequest = {
      requestId: 'req-1',
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence).toBeDefined();
    expect(response.evidence?.data.assetId).toBe('ASSET-999');
    expect(response.evidence?.data.department).toBe('Department of Transportation');
  });

  it('handles external provider failure', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'fetchAssetContext').mockRejectedValue(new Error('Internal Server Error'));

    const request: EvidenceRequest = {
      requestId: 'req-2',
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Internal Server Error');
    adapterMock.mockRestore();
  });

  it('handles provider timeout', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'fetchAssetContext').mockRejectedValue(new Error('Timeout'));

    const request: EvidenceRequest = {
      requestId: 'req-3',
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Timeout');
    adapterMock.mockRestore();
  });

  it('handles rate limiting', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'fetchAssetContext').mockRejectedValue(new Error('Rate Limit Exceeded'));

    const request: EvidenceRequest = {
      requestId: 'req-4',
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.ERROR);
    expect(response.errors).toContain('Rate Limit Exceeded');
    adapterMock.mockRestore();
  });

  it('handles malformed provider response (normalization fallback)', async () => {
    const adapterMock = jest.spyOn((provider as any).adapter, 'fetchAssetContext').mockResolvedValue(null);

    const request: EvidenceRequest = {
      requestId: 'req-5',
      source: EvidenceSource.MUNICIPAL,
      parameters: { locationQuery: '123 Fake St' }
    };

    const response = await provider.collectEvidence(request);

    expect(response.status).toBe(EvidenceStatus.VALID);
    expect(response.evidence?.data?.department).toBeUndefined();
    adapterMock.mockRestore();
  });
});
