"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface School {
  id: number;
  name: string;
}

interface PresenceRecord {
  id: number;
  userId: number;
  schoolId: number;
  type: "entrada" | "saida";
  timestamp: string;
  notes: string | null;
  userName: string;
  schoolName: string;
}

interface UserInfo {
  id: number;
  name: string;
  role: string;
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

export default function PresencePage() {
  const [records, setRecords] = useState<PresenceRecord[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"presenca" | "ronda">("presenca");
  const [filterSchool, setFilterSchool] = useState("");
  const [showToday, setShowToday] = useState(true);

  // Presence form
  const [showPresenceForm, setShowPresenceForm] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [notes, setNotes] = useState("");

  // Patrol form
  const [showPatrolForm, setShowPatrolForm] = useState(false);
  const [patrolSchool, setPatrolSchool] = useState("");
  const [observations, setObservations] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [otherDescription, setOtherDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioText, setAudioText] = useState("");
  const [interimText, setInterimText] = useState("");
  const finalTranscriptRef = useRef("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, schoolsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/schools"),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSchool) params.set("schoolId", filterSchool);
    if (showToday) params.set("today", "true");

    const res = await fetch(`/api/presence?${params}`);
    if (res.ok) setRecords(await res.json());
    setLoading(false);
  }, [filterSchool, showToday]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRegisterPresence = async (type: "entrada" | "saida") => {
    if (!selectedSchool) {
      alert("Selecione uma escola.");
      return;
    }

    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: selectedSchool, type, notes }),
    });

    if (res.ok) {
      setShowPresenceForm(false);
      setSelectedSchool("");
      setNotes("");
      fetchRecords();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao registrar presença");
    }
  };

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

      finalTranscriptRef.current = "";
      setAudioText("");
      setInterimText("");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        setAudioText(finalTranscriptRef.current);
        setInterimText(interim);
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
    if (!patrolSchool) {
      alert("Selecione uma escola.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/patrols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId: patrolSchool,
          observations,
          audioTranscription: audioText || null,
          checklist,
          otherDescription: checklist.includes("outros") ? otherDescription : null,
        }),
      });

      if (res.ok) {
        setShowPatrolForm(false);
        setPatrolSchool("");
        setObservations("");
        setChecklist([]);
        setOtherDescription("");
        setAudioText("");
        alert("Ronda registrada com sucesso!");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar ronda");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPresenceForm = () => {
    setSelectedSchool("");
    setNotes("");
    setShowPresenceForm(false);
  };

  const resetPatrolForm = () => {
    setPatrolSchool("");
    setObservations("");
    setChecklist([]);
    setOtherDescription("");
    setAudioText("");
    setInterimText("");
    finalTranscriptRef.current = "";
    setIsRecording(false);
    setShowPatrolForm(false);
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
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Controle de Presença
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro de entrada/saída e ronda tática
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("presenca")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "presenca"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Presença
        </button>
        <button
          onClick={() => setActiveTab("ronda")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ronda"
              ? "border-primary-600 text-primary-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Ronda Tática
        </button>
      </div>

      {/* Presence Tab */}
      {activeTab === "presenca" && (
        <>
          <div className="flex items-center justify-between">
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
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showToday}
                  onChange={(e) => setShowToday(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300"
                />
                Apenas hoje
              </label>
            </div>
            {(user?.role === "tecnico" || user?.role === "administrador") && (
              <button
                onClick={() => setShowPresenceForm(!showPresenceForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registrar
              </button>
            )}
          </div>

          {showPresenceForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-slideIn">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Registrar Entrada / Saída
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="Observações opcionais..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handleRegisterPresence("entrada")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Registrar Entrada
                </button>
                <button
                  onClick={() => handleRegisterPresence("saida")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Registrar Saída
                </button>
                <button
                  onClick={resetPresenceForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {records.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-sm">
                  Nenhum registro de presença encontrado
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.type === "entrada"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {record.type === "entrada" ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.userName}
                      </p>
                      <p className="text-xs text-gray-500">{record.schoolName}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          record.type === "entrada"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.type === "entrada" ? "Entrada" : "Saída"}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(record.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Ronda Tática Tab */}
      {activeTab === "ronda" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Registre ocorrências da ronda tática com checklist e áudio
            </p>
            {(user?.role === "tecnico" || user?.role === "administrador") && (
              <button
                onClick={() => setShowPatrolForm(!showPatrolForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nova Ronda
              </button>
            )}
          </div>

          {showPatrolForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-slideIn">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Registrar Ronda Tática
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Escola *
                  </label>
                  <select
                    value={patrolSchool}
                    onChange={(e) => setPatrolSchool(e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Observações
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                    placeholder="Descreva as observações da ronda..."
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ocorrências
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

              {/* Audio */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Relato por Áudio (Ditado)
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
                <textarea
                  value={audioText + (interimText ? (audioText ? " " : "") + interimText + "|" : "")}
                  onChange={(e) => {
                    if (!isRecording) {
                      setAudioText(e.target.value);
                      finalTranscriptRef.current = e.target.value;
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  placeholder={isRecording ? "Aguardando áudio..." : "Transcrição aparecerá aqui..."}
                  readOnly={isRecording}
                />
                {isRecording && (
                  <p className="text-xs text-red-500 mt-1 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                    Gravando... fale normalmente
                  </p>
                )}
                {!isRecording && audioText && (
                  <p className="text-xs text-gray-400 mt-1">
                    {audioText.length} caracteres transcritos. Você pode editar o texto acima.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSubmitPatrol}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Registrando..." : "Registrar Ronda"}
                </button>
                <button
                  onClick={resetPatrolForm}
                  className="px-6 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-gray-500 text-sm mb-1">
              Suas rondas registradas aparecerão aqui
            </p>
            <p className="text-gray-400 text-xs">
              Vá até a página de Patrulhas para ver o histórico completo
            </p>
          </div>
        </>
      )}
    </div>
  );
}
