import { AIConfigurationError } from '../exceptions';
import type { PromptDefinition, PromptId } from '../contracts';

interface PromptRepository {
  getPrompt(id: PromptId, version: string): PromptDefinition | null;
  listVersions(id: PromptId): string[];
  listPromptIds(): PromptId[];
}

class InMemoryPromptRepository implements PromptRepository {
  private readonly promptIndex = new Map<PromptId, Map<string, PromptDefinition>>();

  constructor(prompts: PromptDefinition[]) {
    for (const prompt of prompts) {
      const versions = this.promptIndex.get(prompt.id) ?? new Map<string, PromptDefinition>();

      if (versions.has(prompt.version)) {
        throw new AIConfigurationError('Duplicate prompt version detected.', [prompt.id, prompt.version]);
      }

      versions.set(prompt.version, prompt);
      this.promptIndex.set(prompt.id, versions);
    }
  }

  getPrompt(id: PromptId, version: string): PromptDefinition | null {
    return this.promptIndex.get(id)?.get(version) ?? null;
  }

  listVersions(id: PromptId): string[] {
    return [...(this.promptIndex.get(id)?.keys() ?? [])].sort(compareVersions);
  }

  listPromptIds(): PromptId[] {
    return [...this.promptIndex.keys()].sort();
  }
}

function compareVersions(left: string, right: string): number {
  const leftSegments = left.split('.').map(Number);
  const rightSegments = right.split('.').map(Number);

  for (let index = 0; index < Math.max(leftSegments.length, rightSegments.length); index += 1) {
    const leftValue = leftSegments[index] ?? 0;
    const rightValue = rightSegments[index] ?? 0;

    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

export { compareVersions, InMemoryPromptRepository, type PromptRepository };
