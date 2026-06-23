"use client";

import { useEffect, useState, useCallback } from "react";

interface School {
  id: number;
  name: string;
  type: string;
}

interface Patrol {
  id: number;
  userId: number;
  schoolId: number;
  date: string;
  startTime: string;
  endTime: string | null;
  observations: string | null;
  audioTranscription: string | null;
  checklist: string[] | null;
  otherDescription: string | null;
  status: string;
  validatedBy: number | null;
  validatedAt: string | null;
  userName: string;
  schoolName: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId: number | null;
}

const CHECKLIST_ITEMS = [
  { id: "evasao_escolar", label: "Evasão Escolar" },
  { id: "brigas", label: "Brigas" },
  { id: "patio_atencao", label: "Pátio precisa de atenção" },
  { id: "cozinha", label: "Cozinha" },
  { id: "patio_alimentacao", label: "Pátio de alimentação" },
  { id: "muro_cerca", label: "Muro / Cerca" },
  { id: "banheiros", label: "Banheiros" },
  { id: "risco_acidentes", label: "Situações de risco de acidentes" },
  { id: "portao", label: "Portão" },
  { id: "portas_janelas", label: "Portas e janelas" },
  { id: "outros", label: "Outros" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_andamento: { label: "Em Andamento", color: "bg-amber-100 text-amber-700" },
  concluida: { label: "Concluída", color: "bg-blue-100 text-blue-700" },
  validada: { label: "Validada", color: "bg-emerald-100 text-emerald-700" },
};

export default function PatrolsPage() {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [selectedSchool, setSelectedSchool] = useState("");
  const [observations, setObservations] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [otherDescription, setOtherDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioText, setAudioText] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [userRes, schoolsRes, patrolsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/schools"),
        fetch("/api/patrols"),
      ]);

      if (userRes.ok) setUser(await userRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (patrolsRes.ok) setPatrols(await patrolsRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPatrols = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSchool) params.set("schoolId", filterSchool);
    if (filterStatus) params.set("status", filterStatus);

    const res = await fetch(`/api/patrols?${params}`);
    if (res.ok) setPatrols(await res.json());
  }, [filterSchool, filterStatus]);

  useEffect(() => {
    fetchPatrols();
  }, [fetchPatrols]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const startRecording = async () => {
    try {
      const win = window as unknown as Record<string, unknown>;
      const SR =
        (win.SpeechRecognition as unknown) ||
        (win.webkitSpeechRecognition as unknown);
      if (!SR) {
        alert("Seu navegador não suporta reconhecimento de voz.");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SR as any)();
      recognition.lang = "pt-BR";
      recognition.continuous = true;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAudioText(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      (window as unknown as Record<string, unknown>).__recognition = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      alert("Erro ao iniciar gravação de áudio.");
    }
  };

  const stopRecording = () => {
    const recognition = (window as unknown as Record<string, unknown>).__recognition as
      | { stop: () => void }
      | undefined;
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleSubmitPatrol = async () => {
    if (!selectedSchool) {
      alert("Selecione uma escola.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: selectedSchool,
          observations,
          audioTranscription: audioText || null,
          checklist,
          otherDescription: checklist.includes("outros") ? otherDescription : null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchPatrols();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar patrulha");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishPatrol = async (patrolId: number) => {
    const res = await fetch(`/api/patrols/${patrolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finish" }),
    });
    if (res.ok) fetchPatrols();
  };

  const handleValidatePatrol = async (patrolId: number) => {
    const res = await fetch(`/api/patrols/${patrolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate" }),
    });
    if (res.ok) fetchPatrols();
  };

  const resetForm = () => {
    setSelectedSchool("");
    setObservations("");
    setChecklist([]);
    setOtherDescription("");
    setAudioText("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrulhas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro e monitoramento de patrulhamento escolar
          </p>
        </div>
        {(user?.role === "tecnico" || user?.role === "administrador") && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Patrulha
          </button>
        )}
      </div>

      {/* New Patrol Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Registrar Nova Patrulha
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* School Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Escola *
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Selecione a escola</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observações
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                placeholder="Descreva as observações da patrulha..."
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Checklist de Ocorrências
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                    checklist.includes(item.id)
                      ? "border-primary-300 bg-primary-50 text-primary-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist.includes(item.id)}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {checklist.includes("outros") && (
              <div className="mt-3">
                <input
                  type="text"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="Descreva a ocorrência..."
                />
              </div>
            )}
          </div>

          {/* Audio Recording */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Entrada por Áudio (Ditado)
            </label>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isRecording
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    Parar Gravação
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    Iniciar Gravação
                  </>
                )}
              </button>
              {isRecording && (
                <span className="text-xs text-red-500 animate-pulse">
                  Gravando...
                </span>
              )}
            </div>
            {audioText && (
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">Transcrição:</p>
                {audioText}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmitPatrol}
              disabled={submitting}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Registrando..." : "Registrar Patrulha"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterSchool}
          onChange={(e) => setFilterSchool(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todas as escolas</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Todos os status</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluida">Concluída</option>
          <option value="validada">Validada</option>
        </select>
      </div>

      {/* Patrols List */}
      <div className="space-y-3">
        {patrols.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-gray-400 text-sm">Nenhuma patrulha encontrada</p>
          </div>
        ) : (
          patrols.map((patrol) => (
            <div
              key={patrol.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {patrol.schoolName}
                    </h4>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        STATUS_LABELS[patrol.status]?.color || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[patrol.status]?.label || patrol.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                      </svg>
                      {patrol.userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                      </svg>
                      {new Date(patrol.date).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(patrol.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {patrol.endTime &&
                        ` - ${new Date(patrol.endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                  </div>

                  {/* Checklist display */}
                  {patrol.checklist && patrol.checklist.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {patrol.checklist.map((item) => {
                        const checkItem = CHECKLIST_ITEMS.find((c) => c.id === item);
                        return (
                          <span
                            key={item}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200"
                          >
                            {checkItem?.label || item}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Observations */}
                  {patrol.observations && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {patrol.observations}
                    </p>
                  )}

                  {/* Audio transcription */}
                  {patrol.audioTranscription && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 mb-0.5">🎤 Transcrição de áudio:</p>
                      <p className="text-sm text-blue-800 line-clamp-2">
                        {patrol.audioTranscription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-col">
                  {patrol.status === "em_andamento" &&
                    (user?.role === "tecnico" || user?.role === "administrador") && (
                      <button
                        onClick={() => handleFinishPatrol(patrol.id)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Finalizar
                      </button>
                    )}
                  {patrol.status === "concluida" && user?.role === "administrador" && (
                    <button
                      onClick={() => handleValidatePatrol(patrol.id)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Validar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
