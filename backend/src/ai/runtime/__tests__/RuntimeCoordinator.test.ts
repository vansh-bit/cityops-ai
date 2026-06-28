import { RuntimeCoordinator } from '../RuntimeCoordinator';
import { ExecutionController } from '../ExecutionController';
import { ConfidenceEngine } from '../../confidence/ConfidenceEngine';
import { ConfidenceEvaluationResult } from '../../confidence/models/confidenceModels';
import { ResponseBuilder } from '../ResponseBuilder';
import { FailureCoordinator } from '../FailureCoordinator';
import { RuntimeLogger } from '../RuntimeLogger';
import { RuntimeMetrics } from '../RuntimeMetrics';
import { PerceptionResult, DecisionState, DecisionResult } from '../../reasoning/models/decisionModels';
import { RuntimeStatus } from '../models/runtimeModels';

describe('RuntimeCoordinator End-to-End', () => {
  let coordinator: RuntimeCoordinator;
  let mockExecutionController: jest.Mocked<ExecutionController>;
  let mockConfidenceEngine: jest.Mocked<ConfidenceEngine>;
  let mockResponseBuilder: jest.Mocked<ResponseBuilder>;
  let mockFailureCoordinator: jest.Mocked<FailureCoordinator>;
  let mockLogger: jest.Mocked<RuntimeLogger>;
  let mockMetrics: jest.Mocked<RuntimeMetrics>;

  beforeEach(() => {
    mockExecutionController = {
      executeReasoningLoop: jest.fn()
    } as unknown as jest.Mocked<ExecutionController>;

    mockConfidenceEngine = {
      evaluate: jest.fn()
    } as unknown as jest.Mocked<ConfidenceEngine>;

    mockResponseBuilder = {
      buildResponse: jest.fn()
    } as unknown as jest.Mocked<ResponseBuilder>;

    mockFailureCoordinator = {
      handleFailure: jest.fn()
    } as unknown as jest.Mocked<FailureCoordinator>;

    mockLogger = {
      logInitialization: jest.fn(),
      logIterationStart: jest.fn(),
      logCompletion: jest.fn(),
      logFailure: jest.fn()
    } as unknown as jest.Mocked<RuntimeLogger>;

    mockMetrics = {
      recordExecution: jest.fn(),
      getStatistics: jest.fn()
    } as unknown as jest.Mocked<RuntimeMetrics>;

    coordinator = new RuntimeCoordinator(
      mockExecutionController,
      mockConfidenceEngine,
      mockResponseBuilder,
      mockFailureCoordinator,
      mockLogger,
      mockMetrics
    );
  });

  const perception: PerceptionResult = {
    detectedIssue: 'pothole',
    severityEstimate: 'high',
    visualObservations: [],
    metadata: { imageRef: 'img-1', latitude: 0, longitude: 0, timestamp: '' }
  };

  it('orchestrates successful execution pipeline', async () => {
    const decisionState = {
      stopped: true,
      decisionResult: { issueClassification: 'pothole' } as DecisionResult
    } as DecisionState;

    mockExecutionController.executeReasoningLoop.mockResolvedValue(decisionState);

    mockConfidenceEngine.evaluate.mockReturnValue({
      metadata: { confidenceLevel: 'High Confidence' }
    } as any);

    mockResponseBuilder.buildResponse.mockReturnValue({
      status: RuntimeStatus.COMPLETED
    } as any);

    const result = await coordinator.execute(perception);

    expect(mockLogger.logInitialization).toHaveBeenCalled();
    expect(mockExecutionController.executeReasoningLoop).toHaveBeenCalled();
    expect(mockConfidenceEngine.evaluate).toHaveBeenCalled();
    expect(mockMetrics.recordExecution).toHaveBeenCalledWith(expect.anything(), true);
    expect(mockResponseBuilder.buildResponse).toHaveBeenCalled();
    expect(result.status).toBe(RuntimeStatus.COMPLETED);
  });

  it('handles and routes failures gracefully', async () => {
    const error = new Error('Orchestration failed');
    mockExecutionController.executeReasoningLoop.mockRejectedValue(error);

    mockResponseBuilder.buildResponse.mockReturnValue({
      status: RuntimeStatus.FAILED
    } as any);

    const result = await coordinator.execute(perception);

    expect(mockLogger.logFailure).toHaveBeenCalled();
    expect(mockFailureCoordinator.handleFailure).toHaveBeenCalledWith(error, expect.anything());
    expect(mockMetrics.recordExecution).toHaveBeenCalledWith(expect.anything(), false);
    expect(mockConfidenceEngine.evaluate).not.toHaveBeenCalled();
    expect(result.status).toBe(RuntimeStatus.FAILED);
  });
});
