import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Filter, Search, Mic, Square, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Select, Textarea } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Ocorrencia, CategoriaOcorrencia } from '../types';
import { categorias, ambientes, statusOcorrencia, escolas } from '../data/mockData';
import { format } from 'date-fns';

const Occurrences: React.FC = () => {
  const { ocorrencias, chamados, audios, addOcorrencia, addChamado, addAudio, addAvaliacao, addNotificacao, updateOcorrencia, updateChamado, addRelatorioDiario, currentUser } = useApp();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<Ocorrencia | null>(null);
  const [responseText, setResponseText] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    escola: '',
    status: '',
    busca: '',
  });

  // Form state
  const [form, setForm] = useState({
    escolaId: '',
    tipo: '',
    ambiente: '',
    descricao: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Porteiro evaluation (técnico tático)
  const isTatico = currentUser?.perfil === 'tecnico_tatico';
  const [avaliarPorteiro, setAvaliarPorteiro] = useState(false);
  const [porteiroNome, setPorteiroNome] = useState('');
  const [porteiroSituacao, setPorteiroSituacao] = useState<'funcional' | 'nao_funcional'>('funcional');

  // Input mode toggle
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');

  // Audio recording
  const [recording, setRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuracao, setAudioDuracao] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioDuracao(0);

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setAudioDuracao(prev => prev + 1);
      }, 1000);

      // Real-time speech recognition
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript + ' ';
            }
          }
          if (final) {
            setForm(prev => ({ ...prev, descricao: (prev.descricao + final).trim() }));
          }
        };

        recognition.onerror = () => {
          showToast('warning', 'Transcrição automática indisponível. O áudio ainda será gravado.');
        };

        recognition.start();
      } else {
        showToast('warning', 'Navegador não suporta transcrição automática. O áudio será gravado normalmente.');
      }
    } catch (err) {
      showToast('error', 'Erro ao acessar microfone. Permita o acesso ao microfone.');
    }
  }, [showToast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const removeAudio = useCallback(() => {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl(null);
    setAudioDuracao(0);
    setInputMode('text');
    audioChunksRef.current = [];
  }, [audioBlobUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered data
  const filteredData = useMemo(() => {
    return ocorrencias.filter(occ => {
      if (filters.escola && occ.escolaId !== filters.escola) return false;
      if (filters.status && occ.status !== filters.status) return false;
      if (filters.busca) {
        const searchLower = filters.busca.toLowerCase();
        return (
          occ.tipo.toLowerCase().includes(searchLower) ||
          occ.descricao.toLowerCase().includes(searchLower) ||
          occ.escolaNome?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [ocorrencias, filters]);

  // All tipos available (flattened from categorias)
  const tiposDisponiveis = useMemo(() => {
    const normal = { value: 'Normal', label: 'Normal', categoria: 'outros' as const };
    const fromCategorias = categorias.flatMap(cat => 
      cat.tipos.map(t => ({ value: t, label: t, categoria: cat.value }))
    );
    return [normal, ...fromCategorias];
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Helper to determine categoria based on tipo
  const getCategoriaFromTipo = (tipo: string): CategoriaOcorrencia => {
    for (const cat of categorias) {
      if (cat.tipos.includes(tipo)) {
        return cat.value as CategoriaOcorrencia;
      }
    }
    return 'outros';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.escolaId) newErrors.escolaId = 'Selecione a unidade escolar';
    if (!form.tipo) newErrors.tipo = 'Selecione o tipo';
    if (!form.ambiente) newErrors.ambiente = 'Selecione o ambiente';
    if (!form.descricao.trim()) newErrors.descricao = 'Descreva a ocorrência';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const escola = escolas.find(e => e.id === form.escolaId);
      const categoria = getCategoriaFromTipo(form.tipo);
      
      // Create occurrence
      const occId = addOcorrencia({
        escolaId: form.escolaId,
        escolaNome: escola?.nome,
        categoria,
        tipo: form.tipo,
        ambiente: form.ambiente,
        descricao: form.descricao,
        prioridade: 'media',
        status: 'aberta',
      });


      // Create called
      addChamado({
        ocorrenciaId: occId,
        tecnicoMonitoramento: isTatico ? '' : currentUser.nome,
        tecnicoTatico: isTatico ? currentUser.nome : undefined,
        status: 'aberto',
      });

      // Save audio if recorded
      if (audioBlobUrl) {
        fetch(audioBlobUrl)
          .then(res => res.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              addAudio({
                ocorrenciaId: occId,
                arquivoUrl: base64data,
                transcricao: form.descricao || '',
                duracao: audioDuracao,
              });
            };
            reader.readAsDataURL(blob);
          });
      }

      // Save porteiro evaluation (técnico tático)
      if (isTatico && avaliarPorteiro && porteiroNome.trim()) {
        addAvaliacao({
          escolaId: form.escolaId,
          escolaNome: escola?.nome,
          porteiroNome: porteiroNome.trim(),
          situacao: porteiroSituacao,
          tecnicoResponsavel: currentUser.nome,
        });
      }

      // Notifications
      const escolaNome = escola?.nome || 'Unidade desconhecida';
      addNotificacao({
        titulo: 'Nova ocorrência registrada',
        mensagem: `${escolaNome} - ${form.tipo}: ${form.descricao.slice(0, 60)}${form.descricao.length > 60 ? '...' : ''}`,
        tipo: form.ambiente === 'Normal' ? 'info' : 'warning',
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova ocorrência', {
          body: `${escolaNome} - ${form.tipo}`,
        });
      }

      showToast('success', 'Ocorrência registrada com sucesso!');
      setShowModal(false);
      resetForm();
    } catch (error) {
      showToast('error', 'Erro ao registrar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      escolaId: '',
      tipo: '',
      ambiente: '',
      descricao: '',
    });
    setErrors({});
    setAvaliarPorteiro(false);
    setPorteiroNome('');
    setPorteiroSituacao('funcional');
    removeAudio();
  };

  const clearFilters = () => {
    setFilters({
      escola: '',
      status: '',
      busca: '',
    });
  };

  const handleSaveResponse = async () => {
    if (!selectedOccurrence || !responseText.trim()) {
      showToast('error', 'Escreva um parecer antes de responder');
      return;
    }
    setSavingResponse(true);
    try {
      updateOcorrencia(selectedOccurrence.id, {
        status: 'finalizada',
        dataEncerramento: new Date(),
      });

      const chamado = chamados.find(c => c.ocorrenciaId === selectedOccurrence.id);
      if (chamado) {
        updateChamado(chamado.id, {
          status: 'finalizado',
          dataFinalizacao: new Date(),
          observacoesAdmin: responseText,
          encerradoPor: currentUser.nome,
        });
      }

      addRelatorioDiario({
        escolaId: selectedOccurrence.escolaId,
        escolaNome: selectedOccurrence.escolaNome,
        situacao: selectedOccurrence.prioridade === 'critica' ? 'critico' : selectedOccurrence.prioridade === 'alta' ? 'atencao' : 'normal',
        observacoes: `Parecer Administrativo - ${selectedOccurrence.tipo}: ${responseText}`,
        enviadoPor: currentUser.nome,
      });

      showToast('success', 'Resposta registrada e ocorrência finalizada');
      setSelectedOccurrence(null);
      setResponseText('');
    } finally {
      setSavingResponse(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'info' | 'warning' | 'success' | 'secondary'; label: string }> = {
      aberta: { variant: 'info', label: 'Aberta' },
      em_atendimento: { variant: 'warning', label: 'Em Atendimento' },
      finalizada: { variant: 'success', label: 'Finalizada' },
      encerrada: { variant: 'secondary', label: 'Encerrada' },
    };
    return map[status] || { variant: 'info', label: status };
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (item: Ocorrencia) => (
        <span className="font-mono text-xs text-gray-500">{item.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'escolaNome',
      header: 'Unidade',
      sortable: true,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Ocorrencia) => {
        const badge = getStatusBadge(item.status);
        return <Badge variant={badge.variant} size="sm">{badge.label}</Badge>;
      },
    },
    {
      key: 'descricao',
      header: 'Descrição relatada pelo técnico tático',
      render: (item: Ocorrencia) => (
        <span className="text-sm text-gray-600 whitespace-pre-wrap break-words max-w-xs leading-relaxed">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'finalizacao',
      header: 'Finalização de Atendimento',
      render: (item: Ocorrencia) => {
        const ch = chamados.find(c => c.ocorrenciaId === item.id);
        const texto = ch?.observacoesAdmin;
        return (
          <span className="text-sm text-gray-600 whitespace-pre-wrap break-words max-w-xs leading-relaxed">
            {texto || '-'}
          </span>
        );
      },
    },
    {
      key: 'dataAbertura',
      header: 'Data',
      sortable: true,
      render: (item: Ocorrencia) => (
        <span className="text-sm text-gray-600">
          {format(new Date(item.dataAbertura), 'dd/MM/yyyy HH:mm')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
          <p className="text-gray-500 mt-1">
            {filteredData.length} ocorrências encontradas
          </p>
        </div>
        <Button 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowModal(true)}
        >
          Nova Ocorrência
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por tipo, descrição ou escola..."
                value={filters.busca}
                onChange={(e) => setFilters(prev => ({ ...prev, busca: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button 
            variant="secondary" 
            icon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros {hasActiveFilters && `(${[filters.escola, filters.status].filter(Boolean).length})`}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Limpar
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <Select
              label="Unidade"
              value={filters.escola}
              onChange={(e) => setFilters(prev => ({ ...prev, escola: e.target.value }))}
              options={escolas.map(e => ({ value: e.id, label: e.nome }))}
              placeholder="Todas as unidades"
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              options={statusOcorrencia.map(s => ({ value: s.value, label: s.label }))}
              placeholder="Todos os status"
            />
          </div>
        )}
      </Card>

      {/* Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedOccurrence(item)}
        emptyMessage="Nenhuma ocorrência encontrada"
      />

      {/* New Occurrence Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Registrar Nova Ocorrência"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Enviar
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Unidade Escolar"
            required
            value={form.escolaId}
            onChange={(e) => handleInputChange('escolaId', e.target.value)}
            options={escolas.map(e => ({ value: e.id, label: e.nome }))}
            placeholder="Selecione a unidade"
            error={errors.escolaId}
          />
          <Select
            label="Ambiente"
            required
            value={form.ambiente}
            onChange={(e) => handleInputChange('ambiente', e.target.value)}
            options={ambientes.map(a => ({ value: a, label: a }))}
            placeholder="Selecione o ambiente"
            error={errors.ambiente}
          />
          <div className="md:col-span-2">
            <Select
              label="Tipo de Ocorrência"
              required
              value={form.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              options={tiposDisponiveis}
              placeholder="Selecione o tipo de ocorrência"
              error={errors.tipo}
            />
          </div>
          {isTatico && (
            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Avaliação do Porteiro</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">Habilitar</span>
                  <input
                    type="checkbox"
                    checked={avaliarPorteiro}
                    onChange={(e) => setAvaliarPorteiro(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
              {avaliarPorteiro && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                      Nome do Porteiro
                    </label>
                    <input
                      type="text"
                      value={porteiroNome}
                      onChange={(e) => setPorteiroNome(e.target.value)}
                      placeholder="Nome do porteiro"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                      Situação
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPorteiroSituacao('funcional')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                          porteiroSituacao === 'funcional'
                            ? 'bg-green-50 border-green-300 text-green-700 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Funcional
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorteiroSituacao('nao_funcional')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all ${
                          porteiroSituacao === 'nao_funcional'
                            ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Não Funcional
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="md:col-span-2">
            {/* Input Mode Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium text-gray-700">Descrição:</p>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => { setInputMode('text'); removeAudio(); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inputMode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Escrever
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('audio')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inputMode === 'audio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Gravar Áudio
                </button>
              </div>
            </div>

            {inputMode === 'text' ? (
              <Textarea
                required
                rows={4}
                value={form.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descreva detalhadamente a ocorrência observada..."
                error={errors.descricao}
              />
            ) : (
              <div className="space-y-3">
                {!audioBlobUrl ? (
                  <div className="flex items-center gap-3">
                    {recording ? (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="danger"
                          icon={<Square className="w-4 h-4" />}
                          onClick={stopRecording}
                        >
                          Parar Gravação
                        </Button>
                        <span className="flex items-center gap-2 text-sm text-red-600 font-medium">
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                          Gravando... {formatTime(audioDuracao)}
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        icon={<Mic className="w-4 h-4" />}
                        onClick={startRecording}
                      >
                        Iniciar Gravação
                      </Button>
                    )}
                  </div>
                ) : null}

                <Textarea
                  required
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder={recording ? 'Transcrevendo áudio...' : 'A transcrição aparecerá aqui...'}
                  error={errors.descricao}
                />

                {audioBlobUrl && (
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <audio ref={audioRef} src={audioBlobUrl} controls className="flex-1 h-9" />
                    <span className="text-xs text-gray-500 min-w-[48px]">{formatTime(audioDuracao)}</span>
                    <button
                      onClick={removeAudio}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Remover áudio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Occurrence Details Modal */}
      <Modal
        isOpen={!!selectedOccurrence}
        onClose={() => { setSelectedOccurrence(null); setResponseText(''); }}
        title="Detalhes da Ocorrência"
        size="lg"
      >
        {selectedOccurrence && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-mono text-sm">{selectedOccurrence.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Abertura</p>
                <p className="text-sm">{format(new Date(selectedOccurrence.dataAbertura), "dd/MM/yyyy 'às' HH:mm")}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unidade</p>
                <p className="text-sm font-medium">{selectedOccurrence.escolaNome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ambiente</p>
                <p className="text-sm">{selectedOccurrence.ambiente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="text-sm">{selectedOccurrence.tipo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Categoria</p>
                <p className="text-sm capitalize">{selectedOccurrence.categoria}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prioridade</p>
                <p className="text-sm capitalize">{selectedOccurrence.prioridade}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={getStatusBadge(selectedOccurrence.status).variant}>
                  {getStatusBadge(selectedOccurrence.status).label}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Descrição</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedOccurrence.descricao}</p>
            </div>

            {(() => {
              const occAudio = audios.find(a => a.ocorrenciaId === selectedOccurrence.id);
              return occAudio ? (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Áudio da Ocorrência</p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <audio src={occAudio.arquivoUrl} controls className="w-full h-9" />
                    {occAudio.transcricao && (
                      <p className="text-sm text-gray-600 italic">"{occAudio.transcricao}"</p>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {selectedOccurrence.status !== 'finalizada' && selectedOccurrence.status !== 'encerrada' && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h4 className="font-medium text-gray-900">Responder Ocorrência</h4>
                <textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Descreva o parecer administrativo sobre a ocorrência..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveResponse} loading={savingResponse}>
                    Finalizar e Registrar no Relatório
                  </Button>
                </div>
              </div>
            )}

            {selectedOccurrence.status === 'finalizada' && (
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-lg">
                  Ocorrência finalizada. Registrada no relatório.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Occurrences;