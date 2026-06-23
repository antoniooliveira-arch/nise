"use client";

import { useEffect, useState, useCallback } from "react";

interface School {
  id: number;
  name: string;
}

interface ReportPatrol {
  id: number;
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

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  validada: "Validada",
  em_atendimento: "Em Atendimento",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportPatrol[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchSchools = useCallback(async () => {
    const res = await fetch("/api/schools");
    if (res.ok) setSchools(await res.json());
  }, []);

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSchool) params.set("schoolId", filterSchool);
    if (filterStatus) params.set("status", filterStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/reports?${params}`);
    if (res.ok) setReports(await res.json());
    setLoading(false);
  }, [filterSchool, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text("NISE - Relatório de Patrulhas", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        14,
        28
      );

      if (filterSchool) {
        const school = schools.find((s) => s.id.toString() === filterSchool);
        doc.text(`Escola: ${school?.name || filterSchool}`, 14, 34);
      }
      if (dateFrom || dateTo) {
        doc.text(
          `Período: ${dateFrom || "Início"} a ${dateTo || "Atual"}`,
          14,
          40
        );
      }

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Resumo", 14, 52);

      const statusCounts = {
        em_andamento: reports.filter((r) => r.status === "em_andamento").length,
        concluida: reports.filter((r) => r.status === "concluida").length,
        validada: reports.filter((r) => r.status === "validada").length,
        em_atendimento: reports.filter((r) => r.status === "em_atendimento").length,
      };

      doc.setFontSize(10);
      doc.text(`Total de patrulhas: ${reports.length}`, 14, 60);
      doc.text(`Em andamento: ${statusCounts.em_andamento}`, 14, 66);
      doc.text(`Concluídas: ${statusCounts.concluida}`, 14, 72);
      doc.text(`Em Atendimento: ${statusCounts.em_atendimento}`, 14, 78);
      doc.text(`Validadas: ${statusCounts.validada}`, 14, 84);

      // Table
      const tableData = reports.map((r) => [
        new Date(r.date).toLocaleDateString("pt-BR"),
        r.schoolName,
        r.userName,
        STATUS_LABELS[r.status] || r.status,
        (r.checklist || []).map((c) => CHECKLIST_LABELS[c] || c).join(", ") || "-",
        r.observations?.substring(0, 50) || "-",
      ]);

      autoTable(doc, {
        startY: 92,
        head: [["Data", "Escola", "Técnico", "Status", "Ocorrências", "Observações"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 22 },
          4: { cellWidth: 40 },
          5: { cellWidth: 38 },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "Desenvolvido pelo Departamento de Tecnologia da SME",
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() - 14,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      }

      doc.save(`nise-relatorio-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Geração e exportação de relatórios de patrulha
          </p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting || reports.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Gerando PDF...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exportar PDF
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <option value="em_atendimento">Em Atendimento</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Data final"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-amber-600">
            {reports.filter((r) => r.status === "em_andamento").length}
          </p>
          <p className="text-xs text-gray-500">Em Andamento</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-blue-600">
            {reports.filter((r) => r.status === "concluida").length}
          </p>
          <p className="text-xs text-gray-500">Concluídas</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-purple-600">
            {reports.filter((r) => r.status === "em_atendimento").length}
          </p>
          <p className="text-xs text-gray-500">Em Atendimento</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-emerald-600">
            {reports.filter((r) => r.status === "validada").length}
          </p>
          <p className="text-xs text-gray-500">Validadas</p>
        </div>
      </div>

      {/* Reports Table - Desktop */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Data
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Escola
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Técnico
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Ocorrências
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                    Nenhum relatório encontrado com os filtros selecionados
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-700">
                      {new Date(report.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {report.schoolName}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {report.userName}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          report.status === "validada"
                            ? "bg-emerald-100 text-emerald-700"
                            : report.status === "concluida"
                            ? "bg-blue-100 text-blue-700"
                            : report.status === "em_atendimento"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(report.checklist || []).slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg"
                          >
                            {CHECKLIST_LABELS[item] || item}
                          </span>
                        ))}
                        {(report.checklist || []).length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{(report.checklist || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-gray-400 text-sm">Nenhum relatório encontrado</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{report.schoolName}</p>
                  <p className="text-xs text-gray-500">{report.userName}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    report.status === "validada"
                      ? "bg-emerald-100 text-emerald-700"
                      : report.status === "concluida"
                      ? "bg-blue-100 text-blue-700"
                      : report.status === "em_atendimento"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {STATUS_LABELS[report.status] || report.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>{new Date(report.date).toLocaleDateString("pt-BR")}</span>
                <span>•</span>
                <span>
                  {new Date(report.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(report.checklist || []).map((item) => (
                  <span key={item} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                    {CHECKLIST_LABELS[item] || item}
                  </span>
                ))}
              </div>
              {report.observations && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{report.observations}</p>
              )}
              {report.audioTranscription && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">🎤 {report.audioTranscription}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
