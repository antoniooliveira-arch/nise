import { NextResponse } from "next/server";
import { db } from "@/db";
import { schools, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const SCHOOLS = [
  { name: "CEI Luiz Felipe", type: "CEI" },
  { name: "CEI São Cristóvão", type: "CEI" },
  { name: "CEI Arco Íris", type: "CEI" },
  { name: "CEI Bruno Leonardo", type: "CEI" },
  { name: "CEI Dom Franco", type: "CEI" },
  { name: "CEI Menino Jesus", type: "CEI" },
  { name: "CEI Nosso Lar", type: "CEI" },
  { name: "CEI Vasco Papa", type: "CEI" },
  { name: "CEI Criança Feliz", type: "CEI" },
  { name: "CEM Guilherme", type: "CEM" },
  { name: "CEM Orlando Pereira", type: "CEM" },
  { name: "EM Maria Hilda", type: "EM" },
  { name: "EM Paulo Freire", type: "EM" },
  { name: "EM José Anchieta", type: "EM" },
  { name: "ERM Álvares Azevedo", type: "ERM" },
  { name: "ERM Cora Coralina", type: "ERM" },
  { name: "ERM Euclides Cunha", type: "ERM" },
  { name: "ERM Osvaldo Cruz", type: "ERM" },
  { name: "ERM Vinicius de Moraes", type: "ERM" },
];

export async function POST() {
  try {
    // Insert schools
    const insertedSchools = await db
      .insert(schools)
      .values(SCHOOLS)
      .onConflictDoNothing()
      .returning();

    // Fetch all schools to get IDs
    const allSchools = await db.select().from(schools);

    // Create admin user
    const adminPassword = await hashPassword("admin123");
    const techPassword = await hashPassword("tecnico123");
    const gestorPassword = await hashPassword("gestor123");

    await db
      .insert(users)
      .values([
        {
          name: "Administrador",
          email: "admin@nise.gov.br",
          password: adminPassword,
          role: "administrador",
          schoolId: null,
        },
        {
          name: "João Silva",
          email: "tecnico@nise.gov.br",
          password: techPassword,
          role: "tecnico",
          schoolId: allSchools[0]?.id ?? null,
        },
        {
          name: "Maria Gestora",
          email: "gestor@nise.gov.br",
          password: gestorPassword,
          role: "gestor",
          schoolId: allSchools[0]?.id ?? null,
        },
      ])
      .onConflictDoNothing();

    return NextResponse.json({
      message: "Seed concluído com sucesso",
      schools: insertedSchools.length,
      users: "admin@nise.gov.br / admin123, tecnico@nise.gov.br / tecnico123, gestor@nise.gov.br / gestor123",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Erro ao executar seed" },
      { status: 500 }
    );
  }
}
