import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { presenceRecords, schools, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const today = searchParams.get("today");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (user.role === "tecnico") {
    conditions.push(eq(presenceRecords.userId, user.id));
  }

  if (user.role === "gestor" && user.schoolId) {
    conditions.push(eq(presenceRecords.schoolId, user.schoolId));
  }

  if (schoolId) {
    conditions.push(eq(presenceRecords.schoolId, parseInt(schoolId)));
  }

  if (today === "true") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    conditions.push(gte(presenceRecords.timestamp, startOfDay));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: presenceRecords.id,
      userId: presenceRecords.userId,
      schoolId: presenceRecords.schoolId,
      type: presenceRecords.type,
      timestamp: presenceRecords.timestamp,
      notes: presenceRecords.notes,
      userName: users.name,
      schoolName: schools.name,
    })
    .from(presenceRecords)
    .leftJoin(users, eq(presenceRecords.userId, users.id))
    .leftJoin(schools, eq(presenceRecords.schoolId, schools.id))
    .where(where)
    .orderBy(desc(presenceRecords.timestamp));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "tecnico" && user.role !== "administrador") {
    return NextResponse.json(
      { error: "Sem permissão" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { schoolId, type, notes } = body;

  if (!schoolId || !type) {
    return NextResponse.json(
      { error: "Escola e tipo são obrigatórios" },
      { status: 400 }
    );
  }

  const [record] = await db
    .insert(presenceRecords)
    .values({
      userId: user.id,
      schoolId: parseInt(schoolId),
      type,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}
