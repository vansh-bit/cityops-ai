import { PersistenceCoordinator } from '../PersistenceCoordinator';
import { TrackingIdGenerator } from '../tracking/TrackingIdGenerator';
import { CloudStorageProvider } from '../storage/CloudStorageProvider';
import { FirestoreProvider } from '../database/FirestoreProvider';

// Mock dependencies
jest.mock('../tracking/TrackingIdGenerator');
jest.mock('../storage/CloudStorageProvider');
jest.mock('../database/FirestoreProvider');

describe('PersistenceCoordinator', () => {
  let coordinator: PersistenceCoordinator;
  let mockTrackingIdGenerator: jest.Mocked<TrackingIdGenerator>;
  let mockCloudStorageProvider: jest.Mocked<CloudStorageProvider>;
  let mockFirestoreProvider: jest.Mocked<FirestoreProvider>;

  const mockRequest = {
    imageBuffer: Buffer.from('test-image'),
    mimeType: 'image/jpeg',
    originalFilename: 'test.jpg',
    imageSize: 1024,
    runtimeResponse: {
      decision: { departmentRecommendation: 'Public Works' },
      visionResult: { issueType: 'pothole' },
      confidence: { overallScore: 0.9 },
      report: { status: 'READY' },
      evidencePackage: {
        municipalityInfo: { municipality: 'Test City' }
      }
    },
    location: { lat: 40, lng: -74 }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockTrackingIdGenerator = {
      generate: jest.fn().mockReturnValue('mocked-tracking-id')
    } as any;
    
    mockCloudStorageProvider = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn()
    } as any;
    
    mockFirestoreProvider = {
      persistReport: jest.fn()
    } as any;

    coordinator = new PersistenceCoordinator();
    // Inject mocks directly for testing
    (coordinator as any).trackingIdGenerator = mockTrackingIdGenerator;
    (coordinator as any).cloudStorageProvider = mockCloudStorageProvider;
    (coordinator as any).firestoreProvider = mockFirestoreProvider;
  });

  it('should successfully execute full atomic persistence', async () => {
    mockCloudStorageProvider.uploadImage.mockResolvedValue({
      success: true,
      canonicalPath: 'gs://bucket/reports/mocked-tracking-id/original.jpg'
    });
    mockFirestoreProvider.persistReport.mockResolvedValue({ success: true });

    const result = await coordinator.persist(mockRequest);

    expect(result.success).toBe(true);
    expect(result.trackingId).toBe('mocked-tracking-id');
    expect(result.storageObjectPath).toBe('gs://bucket/reports/mocked-tracking-id/original.jpg');
    
    // Verify sequence
    expect(mockTrackingIdGenerator.generate).toHaveBeenCalled();
    expect(mockCloudStorageProvider.uploadImage).toHaveBeenCalledWith(
      mockRequest.imageBuffer,
      expect.objectContaining({ trackingId: 'mocked-tracking-id' })
    );
    expect(mockFirestoreProvider.persistReport).toHaveBeenCalledWith(
      expect.objectContaining({
        trackingId: 'mocked-tracking-id',
        storageObjectPath: 'gs://bucket/reports/mocked-tracking-id/original.jpg',
        municipality: 'Test City' // Asserting F-01
      })
    );
  });

  it('should fail pre-persistence validation if payload is incomplete', async () => {
    const invalidRequest = { ...mockRequest, runtimeResponse: { ...mockRequest.runtimeResponse, report: null } };
    
    const result = await coordinator.persist(invalidRequest as any);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
    expect(mockTrackingIdGenerator.generate).not.toHaveBeenCalled();
  });

  it('should abort and return error if Tracking ID generation fails', async () => {
    mockTrackingIdGenerator.generate.mockImplementation(() => {
      throw new Error('Generation failed');
    });

    const result = await coordinator.persist(mockRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('TRACKING_ID_GENERATION_FAILURE');
    expect(mockCloudStorageProvider.uploadImage).not.toHaveBeenCalled();
    expect(mockFirestoreProvider.persistReport).not.toHaveBeenCalled();
  });

  it('should abort and return error if Cloud Storage fails', async () => {
    mockCloudStorageProvider.uploadImage.mockResolvedValue({
      success: false,
      error: { code: 'UPLOAD_FAIL', message: 'Failed to upload' }
    });

    const result = await coordinator.persist(mockRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UPLOAD_FAIL');
    expect(mockFirestoreProvider.persistReport).not.toHaveBeenCalled();
  });

  it('should perform atomic rollback if Firestore fails', async () => {
    // Storage succeeds
    mockCloudStorageProvider.uploadImage.mockResolvedValue({
      success: true,
      canonicalPath: 'gs://bucket/reports/mocked-tracking-id/original.jpg'
    });
    // Firestore fails
    mockFirestoreProvider.persistReport.mockResolvedValue({
      success: false,
      error: { code: 'FIRESTORE_FAIL', message: 'DB error' }
    });
    // Rollback succeeds
    mockCloudStorageProvider.deleteImage.mockResolvedValue(true);

    const result = await coordinator.persist(mockRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FIRESTORE_FAIL');
    
    // Verify rollback was called
    expect(mockCloudStorageProvider.deleteImage).toHaveBeenCalledWith(
      'gs://bucket/reports/mocked-tracking-id/original.jpg',
      'mocked-tracking-id'
    );
  });

  it('should return severe rollback failure if rollback fails', async () => {
    // Storage succeeds
    mockCloudStorageProvider.uploadImage.mockResolvedValue({
      success: true,
      canonicalPath: 'gs://bucket/reports/mocked-tracking-id/original.jpg'
    });
    // Firestore fails
    mockFirestoreProvider.persistReport.mockResolvedValue({
      success: false,
      error: { code: 'FIRESTORE_FAIL', message: 'DB error' }
    });
    // Rollback fails
    mockCloudStorageProvider.deleteImage.mockResolvedValue(false);

    const result = await coordinator.persist(mockRequest);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERSISTENCE_ROLLBACK_FAILED');
    
    // Verify rollback was called
    expect(mockCloudStorageProvider.deleteImage).toHaveBeenCalled();
  });
});
