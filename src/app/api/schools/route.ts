import { NextResponse } from "next/server";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { asc } from "drizzle-orm";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await db
    .select()
    .from(schools)
    .orderBy(asc(schools.name));

  return NextResponse.json(data);
}
