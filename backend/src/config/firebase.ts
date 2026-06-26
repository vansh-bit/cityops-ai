import * as admin from 'firebase-admin';
import { AppConfig } from './index';
import logger from '../utils/logger';

let app: admin.app.App;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

function initializeFirebase(config: AppConfig): void {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      storageBucket: config.storageBucket,
    });

    db = admin.firestore();
    storage = admin.storage();

    logger.info('Firebase initialized successfully', {
      projectId: config.firebase.projectId,
      storageBucket: config.storageBucket,
    });
  } catch (error) {
    logger.error('Failed to initialize Firebase', { error });
    throw error;
  }
}

function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return db;
}

function getStorage(): admin.storage.Storage {
  if (!storage) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return storage;
}

function getFirebaseApp(): admin.app.App {
  if (!app) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return app;
}

export { initializeFirebase, getFirestore, getStorage, getFirebaseApp };
