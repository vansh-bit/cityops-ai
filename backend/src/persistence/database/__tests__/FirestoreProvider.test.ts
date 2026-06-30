import { FirestoreProvider, FirestorePersistencePayload } from '../FirestoreProvider';
import { getFirestore } from '../../../config/firebase';

jest.mock('../../../config/firebase');

describe('FirestoreProvider', () => {
  let provider: FirestoreProvider;
  let mockDb: any;
  let mockDoc: any;

  const mockPayload: FirestorePersistencePayload = {
    trackingId: 'test-doc-id',
    createdAt: '2023-01-01',
    submittedAt: '2023-01-01',
    status: 'SUBMITTED',
    storageObjectPath: 'gs://bucket/file.jpg',
    municipality: 'Springfield',
    visionResult: {},
    evidencePackage: {},
    decision: {},
    confidence: {},
    municipalityReport: {},
    metadata: {
      runtimeVersion: '1.0',
      submissionSource: 'web',
      schemaVersion: '1.1'
    }
  };

  beforeEach(() => {
    provider = new FirestoreProvider();
    
    mockDoc = {
      set: jest.fn().mockResolvedValue(undefined)
    };

    const mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc)
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    (getFirestore as jest.Mock).mockReturnValue(mockDb);
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create a document using Tracking ID as document ID', async () => {
    const result = await provider.persistReport(mockPayload);
    
    expect(result.success).toBe(true);
    expect(mockDb.collection).toHaveBeenCalledWith('reports');
    expect(mockDb.collection().doc).toHaveBeenCalledWith('test-doc-id');
    expect(mockDoc.set).toHaveBeenCalledWith(mockPayload);
  });

  it('should reject oversized payloads', async () => {
    // Generate a payload > 1MB
    const hugePayload = { ...mockPayload, visionResult: { data: 'x'.repeat(1000001) } };
    
    const result = await provider.persistReport(hugePayload);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PAYLOAD_TOO_LARGE');
    expect(mockDoc.set).not.toHaveBeenCalled();
  });

  it('should map Firestore permission denied error', async () => {
    mockDoc.set.mockRejectedValueOnce({ code: 7, message: 'permission denied' });
    
    const result = await provider.persistReport(mockPayload);
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('should utilize retry logic for transient errors like deadline exceeded', async () => {
    mockDoc.set
      .mockRejectedValueOnce({ code: 4, message: 'deadline exceeded' })
      .mockResolvedValueOnce(undefined);
      
    const promise = provider.persistReport(mockPayload);
    
    await jest.runAllTimersAsync();
    const result = await promise;
    
    expect(result.success).toBe(true);
    expect(mockDoc.set).toHaveBeenCalledTimes(2);
  });
});
