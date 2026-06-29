import React, { useState, useMemo } from 'react';
import { Download, CheckCircle, AlertTriangle, XCircle, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { RelatorioDiario, Ocorrencia, AvaliacaoPorteiro } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports: React.FC = () => {
  const { relatoriosDiarios, ocorrencias, chamados, avaliacoesPorteiros, escolas } = useApp();

  const [reportType, setReportType] = useState('gerencial');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedEscola, setSelectedEscola] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<Ocorrencia | AvaliacaoPorteiro | null>(null);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      normal: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      atencao: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertTriangle className="w-4 h-4" /> },
      critico: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" /> },
    };
    return styles[status] || styles.normal;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal',
      atencao: 'Atenção',
      critico: 'Crítico',
    };
    return labels[status] || status;
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    return relatoriosDiarios.filter(rd => {
      const reportDate = new Date(rd.data);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (reportDate < startDate || reportDate > endDate) return false;
      if (selectedEscola && rd.escolaId !== selectedEscola) return false;
      return true;
    });
  }, [relatoriosDiarios, dateRange, selectedEscola]);

  // Filter ocorrencias
  const filteredOcorrencias = useMemo(() => {
    return ocorrencias.filter(o => {
      const occDate = new Date(o.dataAbertura);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (occDate < startDate || occDate > endDate) return false;
      if (selectedEscola && o.escolaId !== selectedEscola) return false;
      return true;
    });
  }, [ocorrencias, dateRange, selectedEscola]);

  // Filter avaliacoes
  const filteredAvaliacoes = useMemo(() => {
    return avaliacoesPorteiros.filter(a => {
      const evalDate = new Date(a.data);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (evalDate < startDate || evalDate > endDate) return false;
      if (selectedEscola && a.escolaId !== selectedEscola) return false;
      return true;
    });
  }, [avaliacoesPorteiros, dateRange, selectedEscola]);

  // Report stats
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const normal = filteredReports.filter(r => r.situacao === 'normal').length;
    const atencao = filteredReports.filter(r => r.situacao === 'atencao').length;
    const critico = filteredReports.filter(r => r.situacao === 'critico').length;
    return { total, normal, atencao, critico };
  }, [filteredReports]);

  // Occurrence summary
  const occurrenceSummary = useMemo(() => ({
    total: filteredOcorrencias.length,
    abertas: filteredOcorrencias.filter(o => o.status === 'aberta' || o.status === 'em_atendimento').length,
    finalizadas: filteredOcorrencias.filter(o => o.status === 'finalizada' || o.status === 'encerrada').length,
    seguranca: filteredOcorrencias.filter(o => o.categoria === 'seguranca').length,
    disciplina: filteredOcorrencias.filter(o => o.categoria === 'disciplina').length,
    estrutura: filteredOcorrencias.filter(o => o.categoria === 'estrutura').length,
    outros: filteredOcorrencias.filter(o => o.categoria === 'outros').length,
  }), [filteredOcorrencias]);

  // Porteiro evaluations summary
  const porteiroSummary = useMemo(() => ({
    total: filteredAvaliacoes.length,
    funcionais: filteredAvaliacoes.filter(a => a.situacao === 'funcional').length,
    naoFuncionais: filteredAvaliacoes.filter(a => a.situacao === 'nao_funcional').length,
  }), [filteredAvaliacoes]);

  const getOcorrenciaChamado = (occId: string) => chamados.find(c => c.ocorrenciaId === occId);

  // Agrupar por escola
  const escolasComRegistros = useMemo(() => {
    const escolasList = selectedEscola
      ? escolas.filter(e => e.id === selectedEscola)
      : escolas;
    return escolasList.map(esc => {
      const escId = esc.id;
      const occ = filteredOcorrencias.filter(o => o.escolaId === escId);
      const aval = filteredAvaliacoes.filter(a => a.escolaId === escId);
      const rel = filteredReports.filter(r => r.escolaId === escId);
      const mostraOcc = reportType === 'ocorrencias' || reportType === 'gerencial';
      const mostraAval = reportType === 'avaliacoes' || reportType === 'gerencial';
      const mostraRel = reportType === 'diario' || reportType === 'gerencial';
      return {
        ...esc,
        ocorrencias: occ,
        avaliacoes: aval,
        relatorios: rel,
        totalRegistros: (mostraOcc ? occ.length : 0) + (mostraAval ? aval.length : 0) + (mostraRel ? rel.length : 0),
      };
    }).filter(esc => esc.totalRegistros > 0);
  }, [escolas, selectedEscola, filteredOcorrencias, filteredAvaliacoes, filteredReports, reportType]);

  const handleExport = (exportFormat: string) => {
    const escolasMap = new Map(escolas.map(e => [e.id, e.nome]));

    const gerarLinhasOcorrencias = (items: Ocorrencia[]) => items.map(o => ({
      'Unidade': o.escolaNome || escolasMap.get(o.escolaId) || '-',
      'Tipo': o.tipo,
      'Status': o.status,
      'Descrição relatada pelo técnico tático': o.descricao || '',
      'Finalização': o.status === 'finalizada' || o.status === 'encerrada'
        ? (getOcorrenciaChamado(o.id)?.observacoesAdmin || '')
        : '',
      'Data': format(new Date(o.dataAbertura), 'dd/MM/yyyy HH:mm'),
    }));

    const gerarLinhasRelatorios = (items: RelatorioDiario[]) => items.map(r => ({
      'Data': format(new Date(r.data), 'dd/MM/yyyy'),
      'Unidade': r.escolaNome || escolasMap.get(r.escolaId) || '-',
      'Situação': r.situacao,
      'Enviado por': r.enviadoPor,
      'Observações': r.observacoes || '',
    }));

    const gerarLinhasAvaliacoes = (items: AvaliacaoPorteiro[]) => items.map(a => ({
      'Data': format(new Date(a.data), 'dd/MM/yyyy'),
      'Unidade': a.escolaNome || escolasMap.get(a.escolaId) || '-',
      'Porteiro': a.porteiroNome,
      'Situação': a.situacao === 'funcional' ? 'Funcional' : 'Não Funcional',
      'Motivos': a.motivo || '',
    }));

    const buildWorkbook = () => {
      const wb = XLSX.utils.book_new();
      if (reportType === 'diario' || reportType === 'gerencial') {
        const ws = XLSX.utils.json_to_sheet(gerarLinhasRelatorios(filteredReports));
        XLSX.utils.book_append_sheet(wb, ws, 'Relatórios Diários');
      }
      if (reportType === 'ocorrencias' || reportType === 'gerencial') {
        const ws = XLSX.utils.json_to_sheet(gerarLinhasOcorrencias(filteredOcorrencias));
        XLSX.utils.book_append_sheet(wb, ws, 'Ocorrências');
      }
      if (reportType === 'avaliacoes' || reportType === 'gerencial') {
        const ws = XLSX.utils.json_to_sheet(gerarLinhasAvaliacoes(filteredAvaliacoes));
        XLSX.utils.book_append_sheet(wb, ws, 'Avaliações');
      }
      return wb;
    };

    const periodLabel = `${format(new Date(dateRange.start), 'dd/MM/yyyy')} - ${format(new Date(dateRange.end), 'dd/MM/yyyy')}`;
    const reportTypeLabel = reportType === 'diario' ? 'Relatorio_Diario' : reportType === 'ocorrencias' ? 'Ocorrencias' : reportType === 'avaliacoes' ? 'Avaliacoes' : 'Gerencial';
    const filename = `Relatorio_${reportTypeLabel}_${format(new Date(), 'yyyyMMdd_HHmm')}`;

    if (exportFormat === 'csv') {
      const wb = buildWorkbook();
      XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
    } else if (exportFormat === 'excel') {
      const wb = buildWorkbook();
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else if (exportFormat === 'pdf') {
      const doc = new jsPDF('landscape');
      let currentY = 20;

      doc.setFontSize(14);
      doc.text('Relatório - ' + (reportType === 'diario' ? 'Diário' : reportType === 'ocorrencias' ? 'Ocorrências' : reportType === 'avaliacoes' ? 'Avaliações' : 'Gerencial'), 14, currentY);
      currentY += 7;
      doc.setFontSize(10);
      doc.text(`Período: ${periodLabel}`, 14, currentY);
      currentY += 10;

      if (reportType === 'diario' || reportType === 'gerencial') {
        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Unidade', 'Situação', 'Enviado por', 'Observações']],
          body: filteredReports.map(r => [
            format(new Date(r.data), 'dd/MM/yyyy'),
            r.escolaNome || escolasMap.get(r.escolaId) || '-',
            r.situacao,
            r.enviadoPor,
            r.observacoes || '',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (reportType === 'ocorrencias' || reportType === 'gerencial') {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        autoTable(doc, {
          startY: currentY,
          head: [['Unidade', 'Tipo', 'Status', 'Descrição', 'Finalização', 'Data']],
          body: filteredOcorrencias.map(o => [
            o.escolaNome || escolasMap.get(o.escolaId) || '-',
            o.tipo,
            o.status,
            o.descricao || '',
            (o.status === 'finalizada' || o.status === 'encerrada')
              ? (getOcorrenciaChamado(o.id)?.observacoesAdmin || '')
              : '',
            format(new Date(o.dataAbertura), 'dd/MM/yyyy HH:mm'),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (reportType === 'avaliacoes' || reportType === 'gerencial') {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        autoTable(doc, {
          startY: currentY,
          head: [['Data', 'Unidade', 'Porteiro', 'Situação', 'Motivos']],
          body: filteredAvaliacoes.map(a => [
            format(new Date(a.data), 'dd/MM/yyyy'),
            a.escolaNome || escolasMap.get(a.escolaId) || '-',
            a.porteiroNome,
            a.situacao === 'funcional' ? 'Funcional' : 'Não Funcional',
            a.motivo || '',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
        });
      }

      doc.save(`${filename}.pdf`);
    }
  };

  const reportColumns = [
    {
      key: 'data',
      header: 'Data',
      className: 'w-28',
      render: (item: RelatorioDiario) => (
        <span className="text-sm">{format(new Date(item.data), 'dd/MM/yyyy')}</span>
      ),
    },
    {
      key: 'escolaNome',
      header: 'Unidade',
      className: 'min-w-[180px]',
    },
    {
      key: 'situacao',
      header: 'Situação',
      className: 'w-28',
      render: (item: RelatorioDiario) => {
        const style = getStatusStyle(item.situacao);
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
            {style.icon}
            {getStatusLabel(item.situacao)}
          </span>
        );
      },
    },
    {
      key: 'enviadoPor',
      header: 'Enviado por',
      className: 'min-w-[140px]',
    },
    {
      key: 'observacoes',
      header: 'Observações',
      className: 'min-w-[300px] max-w-2xl',
      render: (item: RelatorioDiario) => (
        <div className="whitespace-pre-wrap break-words text-sm text-gray-700 leading-relaxed py-1">
          {item.observacoes}
        </div>
      ),
    },
  ];

  const ocorrenciaColumns = [
    { key: 'escolaNome', header: 'Unidade', className: 'min-w-[150px]' },
    { key: 'tipo', header: 'Tipo', className: 'min-w-[120px]' },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (item: Ocorrencia) => {
        const labels: Record<string, string> = { aberta: 'Aberta', em_atendimento: 'Em Atendimento', finalizada: 'Finalizada', encerrada: 'Encerrada' };
        const colors: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = { aberta: 'info', em_atendimento: 'warning', finalizada: 'success', encerrada: 'secondary' };
        return <Badge variant={colors[item.status] || 'info'} size="sm">{labels[item.status] || item.status}</Badge>;
      },
    },
    {
      key: 'data',
      header: 'Data',
      className: 'w-28',
      render: (item: Ocorrencia) => (
        <span className="text-sm">{format(new Date(item.dataAbertura), 'dd/MM/yyyy')}</span>
      ),
    },
    {
      key: 'descricao',
      header: 'Descrição relatada pelo técnico tático',
      className: 'min-w-[200px] max-w-sm',
      render: (item: Ocorrencia) => (
        <div className="whitespace-pre-wrap break-words text-sm text-gray-600 leading-relaxed">
          {item.descricao || '-'}
        </div>
      ),
    },
    {
      key: 'finalizacao',
      header: 'Finalização',
      className: 'min-w-[200px] max-w-sm',
      render: (item: Ocorrencia) => {
        const ch = getOcorrenciaChamado(item.id);
        return (
          <div className="whitespace-pre-wrap break-words text-sm text-gray-600 leading-relaxed">
            {ch?.observacoesAdmin || '-'}
          </div>
        );
      },
    },
    {
      key: 'detalhes',
      header: '',
      className: 'w-10',
      render: (item: Ocorrencia) => (
        <button onClick={() => setSelectedDetail(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const avaliacaoColumns = [
    {
      key: 'data',
      header: 'Data',
      className: 'w-24',
      render: (item: AvaliacaoPorteiro) => (
        <span className="text-sm">{format(new Date(item.data), 'dd/MM/yyyy')}</span>
      ),
    },
    { key: 'escolaNome', header: 'Unidade', className: 'min-w-[150px]' },
    { key: 'porteiroNome', header: 'Porteiro', className: 'min-w-[140px]' },
    {
      key: 'situacao',
      header: 'Situação',
      className: 'w-28',
      render: (item: AvaliacaoPorteiro) => (
        <Badge variant={item.situacao === 'funcional' ? 'success' : 'danger'} size="sm">
          {item.situacao === 'funcional' ? 'Funcional' : 'Não Funcional'}
        </Badge>
      ),
    },
    {
      key: 'motivo',
      header: 'Motivo',
      className: 'min-w-[180px] max-w-xs',
      render: (item: AvaliacaoPorteiro) => (
        <div className="flex flex-wrap gap-1">
          {item.motivo ? item.motivo.split(', ').map((m, i) => (
            <span key={i} className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{m}</span>
          )) : <span className="text-sm text-gray-400">-</span>}
        </div>
      ),
    },
    { key: 'tecnicoResponsavel', header: 'Técnico', className: 'min-w-[130px]' },
    {
      key: 'detalhes',
      header: '',
      className: 'w-10',
      render: (item: AvaliacaoPorteiro) => (
        <button onClick={() => setSelectedDetail(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">
            Geração e acompanhamento de relatórios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => handleExport('pdf')}>
            PDF
          </Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => handleExport('excel')}>
            Excel
          </Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => handleExport('csv')}>
            CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Tipo de Relatório"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'diario', label: 'Relatório Diário' },
              { value: 'ocorrencias', label: 'Ocorrências' },
              { value: 'avaliacoes', label: 'Avaliação de Porteiros' },
              { value: 'gerencial', label: 'Relatório Gerencial' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            label="Unidade"
            value={selectedEscola}
            onChange={(e) => setSelectedEscola(e.target.value)}
            options={[{ value: '', label: 'Todas as unidades' }, ...escolas.map(e => ({ value: e.id, label: e.nome }))]}
          />
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportType === 'diario' && (
          <>
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total de Relatórios</p>
            </Card>
            <Card className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{stats.normal}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">Normal</p>
            </Card>
            <Card className="text-center">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <p className="text-3xl font-bold text-amber-600">{stats.atencao}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">Atenção</p>
            </Card>
            <Card className="text-center">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <p className="text-3xl font-bold text-red-600">{stats.critico}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">Crítico</p>
            </Card>
          </>
        )}

        {reportType === 'ocorrencias' && (
          <>
            <Card className="text-center">
              <p className="text-3xl font-bold text-blue-600">{occurrenceSummary.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total de Ocorrências</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-red-600">{occurrenceSummary.seguranca}</p>
              <p className="text-sm text-gray-500 mt-1">Segurança</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-amber-600">{occurrenceSummary.disciplina}</p>
              <p className="text-sm text-gray-500 mt-1">Disciplina</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-blue-500">{occurrenceSummary.estrutura + occurrenceSummary.outros}</p>
              <p className="text-sm text-gray-500 mt-1">Estrutura/Outros</p>
            </Card>
          </>
        )}

        {reportType === 'avaliacoes' && (
          <>
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{porteiroSummary.total}</p>
              <p className="text-sm text-gray-500 mt-1">Total de Avaliações</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-green-600">{porteiroSummary.funcionais}</p>
              <p className="text-sm text-gray-500 mt-1">Funcionais</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-red-600">{porteiroSummary.naoFuncionais}</p>
              <p className="text-sm text-gray-500 mt-1">Não Funcionais</p>
            </Card>
            <Card className="text-center bg-green-50">
              <p className="text-3xl font-bold text-green-600">
                {porteiroSummary.total > 0 
                  ? Math.round((porteiroSummary.funcionais / porteiroSummary.total) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">Taxa de Conformidade</p>
            </Card>
          </>
        )}

        {reportType === 'gerencial' && (
          <>
            <Card className="text-center">
              <p className="text-3xl font-bold text-blue-600">{occurrenceSummary.total}</p>
              <p className="text-sm text-gray-500 mt-1">Ocorrências no Período</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{escolas.length}</p>
              <p className="text-sm text-gray-500 mt-1">Unidades Monitoradas</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-green-600">{relatoriosDiarios.length}</p>
              <p className="text-sm text-gray-500 mt-1">Relatórios Enviados</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-amber-600">{avaliacoesPorteiros.length}</p>
              <p className="text-sm text-gray-500 mt-1">Avaliações Realizadas</p>
            </Card>
          </>
        )}
      </div>

      {/* Escolas com Registros */}
      {escolasComRegistros.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">Nenhum registro encontrado para o período selecionado</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {escolasComRegistros.map(esc => (
            <Card key={esc.id} padding="none">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{esc.nome}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {esc.tipo} · {esc.cameras} câmeras
                      {esc.ocorrencias.length > 0 && ` · ${esc.ocorrencias.length} ocorrência(s)`}
                      {esc.avaliacoes.length > 0 && ` · ${esc.avaliacoes.length} avaliação(ões)`}
                      {esc.relatorios.length > 0 && ` · ${esc.relatorios.length} relatório(s)`}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
                    {esc.totalRegistros} registro(s)
                  </span>
                </div>
              </div>

              {/* Ocorrências da Escola */}
              {(reportType === 'ocorrencias' || reportType === 'gerencial') && esc.ocorrencias.length > 0 && (
                <div className="border-b border-gray-100 last:border-0">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Ocorrências</p>
                  </div>
                  <DataTable
                    data={esc.ocorrencias}
                    columns={ocorrenciaColumns}
                    keyExtractor={(item) => item.id}
                    emptyMessage="Nenhuma ocorrência"
                  />
                </div>
              )}

              {/* Avaliações da Escola */}
              {(reportType === 'avaliacoes' || reportType === 'gerencial') && esc.avaliacoes.length > 0 && (
                <div className="border-b border-gray-100 last:border-0">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Avaliações de Porteiros</p>
                  </div>
                  <DataTable
                    data={esc.avaliacoes}
                    columns={avaliacaoColumns}
                    keyExtractor={(item) => item.id}
                    emptyMessage="Nenhuma avaliação"
                  />
                </div>
              )}

              {/* Relatórios Diários da Escola */}
              {(reportType === 'diario' || reportType === 'gerencial') && esc.relatorios.length > 0 && (
                <div className="border-b border-gray-100 last:border-0">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Relatórios Diários</p>
                  </div>
                  <DataTable
                    data={esc.relatorios}
                    columns={reportColumns}
                    keyExtractor={(item) => item.id}
                    emptyMessage="Nenhum relatório"
                  />
                </div>
              )}

              {esc.ocorrencias.length === 0 && esc.avaliacoes.length === 0 && esc.relatorios.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  Nenhum registro para esta unidade no período
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedDetail} onClose={() => setSelectedDetail(null)} title="Detalhes do Registro" size="lg">
        {selectedDetail && 'categoria' in selectedDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Unidade</p><p className="text-sm font-medium">{(selectedDetail as Ocorrencia).escolaNome}</p></div>
              <div><p className="text-xs text-gray-500">Tipo</p><p className="text-sm font-medium">{(selectedDetail as Ocorrencia).tipo}</p></div>
              <div><p className="text-xs text-gray-500">Ambiente</p><p className="text-sm">{(selectedDetail as Ocorrencia).ambiente}</p></div>
              <div><p className="text-xs text-gray-500">Categoria</p><p className="text-sm capitalize">{(selectedDetail as Ocorrencia).categoria}</p></div>
              <div><p className="text-xs text-gray-500">Prioridade</p><p className="text-sm capitalize">{(selectedDetail as Ocorrencia).prioridade}</p></div>
              <div><p className="text-xs text-gray-500">Data</p><p className="text-sm">{format(new Date((selectedDetail as Ocorrencia).dataAbertura), 'dd/MM/yyyy HH:mm')}</p></div>
            </div>
            <div><p className="text-xs text-gray-500 mb-1">Descrição</p><p className="text-sm bg-gray-50 p-3 rounded-lg">{(selectedDetail as Ocorrencia).descricao}</p></div>
            {(() => {
              const ch = getOcorrenciaChamado((selectedDetail as Ocorrencia).id);
              return ch?.observacoesAdmin ? (
                <div><p className="text-xs text-gray-500 mb-1">Finalização de Atendimento</p><p className="text-sm bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">{ch.observacoesAdmin}</p></div>
              ) : null;
            })()}
          </div>
        )}
        {selectedDetail && 'porteiroNome' in selectedDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Porteiro</p><p className="text-sm font-medium">{(selectedDetail as AvaliacaoPorteiro).porteiroNome}</p></div>
              <div><p className="text-xs text-gray-500">Unidade</p><p className="text-sm font-medium">{(selectedDetail as AvaliacaoPorteiro).escolaNome}</p></div>
              <div><p className="text-xs text-gray-500">Situação</p><Badge variant={(selectedDetail as AvaliacaoPorteiro).situacao === 'funcional' ? 'success' : 'danger'}>{(selectedDetail as AvaliacaoPorteiro).situacao === 'funcional' ? 'Funcional' : 'Não Funcional'}</Badge></div>
              <div><p className="text-xs text-gray-500">Técnico</p><p className="text-sm">{(selectedDetail as AvaliacaoPorteiro).tecnicoResponsavel}</p></div>
            </div>
            {(selectedDetail as AvaliacaoPorteiro).situacao === 'nao_funcional' && (selectedDetail as AvaliacaoPorteiro).motivo && (
              <div><p className="text-xs text-gray-500 mb-1">Motivos</p><div className="flex flex-wrap gap-1">{(selectedDetail as AvaliacaoPorteiro).motivo!.split(', ').map((m, i) => <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">{m}</span>)}</div></div>
            )}
            {(selectedDetail as AvaliacaoPorteiro).observacoes && (
              <div><p className="text-xs text-gray-500 mb-1">Observações</p><p className="text-sm bg-gray-50 p-3 rounded-lg">{(selectedDetail as AvaliacaoPorteiro).observacoes}</p></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;