import { CloudStorageProvider } from '../CloudStorageProvider';
import { getStorage } from '../../../config/firebase';

jest.mock('../../../config/firebase');

describe('CloudStorageProvider', () => {
  let provider: CloudStorageProvider;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    provider = new CloudStorageProvider();
    
    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined)
    };

    mockBucket = {
      name: 'test-bucket',
      file: jest.fn().mockReturnValue(mockFile)
    };

    (getStorage as jest.Mock).mockReturnValue({
      bucket: jest.fn().mockReturnValue(mockBucket)
    });
    
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const baseMetadata = {
    trackingId: 'test-id',
    mimeType: 'image/jpeg',
    size: 1024,
    source: 'test'
  };

  it('should successfully upload a supported file', async () => {
    const buffer = Buffer.from('test');
    const result = await provider.uploadImage(buffer, baseMetadata);

    expect(result.success).toBe(true);
    expect(result.canonicalPath).toBe('gs://test-bucket/reports/test-id/original.jpg');
    expect(result.internalFilePath).toBe('reports/test-id/original.jpg');
    expect(mockBucket.file).toHaveBeenCalledWith('reports/test-id/original.jpg');
    expect(mockFile.save).toHaveBeenCalled();
  });

  it('should reject unsupported MIME types', async () => {
    const buffer = Buffer.from('test');
    const result = await provider.uploadImage(buffer, { ...baseMetadata, mimeType: 'application/pdf' });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(mockFile.save).not.toHaveBeenCalled();
  });

  it('should reject oversized uploads (metadata)', async () => {
    const buffer = Buffer.from('test');
    const result = await provider.uploadImage(buffer, { ...baseMetadata, size: 15 * 1024 * 1024 });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FILE_TOO_LARGE');
    expect(mockFile.save).not.toHaveBeenCalled();
  });

  it('should reject oversized uploads (buffer size)', async () => {
    const buffer = Buffer.alloc(11 * 1024 * 1024);
    const result = await provider.uploadImage(buffer, baseMetadata);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FILE_TOO_LARGE');
    expect(mockFile.save).not.toHaveBeenCalled();
  });

  it('should map Firebase errors properly', async () => {
    mockFile.save.mockRejectedValueOnce({ code: 403, message: 'permission denied' });
    const buffer = Buffer.from('test');
    
    const promise = provider.uploadImage(buffer, baseMetadata);
    // Non-transient error, fails fast
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('PERMISSION_DENIED');
  });

  it('should utilize retry logic for transient errors', async () => {
    mockFile.save
      .mockRejectedValueOnce({ message: 'network error timeout' })
      .mockResolvedValueOnce(undefined);
      
    const buffer = Buffer.from('test');
    const promise = provider.uploadImage(buffer, baseMetadata);
    
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    expect(mockFile.save).toHaveBeenCalledTimes(2);
  });

  it('should correctly delete image via rollback helper', async () => {
    const success = await provider.deleteImage('reports/test-id/original.jpg', 'test-id');
    
    expect(success).toBe(true);
    expect(mockBucket.file).toHaveBeenCalledWith('reports/test-id/original.jpg');
    expect(mockFile.delete).toHaveBeenCalled();
  });
});
