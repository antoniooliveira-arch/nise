import { NextResponse } from "next/server";
import { db } from "@/db";
import { patrols, schools, users, presenceRecords, feedbacks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, gte, sql, count } from "drizzle-orm";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const patrolFilter = user.role === "gestor" && user.schoolId
    ? eq(patrols.schoolId, user.schoolId)
    : undefined;

  // Total patrols
  const [totalPatrolsResult] = await db
    .select({ count: count() })
    .from(patrols)
    .where(patrolFilter);

  // Active patrols
  const [activePatrolsResult] = await db
    .select({ count: count() })
    .from(patrols)
    .where(
      and(eq(patrols.status, "em_andamento"), ...(patrolFilter ? [patrolFilter] : []))
    );

  // Validated patrols
  const [validatedPatrolsResult] = await db
    .select({ count: count() })
    .from(patrols)
    .where(
      and(eq(patrols.status, "validada"), ...(patrolFilter ? [patrolFilter] : []))
    );

  // Total schools
  const [totalSchoolsResult] = await db
    .select({ count: count() })
    .from(schools);

  // Total users
  const [totalUsersResult] = await db
    .select({ count: count() })
    .from(users);

  // Patrols by school
  const patrolsBySchool = await db
    .select({
      schoolName: schools.name,
      count: count(),
    })
    .from(patrols)
    .leftJoin(schools, eq(patrols.schoolId, schools.id))
    .groupBy(schools.name)
    .orderBy(desc(count()));

  // Occurrence checklist stats
  const allPatrols = await db
    .select({
      checklist: patrols.checklist,
    })
    .from(patrols)
    .where(patrolFilter);

  const occurrenceCounts: Record<string, number> = {};
  allPatrols.forEach((p) => {
    if (p.checklist && Array.isArray(p.checklist)) {
      p.checklist.forEach((item: string) => {
        occurrenceCounts[item] = (occurrenceCounts[item] || 0) + 1;
      });
    }
  });

  const occurrenceStats = Object.entries(occurrenceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Today's presence
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayPresenceResult] = await db
    .select({ count: count() })
    .from(presenceRecords)
    .where(gte(presenceRecords.timestamp, startOfDay));

  // Average feedback rating
  const avgResult = await db
    .select({
      avg: sql<number>`avg(${feedbacks.rating})`,
    })
    .from(feedbacks);

  return NextResponse.json({
    totalPatrols: totalPatrolsResult?.count || 0,
    activePatrols: activePatrolsResult?.count || 0,
    validatedPatrols: validatedPatrolsResult?.count || 0,
    totalSchools: totalSchoolsResult?.count || 0,
    totalUsers: totalUsersResult?.count || 0,
    todayPresence: todayPresenceResult?.count || 0,
    averageRating: avgResult[0]?.avg ? Number(avgResult[0].avg).toFixed(1) : "N/A",
    patrolsBySchool,
    occurrenceStats,
  });
}
