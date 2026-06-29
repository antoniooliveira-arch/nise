import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, schools } from "@/db/schema";
import { getSession, hashPassword } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "administrador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      schoolId: users.schoolId,
      active: users.active,
      createdAt: users.createdAt,
      schoolName: schools.name,
    })
    .from(users)
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .orderBy(asc(users.name));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "administrador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role, schoolId } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Campos obrigatórios não preenchidos" },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(password);

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        schoolId: schoolId ? parseInt(schoolId) : null,
      })
      .returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("unique")
    ) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== "administrador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, email, role, schoolId, active, password } = body;

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (schoolId !== undefined) updateData.schoolId = schoolId ? parseInt(schoolId) : null;
  if (active !== undefined) updateData.active = active;
  if (password) updateData.password = await hashPassword(password);

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}
