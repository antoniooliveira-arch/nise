"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Technician {
  id: number;
  name: string;
}

function FeedbackSubmitContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [valid, setValid] = useState<boolean | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [error, setError] = useState("");

  const [evaluatorName, setEvaluatorName] = useState("");
  const [evaluatorRole, setEvaluatorRole] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateToken = useCallback(async () => {
    if (!token) {
      setValid(false);
      setError("Token não fornecido.");
      return;
    }

    try {
      const res = await fetch(`/api/feedback/validate?token=${token}`);
      const data = await res.json();

      if (res.ok) {
        setValid(true);
        setSchoolName(data.schoolName);
        setTechnicians(data.technicians || []);
      } else {
        setValid(false);
        setError(data.error || "Link inválido.");
      }
    } catch {
      setValid(false);
      setError("Erro ao validar link.");
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!evaluatorName || !rating) {
      alert("Preencha seu nome e a avaliação.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          token,
          evaluatorName,
          evaluatorRole,
          rating,
          comment,
          category,
          targetUserId: targetUserId || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao enviar avaliação.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Link Inválido
          </h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Avaliação Enviada!
          </h2>
          <p className="text-sm text-gray-500">
            Obrigado por contribuir com a segurança escolar. Sua avaliação foi
            registrada com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center p-4" style={{
      backgroundImage: 'url(/images/feedback-hero.jpg)',
      backgroundAttachment: 'fixed'
    }}>
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/95 backdrop-blur-sm rounded-2xl mb-4 border-2 border-white/30 shadow-lg">
            <img
              src="/images/logo.png"
              alt="NISE Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">NISE</h1>
          <p className="text-white/90 text-sm drop-shadow-md font-medium">Avaliação de Segurança Escolar</p>
          <p className="text-white/80 text-sm mt-2 font-medium drop-shadow-md">{schoolName}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seu Nome *
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sua Função
            </label>
            <input
              type="text"
              value={evaluatorRole}
              onChange={(e) => setEvaluatorRole(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Ex: Diretor, Coordenador, etc."
            />
          </div>

          {technicians.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Avaliar Porteiro(a) do NISE
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Selecione (opcional)</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de Avaliação
            </label>
            <div className="flex gap-2">
              {[
                { id: "elogio", label: "Elogio", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
                { id: "sugestao", label: "Sugestão", color: "border-blue-300 bg-blue-50 text-blue-700" },
                { id: "reclamacao", label: "Reclamação", color: "border-red-300 bg-red-50 text-red-700" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${
                    category === cat.id
                      ? cat.color
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nota *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <svg
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "text-amber-400"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Comentário
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              placeholder="Descreva sua avaliação, sugestão ou reclamação..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? "Enviando..." : "Enviar Avaliação"}
          </button>
        </form>

        <p className="text-center text-primary-300 text-xs mt-6 pb-8">
          Desenvolvido pelo Departamento de Tecnologia da SME
        </p>
      </div>
    </div>
  );
}

export default function FeedbackSubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <FeedbackSubmitContent />
    </Suspense>
  );
}
