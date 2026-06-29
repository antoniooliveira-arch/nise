import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { patrols } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, observations, checklist, otherDescription } = body;

  const patrolId = parseInt(id);

  if (action === "finish") {
    const [updated] = await db
      .update(patrols)
      .set({
        endTime: new Date(),
        status: "concluida",
        observations: observations || undefined,
        checklist: checklist || undefined,
        otherDescription: otherDescription || undefined,
      })
      .where(eq(patrols.id, patrolId))
      .returning();
    return NextResponse.json(updated);
  }

  if (action === "validate") {
    if (user.role !== "administrador") {
      return NextResponse.json(
        { error: "Apenas administradores podem validar patrulhas" },
        { status: 403 }
      );
    }
    const [updated] = await db
      .update(patrols)
      .set({
        status: "validada",
        validatedBy: user.id,
        validatedAt: new Date(),
      })
      .where(eq(patrols.id, patrolId))
      .returning();
    return NextResponse.json(updated);
  }

  if (action === "attending") {
    if (user.role !== "administrador") {
      return NextResponse.json(
        { error: "Apenas administradores podem marcar patrulhas como em atendimento" },
        { status: 403 }
      );
    }
    const [updated] = await db
      .update(patrols)
      .set({
        status: "em_atendimento",
        validatedBy: user.id,
        validatedAt: new Date(),
      })
      .where(eq(patrols.id, patrolId))
      .returning();
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
