import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import type { AuthUser } from "@/lib/types";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword?: string): boolean {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return storedPassword === password;
  }

  const [, salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;

  const passwordHash = scryptSync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(storedHash, "hex");

  return (
    passwordHash.length === storedBuffer.length &&
    timingSafeEqual(passwordHash, storedBuffer)
  );
}

export function isHashedPassword(password?: string): boolean {
  return Boolean(password?.startsWith(`${HASH_PREFIX}:`));
}

export async function getRequestUser(req: Request): Promise<AuthUser | null> {
  const userId = req.headers.get("x-user-id");
  if (!userId) return null;

  return db.user.findUnique({ where: { id: userId } });
}

export async function requireRole(
  req: Request,
  allowedRoles: string[],
): Promise<{ user: AuthUser } | { error: Response }> {
  const user = await getRequestUser(req);

  if (!user) {
    return {
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleHash = createHash("sha256").update(user.role).digest("hex");
  const allowed = allowedRoles.some((role) => {
    const allowedHash = createHash("sha256").update(role).digest("hex");
    return roleHash === allowedHash;
  });

  if (!allowed) {
    return {
      error: Response.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}
