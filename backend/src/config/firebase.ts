import * as admin from 'firebase-admin';
import { AppConfig } from './index';
import logger from '../utils/logger';

let app: admin.app.App;
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;
let auth: admin.auth.Auth;

function initializeFirebase(config: AppConfig): void {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      projectId: config.firebase.projectId,
      storageBucket: config.firebase.storageBucket,
    });

    db = admin.firestore();
    storage = admin.storage();
    auth = admin.auth();

    db.settings({ ignoreUndefinedProperties: true });

    logger.info('Firebase initialized successfully', {
      projectId: config.firebase.projectId,
      storageBucket: config.firebase.storageBucket,
      authEmulatorHost: config.firebase.authEmulatorHost,
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

function getAuth(): admin.auth.Auth {
  if (!auth) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return auth;
}

function getFirebaseApp(): admin.app.App {
  if (!app) {
    throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
  }
  return app;
}

export { initializeFirebase, getFirestore, getStorage, getAuth, getFirebaseApp };
