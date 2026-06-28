import fs from 'fs/promises';
import path from 'path';
import { AIConfigurationError, AIParsingError } from '../exceptions';
import type { PromptDefinition } from '../contracts';

interface PromptLoaderOptions {
  definitionsPath?: string;
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

class PromptLoader {
  constructor(private readonly options: PromptLoaderOptions = {}) {}

  async loadPrompts(): Promise<PromptDefinition[]> {
    const definitionsPath = await this.resolveDefinitionsPath();
    const fileNames = await fs.readdir(definitionsPath);
    const promptFiles = fileNames.filter((fileName) => fileName.endsWith('.json'));

    if (promptFiles.length === 0) {
      throw new AIConfigurationError('No prompt definition files were found.', [definitionsPath]);
    }

    const prompts = await Promise.all(
      promptFiles.map(async (fileName) => {
        const filePath = path.join(definitionsPath, fileName);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const parsedPrompt = JSON.parse(fileContents) as PromptDefinition;

        this.validatePromptDefinition(parsedPrompt, filePath);
        return parsedPrompt;
      }),
    );

    return prompts;
  }

  validatePromptDefinition(prompt: PromptDefinition, filePath = 'unknown'): void {
    if (!prompt.id || !prompt.version || !prompt.systemInstruction || !prompt.outputSchema) {
      throw new AIParsingError('Prompt definition is missing required fields.', [filePath]);
    }

    if (!SEMVER_PATTERN.test(prompt.version)) {
      throw new AIParsingError('Prompt version must use semantic versioning.', [filePath, prompt.version]);
    }
  }

  private async resolveDefinitionsPath(): Promise<string> {
    const configuredPath = this.options.definitionsPath;

    if (configuredPath) {
      return configuredPath;
    }

    const candidatePaths = [
      path.resolve(__dirname, 'definitions'),
      path.resolve(process.cwd(), 'backend/src/ai/prompts/definitions'),
      path.resolve(process.cwd(), 'src/ai/prompts/definitions'),
    ];

    for (const candidatePath of candidatePaths) {
      try {
        await fs.access(candidatePath);
        return candidatePath;
      } catch {
        continue;
      }
    }

    throw new AIConfigurationError('Unable to resolve prompt definitions path.');
  }
}

export { PromptLoader, type PromptLoaderOptions };
