import { ToolRegistry, ToolRegistryError } from '../ToolRegistry';
import { ITool } from '../../contracts';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  const mockTool: ITool = {
    metadata: {
      toolId: 'test-tool',
      name: 'Test Tool',
      category: 'Test',
      purpose: 'Testing',
      requiredInputs: ['input1'],
      outputType: 'test_output',
      timeoutMs: 1000,
      enabled: true,
      version: '1.0.0'
    },
    execute: jest.fn()
  };

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register and retrieve a tool', () => {
    registry.registerTool(mockTool);
    expect(registry.hasTool('test-tool')).toBe(true);
    expect(registry.getTool('test-tool')).toBe(mockTool);
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('should throw an error on duplicate registration', () => {
    registry.registerTool(mockTool);
    expect(() => registry.registerTool(mockTool)).toThrow(ToolRegistryError);
    expect(() => registry.registerTool(mockTool)).toThrow(/Duplicate registration/);
  });

  it('should throw an error when getting a non-existent tool', () => {
    expect(() => registry.getTool('non-existent')).toThrow(ToolRegistryError);
  });

  it('should throw an error if metadata is missing required fields', () => {
    const invalidTool = {
      ...mockTool,
      metadata: {
        ...mockTool.metadata,
        name: ''
      }
    };
    expect(() => registry.registerTool(invalidTool)).toThrow(/Invalid metadata/);
  });
});
