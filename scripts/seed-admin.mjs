import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT belum diisi di .env.local");
const serviceAccount = JSON.parse(raw);
const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || "Administrator";
if (!email || !password || password.length < 8) throw new Error("SEED_ADMIN_EMAIL dan password minimal 8 karakter wajib diisi.");

let user;
try {
  user = await auth.getUserByEmail(email);
  user = await auth.updateUser(user.uid, { password, displayName: name });
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, displayName: name, emailVerified: true });
}
await auth.setCustomUserClaims(user.uid, { role: "ADMIN" });
const now = new Date().toISOString();
await db.collection("users").doc(user.uid).set({ email, name, role: "ADMIN", jobTitle: "Owner / Administrator", department: "Management", isActive: true, createdAt: now, updatedAt: now }, { merge: true });
console.log(`Admin siap: ${email} (${user.uid})`);
