import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedbackLinks, schools } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "administrador") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const data = await db
    .select({
      id: feedbackLinks.id,
      token: feedbackLinks.token,
      schoolId: feedbackLinks.schoolId,
      used: feedbackLinks.used,
      expiresAt: feedbackLinks.expiresAt,
      createdAt: feedbackLinks.createdAt,
      schoolName: schools.name,
    })
    .from(feedbackLinks)
    .leftJoin(schools, eq(feedbackLinks.schoolId, schools.id))
    .orderBy(desc(feedbackLinks.createdAt));

  return NextResponse.json(data);
}
