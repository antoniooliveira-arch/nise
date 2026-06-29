import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedbacks, feedbackLinks, schools, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: any[] = [];

  if (schoolId) {
    conditions.push(eq(feedbacks.schoolId, parseInt(schoolId)));
  }

  if (user.role === "gestor" && user.schoolId) {
    conditions.push(eq(feedbacks.schoolId, user.schoolId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: feedbacks.id,
      schoolId: feedbacks.schoolId,
      evaluatorName: feedbacks.evaluatorName,
      evaluatorRole: feedbacks.evaluatorRole,
      rating: feedbacks.rating,
      comment: feedbacks.comment,
      category: feedbacks.category,
      targetUserId: feedbacks.targetUserId,
      createdAt: feedbacks.createdAt,
      schoolName: schools.name,
      targetUserName: users.name,
    })
    .from(feedbacks)
    .leftJoin(schools, eq(feedbacks.schoolId, schools.id))
    .leftJoin(users, eq(feedbacks.targetUserId, users.id))
    .where(where)
    .orderBy(desc(feedbacks.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  const body = await request.json();
  const { action } = body;

  // Create feedback link (admin only)
  if (action === "create_link") {
    if (!user || user.role !== "administrador") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { schoolId } = body;
    const token = uuidv4();

    const [link] = await db
      .insert(feedbackLinks)
      .values({
        token,
        schoolId: parseInt(schoolId),
        createdBy: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();

    return NextResponse.json(link, { status: 201 });
  }

  // Submit feedback (public via token)
  if (action === "submit") {
    const {
      token,
      evaluatorName,
      evaluatorRole,
      rating,
      comment,
      category,
      targetUserId,
    } = body;

    if (!token || !evaluatorName || !rating) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    // Verify token
    const [link] = await db
      .select()
      .from(feedbackLinks)
      .where(eq(feedbackLinks.token, token))
      .limit(1);

    if (!link) {
      return NextResponse.json(
        { error: "Link inválido" },
        { status: 400 }
      );
    }

    if (link.used) {
      return NextResponse.json(
        { error: "Este link já foi utilizado" },
        { status: 400 }
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este link expirou" },
        { status: 400 }
      );
    }

    const [feedback] = await db
      .insert(feedbacks)
      .values({
        schoolId: link.schoolId,
        evaluatorName,
        evaluatorRole: evaluatorRole || null,
        rating: parseInt(rating),
        comment: comment || null,
        category: category || null,
        targetUserId: targetUserId ? parseInt(targetUserId) : null,
        token,
      })
      .returning();

    // Mark link as used
    await db
      .update(feedbackLinks)
      .set({ used: true })
      .where(eq(feedbackLinks.id, link.id));

    return NextResponse.json(feedback, { status: 201 });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
