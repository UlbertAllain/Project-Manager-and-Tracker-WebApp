import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT belum diisi di .env.local");

const serviceAccount = JSON.parse(raw);
const app = getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);
const now = new Date().toISOString();

function normalizeRole(value) {
  if (value === "ADMIN") return "ADMIN";
  if (value === "PROJECT_MANAGER" || value === "PROJECT_LEAD") return "PROJECT_MANAGER";
  return "MEMBER";
}

function values(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (!value || typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Bukan JSON; lanjutkan sebagai daftar dipisahkan koma.
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function isUserNotFound(error) {
  return error && typeof error === "object" && error.code === "auth/user-not-found";
}

async function resolveAuthAccount(uid, email) {
  try {
    return { account: await auth.getUser(uid), matchedBy: "uid" };
  } catch (error) {
    if (!isUserNotFound(error)) throw error;
  }

  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (!normalizedEmail) return { account: null, matchedBy: "none" };

  try {
    return { account: await auth.getUserByEmail(normalizedEmail), matchedBy: "email" };
  } catch (error) {
    if (isUserNotFound(error)) return { account: null, matchedBy: "none" };
    throw error;
  }
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

const usersSnapshot = await db.collection("users").get();
const usersByUid = new Map();
const uidAliases = new Map();
const missingAuthUsers = [];
const relinkedUsers = [];
const resolvedUserDocs = [];

// Tahap pertama hanya mencocokkan dokumen Firestore dengan Firebase Auth.
// Penulisan dilakukan setelah seluruh dokumen diketahui agar dokumen alias
// tidak menimpa data dari dokumen UID canonical.
for (const userDoc of usersSnapshot.docs) {
  const data = userDoc.data();
  const sourceUid = userDoc.id;
  const sourceEmail = String(data.email ?? "").trim().toLowerCase();
  const resolved = await resolveAuthAccount(sourceUid, sourceEmail);

  if (!resolved.account) {
    missingAuthUsers.push({
      uid: sourceUid,
      email: sourceEmail || "(tanpa email)",
      name: String(data.name ?? data.displayName ?? "Anggota tim"),
    });

    await userDoc.ref.set({
      role: normalizeRole(data.role),
      isActive: false,
      authStatus: "MISSING",
      migrationError: "Firebase Authentication account not found",
      updatedAt: now,
    }, { merge: true });

    continue;
  }

  const canonicalUid = resolved.account.uid;
  uidAliases.set(sourceUid, canonicalUid);
  uidAliases.set(canonicalUid, canonicalUid);
  resolvedUserDocs.push({
    userDoc,
    data,
    sourceUid,
    account: resolved.account,
    matchedBy: resolved.matchedBy,
    canonicalUid,
  });
}

const groupedUserDocs = new Map();
for (const item of resolvedUserDocs) {
  const group = groupedUserDocs.get(item.canonicalUid) ?? [];
  group.push(item);
  groupedUserDocs.set(item.canonicalUid, group);
}

for (const [canonicalUid, group] of groupedUserDocs) {
  const canonicalSource = group.find((item) => item.sourceUid === canonicalUid) ?? group[0];
  const { data, account } = canonicalSource;
  const normalizedRole = normalizeRole(data.role);
  const canonicalEmail = String(data.email ?? account.email ?? "").trim().toLowerCase();
  const canonicalName = String(data.name ?? data.displayName ?? account.displayName ?? account.email ?? "Anggota tim");

  await auth.setCustomUserClaims(canonicalUid, {
    ...(account.customClaims ?? {}),
    role: normalizedRole,
  });

  await db.collection("users").doc(canonicalUid).set({
    email: canonicalEmail,
    name: canonicalName,
    role: normalizedRole,
    jobTitle: data.jobTitle ?? "",
    department: data.department ?? "",
    isActive: data.isActive !== false && !account.disabled,
    authStatus: "LINKED",
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  }, { merge: true });

  for (const item of group) {
    if (item.sourceUid === canonicalUid) continue;

    relinkedUsers.push({
      oldUid: item.sourceUid,
      newUid: canonicalUid,
      email: canonicalEmail,
    });

    // Dokumen lama dipertahankan sebagai penanda migrasi, tetapi tidak lagi
    // dianggap sebagai user aktif oleh repository aplikasi.
    await item.userDoc.ref.set({
      migratedToUid: canonicalUid,
      authStatus: "ALIAS",
      isActive: false,
      updatedAt: now,
    }, { merge: true });
  }

  usersByUid.set(canonicalUid, {
    uid: canonicalUid,
    name: canonicalName,
    nameKey: canonicalName.trim().toLowerCase(),
    email: canonicalEmail,
  });
}

const users = [...usersByUid.values()];

function findUser(value) {
  const needle = String(value ?? "").trim().toLowerCase();
  if (!needle) return undefined;
  return users.find((user) => user.nameKey === needle || user.email === needle);
}

function canonicalUserId(value) {
  const uid = String(value ?? "").trim();
  if (!uid) return "";

  const canonicalUid = uidAliases.get(uid) ?? uid;
  return usersByUid.has(canonicalUid) ? canonicalUid : "";
}

const projectsSnapshot = await db.collection("projects").get();
let nestedTaskCount = 0;

for (const projectDoc of projectsSnapshot.docs) {
  const data = projectDoc.data();
  const leadName = String(data.lead ?? data.leadName ?? data.projectLead ?? "Belum ditentukan");
  const existingLeadId = canonicalUserId(data.leadId ?? data.projectLeadId);
  const leadUser = (existingLeadId && usersByUid.get(existingLeadId)) || findUser(leadName);

  const teamNames = values(data.teamMemberNames ?? data.teamMembers);
  const existingTeamIds = values(data.teamMemberIds ?? data.memberIds)
    .map(canonicalUserId)
    .filter(Boolean);
  const matchedTeamIds = teamNames.map((name) => findUser(name)?.uid).filter(Boolean);
  const teamMemberIds = unique([...existingTeamIds, ...matchedTeamIds]);
  const teamMemberNames = teamNames.length
    ? teamNames
    : teamMemberIds.map((uid) => usersByUid.get(uid)?.name).filter(Boolean);

  await projectDoc.ref.set({
    name: data.name ?? data.projectName ?? "Project tanpa nama",
    objective: data.objective ?? data.goal ?? "",
    lead: leadUser?.name ?? leadName,
    leadId: leadUser?.uid ?? "",
    teamMemberIds,
    teamMemberNames,
    updatedAt: now,
  }, { merge: true });

  const taskSnapshot = await projectDoc.ref.collection("tasks").get();
  nestedTaskCount += taskSnapshot.size;

  for (const taskDoc of taskSnapshot.docs) {
    const task = taskDoc.data();
    const assigneeName = String(task.assignee ?? task.assigneeName ?? task.assignedTo ?? "Belum ditugaskan");
    const existingAssigneeId = canonicalUserId(task.assigneeId ?? task.assignedToId);
    const assigneeUser = (existingAssigneeId && usersByUid.get(existingAssigneeId)) || findUser(assigneeName);

    await taskDoc.ref.set({
      assignee: assigneeUser?.name ?? assigneeName,
      assigneeId: assigneeUser?.uid ?? "",
      description: task.description ?? "",
      priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(task.priority) ? task.priority : "MEDIUM",
      status: task.status ?? ((task.completed === true || task.isCompleted === true) ? "DONE" : "TODO"),
      updatedAt: now,
    }, { merge: true });
  }
}

const legacyTasks = await db.collection("tasks").get();
for (const taskDoc of legacyTasks.docs) {
  const task = taskDoc.data();
  const assigneeName = String(task.assignee ?? task.assigneeName ?? task.assignedTo ?? "Belum ditugaskan");
  const existingAssigneeId = canonicalUserId(task.assigneeId ?? task.assignedToId);
  const assigneeUser = (existingAssigneeId && usersByUid.get(existingAssigneeId)) || findUser(assigneeName);

  await taskDoc.ref.set({
    assignee: assigneeUser?.name ?? assigneeName,
    assigneeId: assigneeUser?.uid ?? "",
    description: task.description ?? "",
    priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(task.priority) ? task.priority : "MEDIUM",
    status: task.status ?? ((task.completed === true || task.isCompleted === true) ? "DONE" : "TODO"),
    updatedAt: now,
  }, { merge: true });
}

console.log("\nMigrasi v3 selesai.");
console.log(`- User Auth terhubung : ${users.length}`);
console.log(`- User direlink email : ${relinkedUsers.length}`);
console.log(`- User tanpa Auth     : ${missingAuthUsers.length}`);
console.log(`- Project diproses    : ${projectsSnapshot.size}`);
console.log(`- Task dalam project  : ${nestedTaskCount}`);
console.log(`- Legacy task         : ${legacyTasks.size}`);

if (relinkedUsers.length) {
  console.log("\nUser yang UID Firestore-nya dipetakan ulang berdasarkan email:");
  for (const user of relinkedUsers) {
    console.log(`- ${user.email}: ${user.oldUid} -> ${user.newUid}`);
  }
}

if (missingAuthUsers.length) {
  console.warn("\nPERINGATAN: dokumen user berikut tidak mempunyai akun Firebase Authentication:");
  for (const user of missingAuthUsers) {
    console.warn(`- ${user.name} | ${user.email} | Firestore UID: ${user.uid}`);
  }
  console.warn("Dokumen tersebut ditandai authStatus=MISSING dan dinonaktifkan agar tidak merusak assignment.");
  console.warn("Buat ulang akunnya dari menu Team, lalu jalankan npm run migrate:v3 sekali lagi bila diperlukan.");
}

console.log("\nSemua pengguna aktif harus logout lalu login kembali agar role terbaru masuk ke session cookie.");
