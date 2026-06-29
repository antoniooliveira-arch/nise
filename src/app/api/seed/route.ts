import { NextResponse } from "next/server";
import { db } from "@/db";
import { schools, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const SCHOOLS = [
  { name: "CEI LUIZ FELIPE", type: "CEI" },
  { name: "CEI SAO CRISTOVAO", type: "CEI" },
  { name: "CEI ARCO IRIS", type: "CEI" },
  { name: "CEI BRUNO LEONARDO", type: "CEI" },
  { name: "CEI DOM FRANCO", type: "CEI" },
  { name: "CEI MENINO JESUS", type: "CEI" },
  { name: "CEI NOSSO LAR", type: "CEI" },
  { name: "CEI VASCO PAPA", type: "CEI" },
  { name: "CEI CRIANCA FELIZ", type: "CEI" },
  { name: "CEM GUILHERME", type: "CEM" },
  { name: "CEM ORLANDO PEREIRA", type: "CEM" },
  { name: "EM MARIA HILDA", type: "EM" },
  { name: "EM PAULO FREIRE", type: "EM" },
  { name: "EM JOSE ANCHIETA", type: "EM" },
  { name: "ERM ALVARES AZEVEDO", type: "ERM" },
  { name: "ERM CORA CORALINA", type: "ERM" },
  { name: "ERM EUCLIDES CUNHA", type: "ERM" },
  { name: "ERM OSVALDO CRUZ", type: "ERM" },
  { name: "ERM VINICIUS DE MORAIS", type: "ERM" },
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
