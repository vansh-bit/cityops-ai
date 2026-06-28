export interface ToolMetadata {
  /** Unique identifier for the tool */
  toolId: string;
  /** Human-readable tool name */
  name: string;
  /** Category of the tool */
  category: string;
  /** Purpose of the tool */
  purpose: string;
  /** Required input keys/schema */
  requiredInputs: string[];
  /** Expected output type */
  outputType: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Whether the tool is currently enabled */
  enabled: boolean;
  /** Tool version */
  version: string;
}

export interface ToolResponse {
  /** Raw data payload returned by the tool */
  data: Record<string, unknown>;
  /** Optional execution metadata provided by the tool itself */
  metadata?: Record<string, unknown>;
}

export interface ITool {
  /** Metadata describing the tool's capabilities and requirements */
  metadata: ToolMetadata;
  
  /** 
   * Executes the tool logic.
   * Tool receives inputs and should return a ToolResponse or throw an Error.
   * Tools should remain unaware of the Decision Engine.
   */
  execute(inputs: Record<string, unknown>): Promise<ToolResponse>;
}
