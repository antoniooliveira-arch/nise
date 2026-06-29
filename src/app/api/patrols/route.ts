import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patrols, schools, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (user.role === "tecnico" && user.schoolId) {
    conditions.push(eq(patrols.userId, user.id));
  }

  if (user.role === "gestor" && user.schoolId) {
    conditions.push(eq(patrols.schoolId, user.schoolId));
  }

  if (schoolId) {
    conditions.push(eq(patrols.schoolId, parseInt(schoolId)));
  }

  if (status) {
    conditions.push(eq(patrols.status, status as "em_andamento" | "concluida" | "validada" | "em_atendimento"));
  }

  if (dateFrom) {
    conditions.push(gte(patrols.date, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(patrols.date, new Date(dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: patrols.id,
      userId: patrols.userId,
      schoolId: patrols.schoolId,
      date: patrols.date,
      startTime: patrols.startTime,
      endTime: patrols.endTime,
      observations: patrols.observations,
      audioTranscription: patrols.audioTranscription,
      checklist: patrols.checklist,
      otherDescription: patrols.otherDescription,
      status: patrols.status,
      validatedBy: patrols.validatedBy,
      validatedAt: patrols.validatedAt,
      createdAt: patrols.createdAt,
      userName: users.name,
      schoolName: schools.name,
    })
    .from(patrols)
    .leftJoin(users, eq(patrols.userId, users.id))
    .leftJoin(schools, eq(patrols.schoolId, schools.id))
    .where(where)
    .orderBy(desc(patrols.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (user.role !== "tecnico" && user.role !== "administrador") {
    return NextResponse.json(
      { error: "Sem permissão para criar patrulhas" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    schoolId,
    observations,
    audioTranscription,
    checklist,
    otherDescription,
  } = body;

  if (!schoolId) {
    return NextResponse.json(
      { error: "Escola é obrigatória" },
      { status: 400 }
    );
  }

  const [patrol] = await db
    .insert(patrols)
    .values({
      userId: user.id,
      schoolId: parseInt(schoolId),
      observations: observations || null,
      audioTranscription: audioTranscription || null,
      checklist: checklist || [],
      otherDescription: otherDescription || null,
      status: "em_andamento",
    })
    .returning();

  return NextResponse.json(patrol, { status: 201 });
}
