import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

type RawServiceAccount = {
  project_id?: unknown;
  client_email?: unknown;
  private_key?: unknown;
  projectId?: unknown;
  clientEmail?: unknown;
  privateKey?: unknown;
};

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT tidak memiliki field ${fieldName} yang valid.`);
  }

  return value.trim();
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  let parsed: RawServiceAccount;

  try {
    parsed = JSON.parse(raw) as RawServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT bukan JSON yang valid.");
  }

  const projectId = requireString(parsed.projectId ?? parsed.project_id, "project_id");
  const clientEmail = requireString(parsed.clientEmail ?? parsed.client_email, "client_email");
  const privateKey = requireString(parsed.privateKey ?? parsed.private_key, "private_key");

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function getAdminApp(): App {
  if (app) return app;

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const serviceAccount = parseServiceAccount();

  app = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId: serviceAccount?.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  return app;
}

export function getAdminAuth(): Auth {
  auth ??= getAuth(getAdminApp());
  return auth;
}

export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
    db.settings({ ignoreUndefinedProperties: true });
  }

  return db;
}
