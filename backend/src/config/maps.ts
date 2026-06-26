import { AppConfig } from './index';
import logger from '../utils/logger';

let mapsApiKey: string;

function initializeMaps(config: AppConfig): void {
  mapsApiKey = config.mapsApiKey;
  logger.info('Google Maps API key configured');
}

function getMapsApiKey(): string {
  if (!mapsApiKey) {
    throw new Error('Maps has not been initialized. Call initializeMaps() first.');
  }
  return mapsApiKey;
}

export { initializeMaps, getMapsApiKey };
