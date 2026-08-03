// Firestore utility functions that mirror Prisma operations
// This replaces the old Prisma db client with Firebase Firestore equivalents

import { collections, adminDb } from '@/lib/firebase-admin';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Query,
  WriteBatch,
} from 'firebase-admin/firestore';
import type { Project, Task, LinkAttachment, Transaction, Comment, ActivityLog, AuthUser } from '@/lib/types';

// ==================== SHARED TYPES ====================

type ProjectWithRelations = Project & {
  tasks: Task[];
  attachments: LinkAttachment[];
  transactions: Transaction[];
  comments: Comment[];
  logs: ActivityLog[];
};

type ProjectCreateResult = {
  id: string;
  projectName: string;
  clientName: string;
  projectLead: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  techStack: string | string[];
  startDate: string;
  deadline: string;
  completedDate: string | null;
  budget: number;
  paidAmount: number;
  totalExpense: number;
  paymentStatus: string;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type TransactionWithProject = Omit<Transaction, 'project'> & {
  project?: { projectName: string } | null;
};

// ==================== HELPERS ====================

function docToObj<T>(doc: DocumentSnapshot | QueryDocumentSnapshot): T {
  const data = doc.data();
  if (!data) return null as T;
  return {
    id: doc.id,
    ...data,
  } as T;
}

function generateId(): string {
  return adminDb.collection('_tmp').doc().id;
}

function parseTechStack(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string' || !value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

async function commitBatchOperations(
  operations: Array<(batch: WriteBatch) => void>,
) {
  const chunkSize = 450;

  for (let i = 0; i < operations.length; i += chunkSize) {
    const batch = adminDb.batch();
    operations.slice(i, i + chunkSize).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

function toDateOnlyMs(value: unknown): number | null {
  if (typeof value !== 'string' || !value) return null;

  const dateOnly = value.split('T')[0];
  const parts = dateOnly.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
}

function todayDateOnlyMs(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function shouldMarkOverdue(project: Record<string, unknown>): boolean {
  if (
    project.status === 'COMPLETED' ||
    project.status === 'CANCELLED' ||
    project.status === 'OVERDUE'
  ) {
    return false;
  }

  const deadlineMs = toDateOnlyMs(project.deadline);
  return deadlineMs !== null && deadlineMs < todayDateOnlyMs();
}

async function applyAutomaticOverdueStatus(
  projectId: string,
  projectData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!shouldMarkOverdue(projectData)) return projectData;

  const updatedAt = new Date().toISOString();
  await collections.projects.doc(projectId).update({
    status: 'OVERDUE',
    updatedAt,
  });

  return {
    ...projectData,
    status: 'OVERDUE',
    updatedAt,
  };
}

async function replaceProjectTasks(
  projectId: string,
  tasks: Array<Pick<Task, 'title' | 'isCompleted' | 'order'> & { id?: string; assignedTo?: string; dueDate?: string }>,
) {
  const existing = await collections.tasks.where('projectId', '==', projectId).get();
  const operations: Array<(batch: WriteBatch) => void> = [];

  existing.docs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  tasks.forEach((task, index) => {
    const ref = collections.tasks.doc(task.id || generateId());
    operations.push((batch) =>
      batch.set(ref, {
        title: task.title,
        assignedTo: task.assignedTo || '',
        dueDate: task.dueDate || '',
        isCompleted: task.isCompleted,
        order: task.order ?? index,
        projectId,
      }),
    );
  });

  await commitBatchOperations(operations);
}

async function replaceProjectAttachments(
  projectId: string,
  attachments: Array<Pick<LinkAttachment, 'title' | 'url' | 'platform'> & { id?: string }>,
) {
  const existing = await collections.attachments.where('projectId', '==', projectId).get();
  const operations: Array<(batch: WriteBatch) => void> = [];

  existing.docs.forEach((doc) => operations.push((batch) => batch.delete(doc.ref)));
  attachments.forEach((attachment) => {
    const ref = collections.attachments.doc(attachment.id || generateId());
    operations.push((batch) =>
      batch.set(ref, {
        title: attachment.title,
        url: attachment.url,
        platform: attachment.platform,
        projectId,
      }),
    );
  });

  await commitBatchOperations(operations);
}

// ==================== PROJECT OPERATIONS ====================

async function getProjectWithRelations(projectId: string): Promise<ProjectWithRelations | null> {
  const projectDoc = await collections.projects.doc(projectId).get();
  if (!projectDoc.exists) return null;

  const projectData = await applyAutomaticOverdueStatus(projectDoc.id, projectDoc.data()!);

  // Fetch related collections in parallel — use get() without orderBy to avoid index issues
  const [tasksSnap, attachmentsSnap, transactionsSnap, commentsSnap, logsSnap] = await Promise.all([
    collections.tasks.where('projectId', '==', projectId).get(),
    collections.attachments.where('projectId', '==', projectId).get(),
    collections.transactions.where('projectId', '==', projectId).get(),
    collections.comments.where('projectId', '==', projectId).get(),
    collections.activityLogs.where('projectId', '==', projectId).get(),
  ]);

  // Sort in memory instead of Firestore to avoid composite index requirements
  const tasks = tasksSnap.docs.map((d) => docToObj<Task>(d)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const transactions = transactionsSnap.docs.map((d) => docToObj<Transaction>(d)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const comments = commentsSnap.docs.map((d) => docToObj<Comment>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const logs = logsSnap.docs.map((d) => docToObj<ActivityLog>(d)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    id: projectDoc.id,
    ...projectData,
    techStack: parseTechStack(projectData.techStack),
    tasks,
    attachments: attachmentsSnap.docs.map((d) => docToObj<LinkAttachment>(d)),
    transactions,
    comments,
    logs,
  } as ProjectWithRelations;
}

// ==================== DB OBJECT (mirrors Prisma API) ====================

export const db = {
  // ===== USER =====
  user: {
    findMany: async (): Promise<AuthUser[]> => {
      const snap = await collections.users.get();
      return snap.docs
        .map((doc) => {
          const user = docToObj<AuthUser & { password?: string }>(doc);
          const { password: _password, ...safeUser } = user;
          return safeUser;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string } }): Promise<(AuthUser & { password?: string }) | null> => {
      if (where.email) {
        const snap = await collections.users.where('email', '==', where.email).limit(1).get();
        if (snap.empty) return null;
        return docToObj<AuthUser & { password?: string }>(snap.docs[0]);
      }
      if (where.id) {
        const doc = await collections.users.doc(where.id).get();
        if (!doc.exists) return null;
        return docToObj<AuthUser & { password?: string }>(doc);
      }
      return null;
    },

    upsert: async ({ where, update, create }: { where: { email: string }; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<AuthUser & { password?: string }> => {
      const snap = await collections.users.where('email', '==', where.email).limit(1).get();
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        await collections.users.doc(existingDoc.id).update(update);
        const updatedDoc = await collections.users.doc(existingDoc.id).get();
        return docToObj<AuthUser & { password?: string }>(updatedDoc);
      }
      const id = generateId();
      const now = new Date().toISOString();
      const data = { ...create, createdAt: now, updatedAt: now };
      await collections.users.doc(id).set(data);
        return { id, ...data } as unknown as AuthUser & { password?: string };
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<AuthUser> => {
      await collections.users.doc(where.id).update({ ...data, updatedAt: new Date().toISOString() });
      const doc = await collections.users.doc(where.id).get();
      return docToObj<AuthUser>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<AuthUser & { password?: string }> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now, updatedAt: now };
      await collections.users.doc(id).set(docData);
      return { id, ...docData } as unknown as AuthUser & { password?: string };
    },
  },

  // ===== PROJECT =====
  project: {
    findMany: async (opts?: {
      orderBy?: Record<string, string>;
      include?: Record<string, unknown>;
      where?: Record<string, unknown>;
    }): Promise<ProjectWithRelations[]> => {
      // Use simple get() without orderBy to avoid index issues
      // Sort in memory instead
      let query: Query = collections.projects;

      if (opts?.where) {
        let q: Query = collections.projects;
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'id' && typeof value === 'object' && value !== null && 'in' in (value as object)) {
            q = q.where(key, 'in', (value as { in: string[] }).in);
          } else {
            q = q.where(key, '==', value);
          }
        }
        query = q;
      }

      const snap = await query.get();
      const projects: ProjectWithRelations[] = [];

      for (const doc of snap.docs) {
        const projectData = await applyAutomaticOverdueStatus(doc.id, doc.data());
        const project = {
          id: doc.id,
          ...projectData,
          techStack: parseTechStack(projectData.techStack),
          tasks: [],
          attachments: [],
          transactions: [],
          comments: [],
          logs: [],
        } as unknown as ProjectWithRelations;

        if (opts?.include) {
          // Use simple where queries without orderBy to avoid composite index requirements
          if ('tasks' in opts.include) {
            const tasksSnap = await collections.tasks.where('projectId', '==', doc.id).get();
            project.tasks = tasksSnap.docs.map((d) => docToObj<Task>(d)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
          if ('attachments' in opts.include) {
            const attSnap = await collections.attachments.where('projectId', '==', doc.id).get();
            project.attachments = attSnap.docs.map((d) => docToObj<LinkAttachment>(d));
          }
          if ('transactions' in opts.include) {
            const txSnap = await collections.transactions.where('projectId', '==', doc.id).get();
            project.transactions = txSnap.docs.map((d) => docToObj<Transaction>(d)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
          if ('comments' in opts.include) {
            const cmSnap = await collections.comments.where('projectId', '==', doc.id).get();
            project.comments = cmSnap.docs.map((d) => docToObj<Comment>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          if ('logs' in opts.include) {
            const logSnap = await collections.activityLogs.where('projectId', '==', doc.id).get();
            project.logs = logSnap.docs.map((d) => docToObj<ActivityLog>(d)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
        }

        projects.push(project);
      }

      // Sort in memory by createdAt desc (handle missing field gracefully)
      projects.sort((a, b) => {
        const dateA = new Date((a.createdAt as string) || 0).getTime();
        const dateB = new Date((b.createdAt as string) || 0).getTime();
        return dateB - dateA;
      });

      return projects;
    },

    findUnique: async ({ where, include }: { where: { id: string }; include?: Record<string, unknown> }): Promise<ProjectWithRelations | Project | null> => {
      if (include) {
        return getProjectWithRelations(where.id);
      }
      const doc = await collections.projects.doc(where.id).get();
      if (!doc.exists) return null;
      const data = await applyAutomaticOverdueStatus(doc.id, doc.data()!);
      return {
        id: doc.id,
        ...data,
          techStack: parseTechStack(data.techStack),
      } as Project;
    },

    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }): Promise<ProjectCreateResult> => {
      const id = generateId();
      const now = new Date().toISOString();

      // Separate nested creates (tasks, attachments, transactions, comments)
      const { tasks, attachments, transactions, comments, ...projectData } = data as Record<string, unknown>;
      const docData: Record<string, unknown> = {
        ...projectData,
        createdAt: now,
        updatedAt: now,
      };
      if (shouldMarkOverdue(docData)) {
        docData.status = 'OVERDUE';
      }

      await collections.projects.doc(id).set(docData);

      // Create nested items if provided
      if (tasks && typeof tasks === 'object' && 'create' in (tasks as object)) {
        const taskItems = (tasks as { create: unknown[] }).create;
        for (const t of taskItems) {
          const taskId = generateId();
          await collections.tasks.doc(taskId).set({
            ...(t as Record<string, unknown>),
            projectId: id,
          });
        }
      }

      if (attachments && typeof attachments === 'object' && 'create' in (attachments as object)) {
        const items = (attachments as { create: unknown[] }).create;
        for (const a of items) {
          const aId = generateId();
          await collections.attachments.doc(aId).set({
            ...(a as Record<string, unknown>),
            projectId: id,
          });
        }
      }

      if (transactions && typeof transactions === 'object' && 'create' in (transactions as object)) {
        const items = (transactions as { create: unknown[] }).create;
        for (const t of items) {
          const tId = generateId();
          await collections.transactions.doc(tId).set({
            ...(t as Record<string, unknown>),
            projectId: id,
            createdAt: now,
          });
        }
      }

      if (comments && typeof comments === 'object' && 'create' in (comments as object)) {
        const items = (comments as { create: unknown[] }).create;
        for (const c of items) {
          const cId = generateId();
          await collections.comments.doc(cId).set({
            ...(c as Record<string, unknown>),
            projectId: id,
            createdAt: now,
          });
        }
      }

      if (include) {
        const result = await getProjectWithRelations(id);
        return result as unknown as ProjectCreateResult;
      }

      const doc = await collections.projects.doc(id).get();
      const docDataResult = doc.data()!;
      return {
        id: doc.id,
        ...docDataResult,
        techStack: parseTechStack(docDataResult.techStack),
      } as unknown as ProjectCreateResult;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Project> => {
      const { tasks, attachments, ...projectData } = data;

      await collections.projects.doc(where.id).update({
        ...projectData,
        updatedAt: new Date().toISOString(),
      });

      if (Array.isArray(tasks)) {
        await replaceProjectTasks(where.id, tasks as Array<Pick<Task, 'title' | 'isCompleted' | 'order'> & { id?: string; assignedTo?: string; dueDate?: string }>);
      }

      if (Array.isArray(attachments)) {
        await replaceProjectAttachments(where.id, attachments as Array<Pick<LinkAttachment, 'title' | 'url' | 'platform'> & { id?: string }>);
      }

      const doc = await collections.projects.doc(where.id).get();
      const docData = await applyAutomaticOverdueStatus(doc.id, doc.data()!);
      return {
        id: doc.id,
        ...docData,
        techStack: parseTechStack(docData.techStack),
      } as Project;
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      const projectId = where.id;

      const [tasksSnap, attachmentsSnap, transactionsSnap, commentsSnap, logsSnap] = await Promise.all([
        collections.tasks.where('projectId', '==', projectId).get(),
        collections.attachments.where('projectId', '==', projectId).get(),
        collections.transactions.where('projectId', '==', projectId).get(),
        collections.comments.where('projectId', '==', projectId).get(),
        collections.activityLogs.where('projectId', '==', projectId).get(),
      ]);

      const operations: Array<(batch: WriteBatch) => void> = [];
      tasksSnap.docs.forEach((d) => operations.push((batch) => batch.delete(d.ref)));
      attachmentsSnap.docs.forEach((d) => operations.push((batch) => batch.delete(d.ref)));
      transactionsSnap.docs.forEach((d) => operations.push((batch) => batch.delete(d.ref)));
      commentsSnap.docs.forEach((d) => operations.push((batch) => batch.delete(d.ref)));
      logsSnap.docs.forEach((d) => operations.push((batch) => batch.delete(d.ref)));
      operations.push((batch) => batch.delete(collections.projects.doc(projectId)));
      await commitBatchOperations(operations);

      return { success: true };
    },
  },

  // ===== TASK =====
  task: {
    create: async ({ data }: { data: Record<string, unknown> }): Promise<Task> => {
      const id = generateId();
      await collections.tasks.doc(id).set(data);
      return { id, ...data } as unknown as Task;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Task> => {
      await collections.tasks.doc(where.id).update(data);
      const doc = await collections.tasks.doc(where.id).get();
      return docToObj<Task>(doc);
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.tasks.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== ATTACHMENT =====
  attachment: {
    create: async ({ data }: { data: Record<string, unknown> }): Promise<LinkAttachment> => {
      const id = generateId();
      await collections.attachments.doc(id).set(data);
      return { id, ...data } as unknown as LinkAttachment;
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.attachments.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== TRANSACTION =====
  transaction: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; include?: Record<string, unknown> }): Promise<TransactionWithProject[]> => {
      // Use simple get() without orderBy to avoid composite index requirements
      let query: Query = collections.transactions;

      if (opts?.where) {
        let q: Query = collections.transactions;
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'date' && typeof value === 'object' && value !== null) {
            const dateFilter = value as Record<string, string>;
            if (dateFilter.gte) q = q.where('date', '>=', dateFilter.gte);
            if (dateFilter.lte) q = q.where('date', '<=', dateFilter.lte);
          } else if (key === 'projectId') {
            q = q.where(key, '==', value);
          }
        }
        query = q;
      }

      const snap = await query.get();
      const transactions: TransactionWithProject[] = [];

      for (const doc of snap.docs) {
        const txData = { id: doc.id, ...doc.data() } as TransactionWithProject;

        if (opts?.include?.project) {
          const projectDoc = await collections.projects.doc(doc.data().projectId).get();
          txData.project = projectDoc.exists ? { projectName: projectDoc.data()!.projectName } : null;
        }

        transactions.push(txData);
      }

      // Sort in memory by date desc
      transactions.sort((a, b) => {
        const dateA = new Date((a.date as string) || 0).getTime();
        const dateB = new Date((b.date as string) || 0).getTime();
        return dateB - dateA;
      });

      return transactions;
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<Transaction | null> => {
      const doc = await collections.transactions.doc(where.id).get();
      if (!doc.exists) return null;
      return docToObj<Transaction>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<Transaction> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.transactions.doc(id).set(docData);
      return { id, ...docData } as unknown as Transaction;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Transaction> => {
      await collections.transactions.doc(where.id).update(data);
      const doc = await collections.transactions.doc(where.id).get();
      return docToObj<Transaction>(doc);
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.transactions.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== COMMENT =====
  comment: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string> }): Promise<Comment[]> => {
      let query: Query = collections.comments;
      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId as string);
      }
      const snap = await query.get();
      const comments = snap.docs.map((d) => docToObj<Comment>(d));
      // Sort in memory by createdAt desc
      return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<Comment> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.comments.doc(id).set(docData);
      return { id, ...docData } as unknown as Comment;
    },
  },

  // ===== ACTIVITY LOG =====
  activityLog: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; include?: Record<string, unknown> }): Promise<Record<string, unknown>[]> => {
      let query: Query = collections.activityLogs;

      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId as string);
      }

      // Don't use orderBy in Firestore — sort in memory
      const snap = await (opts?.take ? query.limit(opts.take) : query).get();
      const logs: Record<string, unknown>[] = [];

      for (const doc of snap.docs) {
        const logData: Record<string, unknown> = { id: doc.id, ...doc.data() };

        if (opts?.include?.project) {
          const projectDoc = await collections.projects.doc(doc.data().projectId).get();
          logData.project = projectDoc.exists
            ? { projectName: projectDoc.data()!.projectName, id: projectDoc.id }
            : null;
        }

        logs.push(logData);
      }

      // Sort in memory by timestamp desc
      logs.sort((a, b) => {
        const dateA = new Date((a.timestamp as string) || 0).getTime();
        const dateB = new Date((b.timestamp as string) || 0).getTime();
        return dateB - dateA;
      });

      return logs;
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<ActivityLog> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, timestamp: now };
      await collections.activityLogs.doc(id).set(docData);
      return { id, ...docData } as unknown as ActivityLog;
    },
  },
};
