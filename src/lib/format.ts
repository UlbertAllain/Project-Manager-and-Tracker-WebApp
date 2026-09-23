type FirestoreTimestampLike = {
  seconds?: number;
  _seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
};

export type DateValue = string | number | Date | FirestoreTimestampLike | null | undefined;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function parseDateValue(value: DateValue): Date | null {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const parsed = value.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const seconds = value.seconds ?? value._seconds;
    if (typeof seconds === "number") {
      const parsed = new Date(seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const firestoreString = raw.match(/(?:Timestamp\()?seconds[=:]\s*(\d+)/i);
  if (firestoreString) {
    const parsed = new Date(Number(firestoreString[1]) * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: DateValue) {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(parsed);
}

export function formatDateTime(value: DateValue) {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function toDateInputValue(value: DateValue) {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toIsoDateTime(value: DateValue) {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toISOString() : "";
}

export function isOverdue(deadline: DateValue, status: string) {
  if (["COMPLETED", "CANCELLED"].includes(status)) return false;
  const parsed = parseDateValue(deadline);
  if (!parsed) return false;
  parsed.setHours(23, 59, 59, 999);
  return parsed.getTime() < Date.now();
}
