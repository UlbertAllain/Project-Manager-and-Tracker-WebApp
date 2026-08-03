// ==================== SHARED HELPERS ====================
// Centralized — no more duplication across components

// ---------- Deadline Status ----------
export type DeadlineStatus = "SAFE" | "WARNING" | "OVERDUE";
export type DeadlineSeverity = "SAFE" | "DUE_SOON" | "DUE_TODAY" | "OVERDUE";

export interface DeadlineInfo {
  severity: DeadlineSeverity;
  daysRemaining: number | null;
  label: string;
  needsAttention: boolean;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
}

const CLOSED_PROJECT_STATUSES = ["COMPLETED", "CANCELLED"];

function toLocalDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;

  const dateOnly = value.split("T")[0];
  const parts = dateOnly.split("-").map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isDeadlineClosedStatus(status: string): boolean {
  return CLOSED_PROJECT_STATUSES.includes(status);
}

export function getDeadlineStatus(
  status: string,
  deadline: string | null
): DeadlineStatus {
  if (isDeadlineClosedStatus(status) || !deadline) return "SAFE";
  if (status === "OVERDUE") return "OVERDUE";

  const daysRemaining = getDaysRemaining(deadline);
  if (daysRemaining < 0) return "OVERDUE";
  if (daysRemaining <= 3) return "WARNING";
  return "SAFE";
}

export function getDeadlineInfo(
  status: string,
  deadline: string | null | undefined
): DeadlineInfo {
  if (isDeadlineClosedStatus(status) || !deadline) {
    return {
      severity: "SAFE",
      daysRemaining: null,
      label: "Tidak ada deadline aktif",
      needsAttention: false,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      borderClass: "border-l-emerald-500",
      textClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
    };
  }

  const daysRemaining = getDaysRemaining(deadline);

  if (status === "OVERDUE" || daysRemaining < 0) {
    return {
      severity: "OVERDUE",
      daysRemaining,
      label: `${Math.abs(daysRemaining)} hari terlambat`,
      needsAttention: true,
      badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
      borderClass: "border-l-red-500",
      textClass: "text-red-400",
      bgClass: "bg-red-500/10",
    };
  }

  if (daysRemaining === 0) {
    return {
      severity: "DUE_TODAY",
      daysRemaining,
      label: "Deadline hari ini",
      needsAttention: true,
      badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      borderClass: "border-l-orange-500",
      textClass: "text-orange-400",
      bgClass: "bg-orange-500/10",
    };
  }

  if (daysRemaining <= 3) {
    return {
      severity: "DUE_SOON",
      daysRemaining,
      label: `${daysRemaining} hari lagi`,
      needsAttention: true,
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      borderClass: "border-l-amber-500",
      textClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
    };
  }

  return {
    severity: "SAFE",
    daysRemaining,
    label: `${daysRemaining} hari lagi`,
    needsAttention: false,
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderClass: "border-l-emerald-500",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
  };
}

export function getTaskDueInfo(
  dueDate: string | null | undefined,
  isCompleted: boolean
): DeadlineInfo {
  if (isCompleted || !dueDate) {
    return {
      severity: "SAFE",
      daysRemaining: null,
      label: isCompleted ? "Task selesai" : "Tidak ada due date",
      needsAttention: false,
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      borderClass: "border-l-emerald-500",
      textClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
    };
  }

  const daysRemaining = getDaysRemaining(dueDate);

  if (daysRemaining < 0) {
    return {
      severity: "OVERDUE",
      daysRemaining,
      label: `${Math.abs(daysRemaining)} hari terlambat`,
      needsAttention: true,
      badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
      borderClass: "border-l-red-500",
      textClass: "text-red-400",
      bgClass: "bg-red-500/10",
    };
  }

  if (daysRemaining === 0) {
    return {
      severity: "DUE_TODAY",
      daysRemaining,
      label: "Due hari ini",
      needsAttention: true,
      badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      borderClass: "border-l-orange-500",
      textClass: "text-orange-400",
      bgClass: "bg-orange-500/10",
    };
  }

  if (daysRemaining <= 3) {
    return {
      severity: "DUE_SOON",
      daysRemaining,
      label: `${daysRemaining} hari lagi`,
      needsAttention: true,
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      borderClass: "border-l-amber-500",
      textClass: "text-amber-400",
      bgClass: "bg-amber-500/10",
    };
  }

  return {
    severity: "SAFE",
    daysRemaining,
    label: `${daysRemaining} hari lagi`,
    needsAttention: false,
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderClass: "border-l-emerald-500",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
  };
}

// ---------- Auto Status from Progress ----------
export function getAutoStatus(progress: number): string {
  if (progress === 0) return "NEW";
  if (progress > 0 && progress < 75) return "IN_PROGRESS";
  if (progress >= 75 && progress < 100) return "FINISHING";
  if (progress === 100) return "COMPLETED";
  return "NEW";
}

// ---------- Recalculate Progress from Tasks ----------
export function recalculateProgress(tasks: { isCompleted: boolean }[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.isCompleted).length;
  return Math.round((completed / tasks.length) * 100);
}

// ---------- Format Currency ----------
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// ---------- Format Number Input (thousand separator) ----------
export function formatNumberInput(value: string): string {
  return value
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ---------- Parse Formatted Number ----------
export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/\./g, "").replace(/\D/g, "")) || 0;
}

// ---------- Format Date ----------
export function formatDate(
  isoString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString(
    "id-ID",
    options ?? { day: "numeric", month: "long", year: "numeric" }
  );
}

// ---------- Format Date Short ----------
export function formatDateShort(
  isoString: string | null | undefined
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// ---------- Format DateTime ----------
export function formatDateTime(
  isoString: string | null | undefined
): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- Platform Icon ----------
export function getPlatformIcon(platform: string): string {
  switch (platform) {
    case "Google Drive":
      return "📁";
    case "Figma":
      return "🎨";
    case "GitHub":
      return "💻";
    case "Dropbox":
      return "📦";
    default:
      return "🔗";
  }
}

// ---------- Log Icon ----------
export function getLogIcon(action: string): string {
  switch (action) {
    case "CREATED":
      return "🟢";
    case "STATUS_CHANGED":
      return "🔄";
    case "PAYMENT_CHANGED":
      return "💰";
    case "DELETED":
      return "🔴";
    default:
      return "🔵";
  }
}

// ---------- Budget Display Short ----------
export function formatBudgetShort(budget: number): string {
  if (budget <= 0) return "-";
  if (budget >= 1_000_000) return `${(budget / 1_000_000).toFixed(0)}jt`;
  return formatRupiah(budget);
}

// ---------- Relative Time (Indonesian) ----------
export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return formatDate(dateString, { day: "numeric", month: "short" });
}

// ---------- Days Remaining Until Deadline ----------
export function getDaysRemaining(deadline: string): number {
  const deadlineDate = toLocalDateOnly(deadline);
  if (!deadlineDate) return 0;

  const diff =
    (deadlineDate.getTime() - todayDateOnly().getTime()) /
    (1000 * 60 * 60 * 24);
  return Math.round(diff);
}
