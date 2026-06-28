type PromptId = 'vision' | 'decision' | 'tool-selection' | 'confidence';

type PromptResponsibility =
  | 'visual-understanding'
  | 'operational-reasoning'
  | 'evidence-planning'
  | 'confidence-assessment';

interface PromptDefinition {
  id: PromptId;
  version: string;
  responsibility: PromptResponsibility;
  description: string;
  systemInstruction: string;
  outputSchema: string;
  metadata: {
    owner: string;
    reviewed: boolean;
    lastUpdated: string;
  };
}

export { type PromptDefinition, type PromptId, type PromptResponsibility };
