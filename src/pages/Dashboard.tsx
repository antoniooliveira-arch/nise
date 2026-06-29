import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  Headphones, 
  Building2, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { ocorrencias } = useApp();

  const metrics = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const ocorrenciasHoje = ocorrencias.filter(o => new Date(o.dataAbertura) >= hoje).length;
    const chamadosAbertos = ocorrencias.filter(o => o.status === 'aberta' || o.status === 'em_atendimento').length;
    const criticas = ocorrencias.filter(o => o.prioridade === 'critica' && o.status !== 'encerrada').length;

    return { ocorrenciasHoje, ocorrenciasMes: ocorrencias.length, chamadosAbertos, criticas };
  }, [ocorrencias]);

  const chartData = useMemo(() => {
    const porCategoria: Record<string, number> = {};
    ocorrencias.forEach(o => {
      porCategoria[o.categoria] = (porCategoria[o.categoria] || 0) + 1;
    });
    
    const totalCategorias = ocorrencias.length || 1;
    const categoriaData = [
      { name: 'Segurança', value: porCategoria.seguranca || 0, color: '#DC2626', pct: Math.round(((porCategoria.seguranca || 0) / totalCategorias) * 100) },
      { name: 'Disciplina', value: porCategoria.disciplina || 0, color: '#D97706', pct: Math.round(((porCategoria.disciplina || 0) / totalCategorias) * 100) },
      { name: 'Estrutura', value: porCategoria.estrutura || 0, color: '#3B82F6', pct: Math.round(((porCategoria.estrutura || 0) / totalCategorias) * 100) },
      { name: 'Outros', value: porCategoria.outros || 0, color: '#6B7280', pct: Math.round(((porCategoria.outros || 0) / totalCategorias) * 100) },
    ];

    const porUnidade: Record<string, { nome: string; total: number; criticas: number }> = {};
    ocorrencias.forEach(o => {
      if (o.escolaNome) {
        const nomeCurto = o.escolaNome.replace(/(CEI|CEM|EM|ERM)\s/, '');
        if (!porUnidade[o.escolaId]) {
          porUnidade[o.escolaId] = { nome: nomeCurto, total: 0, criticas: 0 };
        }
        porUnidade[o.escolaId].total += 1;
        if (o.prioridade === 'critica') porUnidade[o.escolaId].criticas += 1;
      }
    });
    
    const unidadeData = Object.values(porUnidade)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const porStatus: Record<string, number> = {};
    ocorrencias.forEach(o => { porStatus[o.status] = (porStatus[o.status] || 0) + 1; });
    
    const statusData = [
      { name: 'Abertas', value: porStatus.aberta || 0, color: '#3B82F6' },
      { name: 'Em Atendimento', value: porStatus.em_atendimento || 0, color: '#D97706' },
      { name: 'Finalizadas', value: porStatus.finalizada || 0, color: '#059669' },
      { name: 'Encerradas', value: porStatus.encerrada || 0, color: '#6B7280' },
    ];

    // Últimos 7 dias
    const ultimos7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const label = format(d, 'dd/MM');
      const count = ocorrencias.filter(o => {
        const od = new Date(o.dataAbertura);
        return od >= d && od < new Date(d.getTime() + 86400000);
      }).length;
      return { dia: label, ocorrencias: count };
    });

    return { categoriaData, unidadeData, statusData, ultimos7 };
  }, [ocorrencias]);

  const recentOccurrences = useMemo(() => {
    return [...ocorrencias]
      .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
      .slice(0, 6);
  }, [ocorrencias]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-400">
              {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg shadow-blue-500/20">
          <Clock className="w-4 h-4" />
          {format(new Date(), "HH:mm")}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ocorrências Hoje', value: metrics.ocorrenciasHoje, icon: AlertTriangle, color: 'blue', change: 12 },
          { label: 'Total no Mês', value: metrics.ocorrenciasMes, icon: TrendingUp, color: 'green', change: -5 },
          { label: 'Em Aberto', value: metrics.chamadosAbertos, icon: Headphones, color: 'amber' },
          { label: 'Casos Críticos', value: metrics.criticas, icon: Building2, color: 'red' },
        ].map((m, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 ${
              m.color === 'blue' ? 'bg-blue-500/5' : m.color === 'green' ? 'bg-green-500/5' : m.color === 'amber' ? 'bg-amber-500/5' : 'bg-red-500/5'
            }`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  m.color === 'blue' ? 'bg-blue-100 text-blue-600' : m.color === 'green' ? 'bg-green-100 text-green-600' : m.color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                }`}>
                  <m.icon className="w-4 h-4" />
                </div>
                {'change' in m && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${
                    (m.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(m.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(m.change || 0)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-900">{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Categoria - Pie */}
        <Card padding="none" className="xl:col-span-2">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-900">Ocorrências por Categoria</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-center h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.categoriaData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.categoriaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, 'Ocorrências']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {chartData.categoriaData.map(item => (
                <div key={item.name} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{item.value} <span className="text-slate-400 font-normal">({item.pct}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top 8 Unidades */}
        <Card padding="none" className="xl:col-span-3">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-900">Unidades com mais Registros (Top 8)</h3>
          </div>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.unidadeData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis dataKey="nome" type="category" width={130} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any, _: any, props: any) => [
                    <span key="v">{v} ocorrência(s) <span className="text-red-500">({props.payload.criticas} críticas)</span></span>,
                    'Total'
                  ]}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Status */}
        <Card padding="none">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-900">Status</h3>
          </div>
          <div className="p-4 space-y-4">
            {chartData.statusData.map(item => {
              const pct = ocorrencias.length > 0 ? Math.round((item.value / ocorrencias.length) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{item.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-lg font-bold text-slate-900">{ocorrencias.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Últimos 7 Dias */}
        <Card padding="none" className="lg:col-span-3">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-slate-900">Últimos 7 Dias</h3>
          </div>
          <div className="p-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.ultimos7}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => [v, 'Ocorrências']}
                />
                <Area type="monotone" dataKey="ocorrencias" stroke="#3B82F6" strokeWidth={2} fill="url(#colorOcc)" dot={{ fill: '#3B82F6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recentes */}
      <Card padding="none">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Ocorrências Recentes</h3>
          <Link to="/ocorrencias" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOccurrences.map(occ => (
            <Link key={occ.id} to={`/ocorrencias?id=${occ.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    occ.prioridade === 'critica' ? 'bg-red-500' : occ.prioridade === 'alta' ? 'bg-amber-500' : occ.prioridade === 'media' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{occ.tipo}</p>
                    <p className="text-xs text-slate-400 truncate">{occ.escolaNome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={occ.status === 'encerrada' ? 'secondary' : occ.status === 'finalizada' ? 'success' : occ.status === 'em_atendimento' ? 'warning' : 'info'} size="sm">
                    {occ.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(occ.dataAbertura), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {recentOccurrences.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Nenhuma ocorrência registrada</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;