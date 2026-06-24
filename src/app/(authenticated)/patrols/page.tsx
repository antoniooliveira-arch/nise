"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  em_atendimento: { label: "Em Atendimento", color: "bg-purple-100 text-purple-700" },
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
  const [interimText, setInterimText] = useState("");
  const finalTranscriptRef = useRef("");

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
    setInterimText("");
    finalTranscriptRef.current = "";
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


    </div>
  );
}
