import { ITool, ToolMetadata, ToolResponse } from '../../../tools/contracts';
import { EvidenceCoordinator } from '../coordinator/EvidenceCoordinator';
import { EvidenceRequest, EvidenceSource } from '../../contracts/evidenceContracts';
import logger from '../../../utils/logger';

export class EvidenceToolAdapter implements ITool {
  private coordinator: EvidenceCoordinator;
  public readonly metadata: ToolMetadata;

  constructor(coordinator: EvidenceCoordinator) {
    this.coordinator = coordinator;
    this.metadata = {
      toolId: 'evidence_collection_tool',
      name: 'Evidence Collection Tool',
      category: 'Evidence',
      purpose: 'Collects contextual evidence from external providers such as Maps, Vision, and Municipal data.',
      requiredInputs: ['providers'],
      outputType: 'EvidencePackage',
      timeoutMs: 15000,
      enabled: true,
      version: '1.0.0'
    };
  }

  async execute(inputs: Record<string, unknown>): Promise<ToolResponse> {
    try {
      const providersInput = inputs['providers'];
      let requestedSources: string[] = [];
      
      if (Array.isArray(providersInput)) {
        requestedSources = providersInput.map(String);
      } else if (typeof providersInput === 'string') {
        requestedSources = [providersInput];
      }

      const requestId = `ev-${Date.now()}`;

      // Map string sources to enum
      const evidenceRequests: EvidenceRequest[] = requestedSources.map((sourceStr, index) => {
        let sourceEnum: EvidenceSource;
        if (Object.values(EvidenceSource).includes(sourceStr as EvidenceSource)) {
          sourceEnum = sourceStr as EvidenceSource;
        } else {
          sourceEnum = EvidenceSource.UNKNOWN;
        }

        return {
          requestId: `${requestId}-${index}`,
          source: sourceEnum,
          parameters: inputs, // Pass all inputs down, providers validate their own needs
          timeoutMs: this.metadata.timeoutMs
        };
      });

      const evidencePackage = await this.coordinator.collectEvidence(evidenceRequests);

      return {
        data: {
          package: evidencePackage
        }
      };
    } catch (error) {
      logger.error('EvidenceToolAdapter execution failed', {
        event: 'tool_adapter_error',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
