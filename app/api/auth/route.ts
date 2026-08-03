import { db } from "@/lib/db";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/login — authenticate user against Firestore
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (!isHashedPassword(user.password)) {
      await db.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    return NextResponse.json({
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Server error. Pastikan Firebase sudah dikonfigurasi di .env" },
      { status: 500 }
    );
  }
}
