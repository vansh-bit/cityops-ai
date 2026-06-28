import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  googleApiKey: string;
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    storageBucket: string;
    authEmulatorHost?: string;
  };
  mapsApiKey: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please set it in your .env file or environment. ` +
        `See .env.example for reference.`,
    );
  }
  return value;
}

function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    googleApiKey: requireEnv('GOOGLE_API_KEY'),
    firebase: {
      projectId: requireEnv('FIREBASE_PROJECT_ID'),
      clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET'),
      authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    },
    mapsApiKey: requireEnv('MAPS_API_KEY'),
  };
}

export { AppConfig, loadConfig, requireEnv };
