import React, { useState } from 'react';
import { MapPin, Video, AlertTriangle, Clock, Edit2, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Escola } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Schools: React.FC = () => {
  const { escolas, ocorrencias, updateEscola } = useApp();
  const { showToast } = useToast();
  const [selectedSchool, setSelectedSchool] = useState<Escola | null>(null);
  const [editingCameras, setEditingCameras] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState(false);
  const [cameraValue, setCameraValue] = useState('');
  const [enderecoValue, setEnderecoValue] = useState('');

  const totalCameras = escolas.reduce((sum, e) => sum + e.cameras, 0);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      CEI: 'Centro de Educação Infantil',
      CEM: 'Centro Educacional Municipal',
      EM: 'Escola Municipal',
      ERM: 'Escola Rural Municipal',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
      CEI: 'info',
      CEM: 'warning',
      EM: 'success',
      ERM: 'secondary',
    };
    return colors[tipo] || 'info';
  };

  const getSchoolStats = (escolaId: string) => {
    const schoolOccs = ocorrencias.filter(o => o.escolaId === escolaId);
    const abertas = schoolOccs.filter(o => o.status === 'aberta' || o.status === 'em_atendimento').length;
    const criticas = schoolOccs.filter(o => o.prioridade === 'critica' && o.status !== 'encerrada').length;
    return { total: schoolOccs.length, abertas, criticas };
  };

  const handleStartEditCameras = () => {
    if (selectedSchool) {
      setCameraValue(String(selectedSchool.cameras));
      setEditingCameras(true);
    }
  };

  const handleSaveCameras = () => {
    if (!selectedSchool) return;
    const num = parseInt(cameraValue, 10);
    if (isNaN(num) || num < 0 || num > 50) {
      showToast('error', 'Informe um valor válido entre 0 e 50');
      return;
    }
    updateEscola(selectedSchool.id, { cameras: num });
    setSelectedSchool(prev => prev ? { ...prev, cameras: num } : null);
    setEditingCameras(false);
    showToast('success', 'Quantidade de câmeras atualizada!');
  };

  const handleCancelEditCameras = () => {
    setEditingCameras(false);
    setCameraValue('');
  };

  const handleStartEditEndereco = () => {
    if (selectedSchool) {
      setEnderecoValue(selectedSchool.endereco);
      setEditingEndereco(true);
    }
  };

  const handleSaveEndereco = () => {
    if (!selectedSchool || !enderecoValue.trim()) {
      showToast('error', 'Informe um endereço válido');
      return;
    }
    updateEscola(selectedSchool.id, { endereco: enderecoValue.trim() });
    setSelectedSchool(prev => prev ? { ...prev, endereco: enderecoValue.trim() } : null);
    setEditingEndereco(false);
    showToast('success', 'Endereço atualizado!');
  };

  const handleCancelEditEndereco = () => {
    setEditingEndereco(false);
    setEnderecoValue('');
  };

  // Group schools by type
  const schoolsByType = {
    CEI: escolas.filter(e => e.tipo === 'CEI'),
    CEM: escolas.filter(e => e.tipo === 'CEM'),
    EM: escolas.filter(e => e.tipo === 'EM'),
    ERM: escolas.filter(e => e.tipo === 'ERM'),
  };

  const SchoolCard: React.FC<{ escola: Escola }> = ({ escola }) => {
    const stats = getSchoolStats(escola.id);
    const recentOcc = ocorrencias
      .filter(o => o.escolaId === escola.id)
      .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())[0];

    return (
      <Card 
        hover 
        className="cursor-pointer"
        onClick={() => { setSelectedSchool(escola); setEditingCameras(false); setEditingEndereco(false); }}
      >
        <div className="flex items-start justify-between mb-3">
          <Badge variant={getTipoColor(escola.tipo)}>
            {escola.tipo}
          </Badge>
          {stats.criticas > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-1">{escola.nome}</h3>
        
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{escola.endereco}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Video className="w-4 h-4 text-gray-400" />
            <span>{escola.cameras} câmeras</span>
          </div>
        </div>

        {recentOcc && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Última ocorrência: {formatDistanceToNow(new Date(recentOcc.dataAbertura), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        )}

        {stats.abertas > 0 && (
          <div className="mt-2">
            <div className="flex gap-1">
              {Array.from({ length: Math.min(stats.abertas, 3) }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-amber-500" />
              ))}
              {stats.abertas > 3 && (
                <span className="text-xs text-amber-600 ml-1">+{stats.abertas - 3}</span>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades Escolares</h1>
          <p className="text-gray-500 mt-1">
            {escolas.length} unidades cadastradas • {totalCameras} câmeras ativas
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">9</p>
          <p className="text-sm text-gray-500">CEI</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">2</p>
          <p className="text-sm text-gray-500">CEM</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">3</p>
          <p className="text-sm text-gray-500">EM</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-slate-600">5</p>
          <p className="text-sm text-gray-500">ERM</p>
        </Card>
      </div>

      {/* CEI */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Badge variant="info">CEI</Badge>
          Centros de Educação Infantil
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolsByType.CEI.map(escola => (
            <SchoolCard key={escola.id} escola={escola} />
          ))}
        </div>
      </div>

      {/* CEM */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Badge variant="warning">CEM</Badge>
          Centros Educacionais Municipais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolsByType.CEM.map(escola => (
            <SchoolCard key={escola.id} escola={escola} />
          ))}
        </div>
      </div>

      {/* EM */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Badge variant="success">EM</Badge>
          Escolas Municipais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolsByType.EM.map(escola => (
            <SchoolCard key={escola.id} escola={escola} />
          ))}
        </div>
      </div>

      {/* ERM */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Badge variant="secondary">ERM</Badge>
          Escolas Rurais Municipais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolsByType.ERM.map(escola => (
            <SchoolCard key={escola.id} escola={escola} />
          ))}
        </div>
      </div>

      {/* School Details Modal */}
      <Modal
        isOpen={!!selectedSchool}
        onClose={() => { setSelectedSchool(null); setEditingCameras(false); setEditingEndereco(false); }}
        title={selectedSchool?.nome || ''}
        size="lg"
      >
        {selectedSchool && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={getTipoColor(selectedSchool.tipo)}>
                {getTipoLabel(selectedSchool.tipo)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Endereço</p>
                  {!editingEndereco && (
                    <button
                      onClick={handleStartEditEndereco}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  )}
                </div>
                {!editingEndereco ? (
                  <p className="text-sm font-medium">{selectedSchool.endereco}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={enderecoValue}
                        onChange={(e) => setEnderecoValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEndereco();
                          if (e.key === 'Escape') handleCancelEditEndereco();
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSaveEndereco}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditEndereco}
                      className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">Câmeras Instaladas</p>
                  {!editingCameras && (
                    <button
                      onClick={handleStartEditCameras}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  )}
                </div>

                {!editingCameras ? (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    <span className="text-xl font-bold text-slate-900">{selectedSchool.cameras}</span>
                    <span className="text-sm text-gray-500">câmeras</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={cameraValue}
                        onChange={(e) => setCameraValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCameras();
                          if (e.key === 'Escape') handleCancelEditCameras();
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSaveCameras}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEditCameras}
                      className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card className="text-center bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{getSchoolStats(selectedSchool.id).total}</p>
                <p className="text-xs text-gray-500">Total Ocorrências</p>
              </Card>
              <Card className="text-center bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{getSchoolStats(selectedSchool.id).abertas}</p>
                <p className="text-xs text-gray-500">Em Aberto</p>
              </Card>
              <Card className="text-center bg-red-50">
                <p className="text-2xl font-bold text-red-600">{getSchoolStats(selectedSchool.id).criticas}</p>
                <p className="text-xs text-gray-500">Críticas</p>
              </Card>
            </div>

            {/* Recent Occurrences */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Ocorrências Recentes</h4>
              <div className="space-y-2">
                {ocorrencias
                  .filter(o => o.escolaId === selectedSchool.id)
                  .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
                  .slice(0, 5)
                  .map(occ => (
                    <div key={occ.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{occ.tipo}</p>
                        <p className="text-xs text-gray-500">{occ.ambiente}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            occ.status === 'encerrada' ? 'success' :
                            occ.status === 'finalizada' ? 'success' :
                            occ.status === 'em_atendimento' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {occ.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(occ.dataAbertura), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                {ocorrencias.filter(o => o.escolaId === selectedSchool.id).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhuma ocorrência registrada</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Schools;