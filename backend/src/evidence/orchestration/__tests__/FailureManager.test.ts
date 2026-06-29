import { FailureManager } from '../failure/FailureManager';
import { EvidenceResponse, EvidenceStatus } from '../../contracts/evidenceContracts';

describe('FailureManager', () => {
  it('resolves with provider response if within timeout', async () => {
    const mockResponse: EvidenceResponse = {
      requestId: 'req-1',
      status: EvidenceStatus.VALID,
      evidence: null, // mock
    };
    
    const promise = Promise.resolve(mockResponse);
    
    const result = await FailureManager.executeWithTimeout('req-1', 'MockProvider', promise, 1000);
    
    expect(result.status).toBe(EvidenceStatus.VALID);
  });

  it('resolves with ERROR if provider times out', async () => {
    const promise = new Promise<EvidenceResponse>((resolve) => {
      setTimeout(() => resolve({} as any), 500);
    });
    
    const result = await FailureManager.executeWithTimeout('req-2', 'MockProvider', promise, 100);
    
    expect(result.status).toBe(EvidenceStatus.ERROR);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('timed out');
  });

  it('resolves with ERROR if provider throws unhandled exception', async () => {
    const promise = Promise.reject(new Error('Sync crash'));
    
    const result = await FailureManager.executeWithTimeout('req-3', 'MockProvider', promise, 1000);
    
    expect(result.status).toBe(EvidenceStatus.ERROR);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('Sync crash');
  });
});
