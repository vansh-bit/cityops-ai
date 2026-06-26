import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppConfig } from './index';
import logger from '../utils/logger';

let genAI: GoogleGenerativeAI;

function initializeGemini(config: AppConfig): void {
  try {
    genAI = new GoogleGenerativeAI(config.googleApiKey);
    logger.info('Gemini SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Gemini SDK', { error });
    throw error;
  }
}

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    throw new Error('Gemini SDK has not been initialized. Call initializeGemini() first.');
  }
  return genAI;
}

export { initializeGemini, getGeminiClient };
