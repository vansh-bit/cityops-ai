import { AIConfigurationError } from '../exceptions';
import type { PromptDefinition, PromptId } from '../contracts';
import { compareVersions, type PromptRepository } from './PromptRepository';

interface IPromptManager {
  resolvePrompt(promptId: PromptId, requestedVersion?: string): PromptDefinition;
}

interface PromptManagerDependencies {
  promptRepository: PromptRepository;
  defaultPromptVersion: string;
}

class PromptManager implements IPromptManager {
  constructor(private readonly dependencies: PromptManagerDependencies) {}

  resolvePrompt(promptId: PromptId, requestedVersion?: string): PromptDefinition {
    const versions = this.dependencies.promptRepository.listVersions(promptId);

    if (versions.length === 0) {
      throw new AIConfigurationError('No prompt versions are available for the requested prompt.', [promptId]);
    }

    const resolvedVersion =
      requestedVersion ||
      (versions.includes(this.dependencies.defaultPromptVersion)
        ? this.dependencies.defaultPromptVersion
        : [...versions].sort(compareVersions).at(-1));

    if (!resolvedVersion) {
      throw new AIConfigurationError('Unable to resolve a prompt version.', [promptId]);
    }

    const prompt = this.dependencies.promptRepository.getPrompt(promptId, resolvedVersion);

    if (!prompt) {
      throw new AIConfigurationError('Requested prompt version is not available.', [promptId, resolvedVersion]);
    }

    return prompt;
  }
}

export { PromptManager, type IPromptManager, type PromptManagerDependencies };
