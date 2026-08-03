import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { createUserSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const users = await db.user.findMany();
    return Response.json({ data: users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return Response.json({ error: "Gagal mengambil data user" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const validated = createUserSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return Response.json({ error: "Email sudah digunakan" }, { status: 409 });
    }

    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashPassword(validated.password),
        role: validated.role,
      },
    });

    return Response.json(
      {
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST /api/users error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return Response.json(
        { error: "Validasi gagal", issues: (error as { issues: unknown }).issues },
        { status: 400 },
      );
    }

    return Response.json({ error: "Gagal membuat user" }, { status: 500 });
  }
}
