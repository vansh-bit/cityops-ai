import { ToolResponseMapper } from '../ToolResponseMapper';
import { ITool, ToolResponse } from '../../contracts';
import { ToolRequest } from '../../../ai/reasoning/models/decisionModels';

describe('ToolResponseMapper', () => {
  let mapper: ToolResponseMapper;

  const mockTool: ITool = {
    metadata: {
      toolId: 'test-tool',
      name: 'Test Tool',
      category: 'Test',
      purpose: 'Testing',
      requiredInputs: [],
      outputType: 'test_output',
      timeoutMs: 1000,
      enabled: true,
      version: '1.0.0'
    },
    execute: jest.fn()
  };

  const mockRequest: ToolRequest = {
    requestId: 'req-123',
    toolId: 'test-tool',
    reason: 'testing',
    inputs: {},
    expectedObservation: 'test',
    originatingStep: 1,
    timestamp: '2026-06-28T00:00:00Z'
  };

  beforeEach(() => {
    mapper = new ToolResponseMapper();
  });

  describe('mapToObservation', () => {
    it('should map a ToolResponse to an Observation successfully', () => {
      const mockResponse: ToolResponse = { data: { success: true } };
      const metrics = { durationMs: 100, startedAt: '2026-06-28T00:00:00Z', completedAt: '2026-06-28T00:00:01Z' };
      
      const observation = mapper.mapToObservation(mockRequest, mockTool, mockResponse, metrics);

      expect(observation).toBeDefined();
      expect(observation.observationId).toBeDefined();
      expect(observation.source).toBe('test-tool');
      expect(observation.type).toBe('test_output');
      expect(observation.payload).toEqual({ success: true });
      expect(observation.status).toBe('success');
      expect(observation.requestId).toBe('req-123');
      expect(observation.timestamp).toBeDefined();
    });
  });

  describe('createFailureObservation', () => {
    it('should generate a structured failure observation', () => {
      const observation = mapper.createFailureObservation(mockRequest, 'test-tool', 'Internal Error');

      expect(observation).toBeDefined();
      expect(observation.observationId).toBeDefined();
      expect(observation.source).toBe('test-tool');
      expect(observation.type).toBe('error');
      expect(observation.payload).toEqual({ error: 'Internal Error' });
      expect(observation.status).toBe('failure');
      expect(observation.requestId).toBe('req-123');
      expect(observation.timestamp).toBeDefined();
    });

    it('should generate a timeout observation when specified', () => {
      const observation = mapper.createFailureObservation(mockRequest, 'test-tool', 'Timeout Error', 'timeout');
      expect(observation.status).toBe('timeout');
      expect(observation.payload).toEqual({ error: 'Timeout Error' });
    });
  });
});
