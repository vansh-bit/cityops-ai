import { ITool } from '../contracts';

export class ToolRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolRegistryError';
  }
}

export interface IToolRegistry {
  registerTool(tool: ITool): void;
  getTool(toolId: string): ITool;
  getAllTools(): ITool[];
  hasTool(toolId: string): boolean;
}

export class ToolRegistry implements IToolRegistry {
  private readonly tools = new Map<string, ITool>();

  /**
   * Registers a tool in the registry.
   * Throws an error if the tool identifier is already registered.
   */
  public registerTool(tool: ITool): void {
    const { toolId } = tool.metadata;
    if (this.tools.has(toolId)) {
      throw new ToolRegistryError(`Duplicate registration: Tool with ID '${toolId}' is already registered.`);
    }
    
    // Basic metadata validation
    if (!tool.metadata.name || !tool.metadata.purpose) {
      throw new ToolRegistryError(`Invalid metadata: Tool '${toolId}' is missing required metadata fields.`);
    }

    this.tools.set(toolId, tool);
  }

  /**
   * Retrieves a tool by its ID.
   * Throws if the tool does not exist.
   */
  public getTool(toolId: string): ITool {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new ToolRegistryError(`Tool not found: '${toolId}' is not registered in the Tool Registry.`);
    }
    return tool;
  }

  /**
   * Returns an array of all registered tools.
   */
  public getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Checks if a tool is registered.
   */
  public hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }
}
