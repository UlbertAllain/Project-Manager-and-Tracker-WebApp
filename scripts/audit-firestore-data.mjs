import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const VALID_PROJECT_STATUSES = new Set([
  "NEW",
  "IN_PROGRESS",
  "FINISHING",
  "REVIEW",
  "REVISION",
  "ON_HOLD",
  "OVERDUE",
  "CANCELLED",
  "COMPLETED",
]);
const VALID_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const VALID_PAYMENT_STATUSES = new Set(["UNPAID", "PARTIAL", "PAID"]);

const fixMode = process.argv.includes("--fix");

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function initAdmin() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount) });
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  });
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeTechStack(value) {
  if (Array.isArray(value)) return JSON.stringify(value.filter((item) => typeof item === "string"));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? JSON.stringify(parsed.filter((item) => typeof item === "string"))
        : "[]";
    } catch {
      return JSON.stringify(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }
  }
  return "[]";
}

function inspectProject(id, data) {
  const issues = [];
  const fixes = {};

  if (!data.projectName) issues.push("missing projectName");
  if (!data.clientName) issues.push("missing clientName");
  if (!VALID_PROJECT_STATUSES.has(data.status)) {
    issues.push(`invalid status: ${data.status}`);
    fixes.status = "NEW";
  }
  if (!VALID_PRIORITIES.has(data.priority)) {
    issues.push(`invalid priority: ${data.priority}`);
    fixes.priority = "MEDIUM";
  }
  if (!VALID_PAYMENT_STATUSES.has(data.paymentStatus)) {
    issues.push(`invalid paymentStatus: ${data.paymentStatus}`);
    fixes.paymentStatus = "UNPAID";
  }

  for (const field of ["budget", "paidAmount", "totalExpense", "progress"]) {
    if (!isNumber(data[field])) {
      issues.push(`invalid number field: ${field}`);
      fixes[field] = 0;
    }
  }

  const normalizedTechStack = normalizeTechStack(data.techStack);
  if (data.techStack !== normalizedTechStack) {
    issues.push("techStack should be normalized JSON string");
    fixes.techStack = normalizedTechStack;
  }

  if (!data.createdAt) fixes.createdAt = new Date().toISOString();
  if (!data.updatedAt) fixes.updatedAt = new Date().toISOString();

  return { id, issues, fixes };
}

function inspectTask(id, data) {
  const issues = [];
  const fixes = {};

  if (!data.projectId) issues.push("missing projectId");
  if (!data.title) issues.push("missing title");
  if (!isNumber(data.order)) {
    issues.push("invalid order");
    fixes.order = 0;
  }
  if (typeof data.isCompleted !== "boolean") {
    issues.push("invalid isCompleted");
    fixes.isCompleted = false;
  }
  if (data.assignedTo === undefined) fixes.assignedTo = "";
  if (data.dueDate === undefined) fixes.dueDate = "";

  return { id, issues, fixes };
}

async function commitFixes(db, collectionName, findings) {
  const fixes = findings.filter((finding) => Object.keys(finding.fixes).length > 0);
  for (let i = 0; i < fixes.length; i += 450) {
    const batch = db.batch();
    for (const finding of fixes.slice(i, i + 450)) {
      batch.update(db.collection(collectionName).doc(finding.id), finding.fixes);
    }
    await batch.commit();
  }
}

async function auditCollection(db, collectionName, inspect) {
  const snapshot = await db.collection(collectionName).get();
  const findings = snapshot.docs
    .map((doc) => inspect(doc.id, doc.data()))
    .filter(
      (finding) =>
        finding.issues.length > 0 || Object.keys(finding.fixes).length > 0,
    );

  console.log(`${collectionName}: ${snapshot.size} docs, ${findings.length} perlu perhatian`);
  for (const finding of findings.slice(0, 20)) {
    console.log(`- ${collectionName}/${finding.id}: ${finding.issues.join(", ") || "missing default fields"}`);
  }
  if (findings.length > 20) console.log(`- ... ${findings.length - 20} temuan lain`);

  if (fixMode) {
    await commitFixes(db, collectionName, findings);
    console.log(`${collectionName}: fixes applied`);
  }
}

async function main() {
  const app = initAdmin();
  const db = getFirestore(app);
  db.settings({ ignoreUndefinedProperties: true });

  console.log(`Firestore audit running in ${fixMode ? "FIX" : "READ-ONLY"} mode`);
  await auditCollection(db, "projects", inspectProject);
  await auditCollection(db, "tasks", inspectTask);
  console.log("Audit selesai");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
