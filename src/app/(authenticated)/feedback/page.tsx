"use client";

import { useEffect, useState, useCallback } from "react";

interface School {
  id: number;
  name: string;
}

interface FeedbackItem {
  id: number;
  schoolId: number;
  evaluatorName: string;
  evaluatorRole: string | null;
  rating: number;
  comment: string | null;
  category: string | null;
  targetUserId: number | null;
  createdAt: string;
  schoolName: string;
  targetUserName: string | null;
}

interface FeedbackLink {
  id: number;
  token: string;
  schoolId: number;
  used: boolean;
  expiresAt: string | null;
  createdAt: string;
  schoolName: string;
}

interface UserInfo {
  id: number;
  name: string;
  role: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  elogio: { label: "Elogio", color: "bg-emerald-100 text-emerald-700" },
  reclamacao: { label: "Reclamação", color: "bg-red-100 text-red-700" },
  sugestao: { label: "Sugestão", color: "bg-blue-100 text-blue-700" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-amber-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [links, setLinks] = useState<FeedbackLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, schoolsRes, feedbacksRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/schools"),
        fetch("/api/feedback"),
      ]);

      if (userRes.ok) setUser(await userRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (feedbacksRes.ok) setFeedbacks(await feedbacksRes.json());

      if (userRes.ok) {
        const u = await userRes.json().catch(() => null);
        if (u?.role === "administrador") {
          const linksRes = await fetch("/api/feedback/links");
          if (linksRes.ok) setLinks(await linksRes.json());
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLink = async () => {
    if (!selectedSchool) {
      alert("Selecione uma escola.");
      return;
    }

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_link",
        schoolId: selectedSchool,
      }),
    });

    if (res.ok) {
      const link = await res.json();
      const fullUrl = `${window.location.origin}/feedback/submit?token=${link.token}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(link.token);
      setShowLinkForm(false);
      setSelectedSchool("");
      fetchData();
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  const copyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/feedback/submit?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema de Feedback
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Avaliações e feedbacks dos gestores escolares
          </p>
        </div>
        {user?.role === "administrador" && (
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.813a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
            </svg>
            Gerar Link de Avaliação
          </button>
        )}
      </div>

      {/* Link Form */}
      {showLinkForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Gerar Link de Avaliação
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Escola
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
            <button
              onClick={handleCreateLink}
              className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Gerar e Copiar Link
            </button>
            <button
              onClick={() => setShowLinkForm(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
          {copiedToken && (
            <p className="mt-3 text-sm text-emerald-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Link copiado para a área de transferência!
            </p>
          )}
        </div>
      )}

      {/* Links List (Admin only) */}
      {user?.role === "administrador" && links.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              Links de Avaliação Gerados
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {link.schoolName}
                  </p>
                  <p className="text-xs text-gray-400">
                    Criado em{" "}
                    {new Date(link.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    link.used
                      ? "bg-gray-100 text-gray-500"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {link.used ? "Utilizado" : "Pendente"}
                </span>
                {!link.used && (
                  <button
                    onClick={() => copyLink(link.token)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {copiedToken === link.token ? "Copiado!" : "Copiar Link"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedbacks List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Avaliações Recebidas
        </h3>
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <p className="text-gray-400 text-sm">Nenhum feedback recebido</p>
          </div>
        ) : (
          feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {fb.schoolName}
                    </h4>
                    {fb.category && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          CATEGORY_LABELS[fb.category]?.color || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {CATEGORY_LABELS[fb.category]?.label || fb.category}
                      </span>
                    )}
                  </div>
                  <StarRating rating={fb.rating} />
                  {fb.comment && (
                    <p className="mt-2 text-sm text-gray-600">{fb.comment}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>Avaliador: {fb.evaluatorName}</span>
                    {fb.evaluatorRole && <span>Função: {fb.evaluatorRole}</span>}
                    {fb.targetUserName && (
                      <span>Sobre: {fb.targetUserName}</span>
                    )}
                    <span>
                      {new Date(fb.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
