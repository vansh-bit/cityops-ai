import { ToolValidator, ToolValidationError } from '../ToolValidator';
import { ITool } from '../../contracts';
import { ToolRequest } from '../../../ai/reasoning/models/decisionModels';

describe('ToolValidator', () => {
  let validator: ToolValidator;
  
  const mockTool: ITool = {
    metadata: {
      toolId: 'test-tool',
      name: 'Test Tool',
      category: 'Test',
      purpose: 'Testing',
      requiredInputs: ['arg1', 'arg2'],
      outputType: 'test_output',
      timeoutMs: 1000,
      enabled: true,
      version: '1.0.0'
    },
    execute: jest.fn()
  };

  const validRequest: ToolRequest = {
    requestId: 'req-123',
    toolId: 'test-tool',
    reason: 'testing',
    inputs: { arg1: 'value', arg2: 123 },
    expectedObservation: 'test',
    originatingStep: 1,
    timestamp: '2026-06-28T00:00:00Z'
  };

  beforeEach(() => {
    validator = new ToolValidator();
  });

  describe('validateRequest', () => {
    it('should pass for a valid request', () => {
      expect(() => validator.validateRequest(validRequest, mockTool)).not.toThrow();
    });

    it('should throw if requestId is missing', () => {
      const req = { ...validRequest, requestId: '' };
      expect(() => validator.validateRequest(req, mockTool)).toThrow(ToolValidationError);
    });

    it('should throw if toolId does not match', () => {
      const req = { ...validRequest, toolId: 'other-tool' };
      expect(() => validator.validateRequest(req, mockTool)).toThrow(/does not match registered tool ID/);
    });

    it('should throw if tool is disabled', () => {
      const disabledTool = { ...mockTool, metadata: { ...mockTool.metadata, enabled: false } };
      expect(() => validator.validateRequest(validRequest, disabledTool)).toThrow(/is currently disabled/);
    });

    it('should throw if required inputs are missing', () => {
      const req = { ...validRequest, inputs: { arg1: 'value' } }; // missing arg2
      expect(() => validator.validateRequest(req, mockTool)).toThrow(/missing required inputs: arg2/);
    });
  });

  describe('validateResponse', () => {
    it('should pass for a valid response', () => {
      expect(() => validator.validateResponse({ data: { result: true } })).not.toThrow();
    });

    it('should throw if response is null or not an object', () => {
      expect(() => validator.validateResponse(null)).toThrow(/must be an object/);
      expect(() => validator.validateResponse('string')).toThrow(/must be an object/);
    });

    it('should throw if "data" payload is missing', () => {
      expect(() => validator.validateResponse({ metadata: {} })).toThrow(/missing required "data" payload/);
      expect(() => validator.validateResponse({ data: null })).toThrow(/missing required "data" payload/);
    });
  });
});
