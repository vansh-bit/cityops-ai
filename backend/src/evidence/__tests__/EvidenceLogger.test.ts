import { EvidenceLogger } from '../logging/EvidenceLogger';
import logger from '../../utils/logger';

// Mock the winston logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('EvidenceLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs evidence creation started', () => {
    EvidenceLogger.logEvidenceCreationStarted('p-1', 'req-1');
    expect(logger.info).toHaveBeenCalledWith('Evidence collection started', {
      event: 'evidence_collection_started',
      providerId: 'p-1',
      requestId: 'req-1',
    });
  });

  it('logs evidence creation completed', () => {
    EvidenceLogger.logEvidenceCreationCompleted('p-1', 'req-1', 150, 'VALID');
    expect(logger.info).toHaveBeenCalledWith('Evidence collection completed', {
      event: 'evidence_collection_completed',
      providerId: 'p-1',
      requestId: 'req-1',
      durationMs: 150,
      status: 'VALID'
    });
  });

  it('logs validation failures', () => {
    EvidenceLogger.logEvidenceValidationFailed('p-1', 'req-1', ['error 1']);
    expect(logger.warn).toHaveBeenCalledWith('Evidence validation failed', {
      event: 'evidence_validation_failed',
      providerId: 'p-1',
      requestId: 'req-1',
      validationErrors: ['error 1']
    });
  });

  it('logs provider errors', () => {
    EvidenceLogger.logEvidenceProviderError('p-1', 'req-1', 'Network timeout');
    expect(logger.error).toHaveBeenCalledWith('Evidence provider error: Network timeout', {
      event: 'evidence_provider_error',
      providerId: 'p-1',
      requestId: 'req-1',
    });
  });
});
