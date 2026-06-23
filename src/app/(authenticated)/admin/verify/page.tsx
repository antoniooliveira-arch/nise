"use client";

import { useEffect, useState, useCallback } from "react";

interface Patrol {
  id: number;
  schoolId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  observations: string | null;
  audioTranscription: string | null;
  checklist: string[] | null;
  otherDescription: string | null;
  status: string;
  userName: string;
  schoolName: string;
}

interface SchoolGroup {
  schoolId: number;
  schoolName: string;
  patrols: Patrol[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-700" },
  concluida: { label: "Concluída", color: "bg-blue-100 text-blue-700" },
  validada: { label: "Validada", color: "bg-emerald-100 text-emerald-700" },
  em_atendimento: { label: "Em Atendimento", color: "bg-purple-100 text-purple-700" },
};

const CHECKLIST_LABELS: Record<string, string> = {
  evasao_escolar: "Evasão Escolar",
  brigas: "Brigas",
  patio_atencao: "Pátio p/ Atenção",
  cozinha: "Cozinha",
  patio_alimentacao: "Pátio Alimentação",
  muro_cerca: "Muro/Cerca",
  banheiros: "Banheiros",
  risco_acidentes: "Risco de Acidentes",
  portao: "Portão",
  portas_janelas: "Portas/Janelas",
  outros: "Outros",
};

export default function AdminVerifyPage() {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterSchool) params.set("schoolId", filterSchool);

      const [patrolsRes, schoolsRes] = await Promise.all([
        fetch(`/api/patrols?${params}`),
        fetch("/api/schools"),
      ]);
      if (patrolsRes.ok) setPatrols(await patrolsRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filterSchool]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (patrolId: number, action: "validate" | "attending") => {
    setVerifyingId(patrolId);
    try {
      const res = await fetch(`/api/patrols/${patrolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchData();
      else {
        const data = await res.json();
        alert(data.error || "Erro ao verificar patrulha");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setVerifyingId(null);
    }
  };

  const pendingCount = patrols.filter(
    (p) => p.status === "concluida" || p.status === "em_atendimento"
  ).length;

  const validadeCount = patrols.filter((p) => p.status === "validada").length;

  const groups: SchoolGroup[] = [];
  const seenSchools = new Set<number>();
  for (const patrol of patrols) {
    if (!seenSchools.has(patrol.schoolId)) {
      seenSchools.add(patrol.schoolId);
      groups.push({
        schoolId: patrol.schoolId,
        schoolName: patrol.schoolName,
        patrols: patrols.filter((p) => p.schoolId === patrol.schoolId),
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Verificação de Patrulhas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Revise e valide as patrulhas de cada escola
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{patrols.length}</p>
          <p className="text-xs text-gray-500">Total de Patrulhas</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-emerald-600">{validadeCount}</p>
          <p className="text-xs text-gray-500">Validadas</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filtrar por escola:
          </label>
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 max-w-xs"
          >
            <option value="">Todas as escolas</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schools */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <p className="text-gray-400 text-sm">Nenhuma patrulha encontrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.schoolId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{group.schoolName}</h3>
                <span className="text-xs text-gray-500">
                  {group.patrols.length} patrulha(s)
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.patrols.map((patrol) => (
                  <div key={patrol.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {patrol.userName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              STATUS_LABELS[patrol.status]?.color || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[patrol.status]?.label || patrol.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            {new Date(patrol.date).toLocaleDateString("pt-BR")}
                          </span>
                          <span>
                            {new Date(patrol.startTime).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {patrol.endTime &&
                              ` - ${new Date(patrol.endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        </div>
                        {patrol.checklist && patrol.checklist.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {patrol.checklist.map((item) => (
                              <span key={item} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                                {CHECKLIST_LABELS[item] || item}
                              </span>
                            ))}
                          </div>
                        )}
                        {patrol.observations && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {patrol.observations}
                          </p>
                        )}
                        {patrol.audioTranscription && (
                          <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">
                              🎤 {patrol.audioTranscription}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(patrol.status === "concluida" || patrol.status === "em_atendimento") && (
                          <>
                            <button
                              onClick={() => handleVerify(patrol.id, "validate")}
                              disabled={verifyingId === patrol.id}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {verifyingId === patrol.id ? "..." : "Validar"}
                            </button>
                            <button
                              onClick={() => handleVerify(patrol.id, "attending")}
                              disabled={verifyingId === patrol.id}
                              className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                            >
                              {verifyingId === patrol.id ? "..." : "Em Atendimento"}
                            </button>
                          </>
                        )}
                        {patrol.status === "validada" && (
                          <span className="text-xs text-emerald-600 font-medium">
                            ✓ Validada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
