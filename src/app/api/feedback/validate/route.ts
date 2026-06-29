import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedbackLinks, schools, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token é obrigatório" },
      { status: 400 }
    );
  }

  const [link] = await db
    .select({
      id: feedbackLinks.id,
      token: feedbackLinks.token,
      schoolId: feedbackLinks.schoolId,
      used: feedbackLinks.used,
      expiresAt: feedbackLinks.expiresAt,
      schoolName: schools.name,
    })
    .from(feedbackLinks)
    .leftJoin(schools, eq(feedbackLinks.schoolId, schools.id))
    .where(eq(feedbackLinks.token, token))
    .limit(1);

  if (!link) {
    return NextResponse.json(
      { error: "Link inválido" },
      { status: 404 }
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

  // Get technicians from the school for targeting
  const technicians = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(eq(users.schoolId, link.schoolId));

  return NextResponse.json({
    valid: true,
    schoolName: link.schoolName,
    schoolId: link.schoolId,
    technicians,
  });
}
