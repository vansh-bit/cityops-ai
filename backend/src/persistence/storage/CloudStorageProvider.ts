import { getStorage } from '../../config/firebase';
import logger from '../../utils/logger';
import { withRetry } from '../utils/RetryHelper';

export interface UploadMetadata {
  trackingId: string;
  mimeType: string;
  originalFilename?: string;
  size: number;
  source: string;
}

export interface CloudStorageResult {
  success: boolean;
  canonicalPath?: string;
  internalFilePath?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Phase 5C - Cloud Storage Provider
 * Handles uploading incident images to Firebase Cloud Storage.
 */
export class CloudStorageProvider {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  /**
   * Uploads the image buffer to Cloud Storage.
   * @param buffer The image buffer
   * @param metadata Upload metadata including Tracking ID
   * @returns CloudStorageResult containing the canonical storage path
   */
  public async uploadImage(buffer: Buffer, metadata: UploadMetadata): Promise<CloudStorageResult> {
    const startTime = Date.now();
    logger.info('Cloud Storage upload started', { trackingId: metadata.trackingId });

    if (metadata.size > this.MAX_FILE_SIZE || buffer.length > this.MAX_FILE_SIZE) {
      return {
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 10MB limit.' }
      };
    }

    try {
      // F-09 & F-10: Strict MIME Validation & no silent fallback
      let ext: string;
      if (metadata.mimeType === 'image/png') ext = 'png';
      else if (metadata.mimeType === 'image/webp') ext = 'webp';
      else if (metadata.mimeType === 'image/jpeg') ext = 'jpg';
      else {
        return {
          success: false,
          error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: `Unsupported MIME type: ${metadata.mimeType}` }
        };
      }

      const bucket = getStorage().bucket();
      const filePath = `reports/${metadata.trackingId}/original.${ext}`;
      const file = bucket.file(filePath);

      // F-02: Retry utility integration
      await withRetry(`UploadImage-${metadata.trackingId}`, async () => {
        await file.save(buffer, {
          metadata: {
            contentType: metadata.mimeType,
            metadata: {
              trackingId: metadata.trackingId,
              originalFilename: metadata.originalFilename || 'unknown',
              size: metadata.size.toString(),
              source: metadata.source,
              schemaVersion: '1.0'
            }
          },
          timeout: 5000 // 5 seconds timeout
        });
      });

      // Bucket name
      const bucketName = bucket.name;
      const canonicalPath = `gs://${bucketName}/${filePath}`;

      logger.info('Cloud Storage upload completed', {
        trackingId: metadata.trackingId,
        durationMs: Date.now() - startTime,
        canonicalPath
      });

      return {
        success: true,
        canonicalPath,
        internalFilePath: filePath // F-11
      };
    } catch (error: any) {
      logger.error('Cloud Storage upload failed', {
        trackingId: metadata.trackingId,
        error: error.message,
        code: error.code,
        durationMs: Date.now() - startTime
      });

      // F-08: Improve error mapping
      let errorCode = 'CLOUD_STORAGE_UPLOAD_FAILURE';
      if (error.code === 403 || error.message.includes('permission denied')) errorCode = 'PERMISSION_DENIED';
      else if (error.code === 404 || error.message.includes('not found')) errorCode = 'BUCKET_NOT_FOUND';
      else if (error.message.includes('timeout')) errorCode = 'STORAGE_TIMEOUT';

      return {
        success: false,
        error: {
          code: errorCode,
          message: error.message || 'Failed to upload image to Cloud Storage.'
        }
      };
    }
  }

  /**
   * Deletes a previously uploaded image during rollback.
   */
  public async deleteImage(internalFilePath: string, trackingId: string): Promise<boolean> {
    try {
      logger.info('Cloud Storage rollback started', { trackingId, internalFilePath });
      const bucket = getStorage().bucket();
      
      const file = bucket.file(internalFilePath);
      
      await withRetry(`DeleteImage-${trackingId}`, async () => {
        await file.delete();
      });
      logger.info('Cloud Storage rollback completed', { trackingId, internalFilePath });
      return true;
    } catch (error: any) {
      logger.error('Cloud Storage rollback failed', {
        trackingId,
        internalFilePath,
        error: error.message
      });
      return false;
    }
  }
}
