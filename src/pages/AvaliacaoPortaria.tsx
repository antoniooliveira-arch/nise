import React, { useState } from 'react';
import { ShieldCheck, ShieldOff, Plus, Building2, User, Clock, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Select, Textarea } from '../components/ui/Input';
import { AvaliacaoPorteiro } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const motivosNaoFuncional = [
  'Uso Celular',
  'Desatendo',
  'Não demonstra interesse',
  'Outros',
  'Não segue protocolos',
];

const AvaliacaoPortaria: React.FC = () => {
  const { avaliacoesPorteiros, escolas, addAvaliacao, currentUser } = useApp();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<AvaliacaoPorteiro | null>(null);
  const isTatico = currentUser.perfil === 'tecnico_tatico';

  const [form, setForm] = useState({
    escolaId: '',
    porteiroNome: '',
    situacao: 'funcional' as 'funcional' | 'nao_funcional',
    motivos: [] as string[],
    observacoes: '',
  });

  const resetForm = () => {
    setForm({ escolaId: '', porteiroNome: '', situacao: 'funcional', motivos: [], observacoes: '' });
  };

  const handleOpenNew = () => {
    resetForm();
    setShowModal(true);
  };

  const toggleMotivo = (motivo: string) => {
    setForm(prev => ({
      ...prev,
      motivos: prev.motivos.includes(motivo)
        ? prev.motivos.filter(m => m !== motivo)
        : [...prev.motivos, motivo],
    }));
  };

  const handleSave = () => {
    if (!form.escolaId || !form.porteiroNome.trim()) {
      showToast('error', 'Preencha todos os campos obrigatórios');
      return;
    }

    const escola = escolas.find(e => e.id === form.escolaId);
    addAvaliacao({
      escolaId: form.escolaId,
      escolaNome: escola?.nome,
      porteiroNome: form.porteiroNome.trim(),
      situacao: form.situacao,
      motivo: form.situacao === 'nao_funcional' ? form.motivos.join(', ') : undefined,
      observacoes: form.observacoes.trim() || undefined,
      tecnicoResponsavel: currentUser.nome,
    });

    showToast('success', 'Avaliação registrada com sucesso');
    setShowModal(false);
    resetForm();
  };

  const getSituacaoIcon = (situacao: string) => {
    return situacao === 'funcional' ? ShieldCheck : ShieldOff;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliação de Portaria</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isTatico ? 'Registre avaliações dos porteiros nas unidades' : 'Avaliações realizadas pelos técnicos táticos'}
          </p>
        </div>
        {isTatico && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={handleOpenNew}>
            Nova Avaliação
          </Button>
        )}
      </div>

      <Card>
        <div className="divide-y divide-gray-100">
          {avaliacoesPorteiros.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma avaliação registrada</p>
            </div>
          ) : (
            avaliacoesPorteiros.map(avaliacao => {
              const SituacaoIcon = getSituacaoIcon(avaliacao.situacao);
              return (
                <div
                  key={avaliacao.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(avaliacao)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        avaliacao.situacao === 'funcional'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <SituacaoIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{avaliacao.porteiroNome}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {avaliacao.escolaNome || 'Escola'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {avaliacao.tecnicoResponsavel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDistanceToNow(new Date(avaliacao.data), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        {avaliacao.situacao === 'nao_funcional' && avaliacao.motivo && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {avaliacao.motivo.split(', ').map((m, i) => (
                              <span key={i} className="inline-flex text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-md">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                      avaliacao.situacao === 'funcional'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {avaliacao.situacao === 'funcional' ? 'Funcional' : 'Não Funcional'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Avaliação de Portaria" size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Avaliação</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Unidade Escolar"
            placeholder="Selecione a escola"
            value={form.escolaId}
            onChange={e => setForm({ ...form, escolaId: e.target.value })}
            options={escolas.map(e => ({ value: e.id, label: e.nome }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Porteiro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.porteiroNome}
              onChange={e => setForm({ ...form, porteiroNome: e.target.value })}
              placeholder="Nome completo do porteiro"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Situação</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, situacao: 'funcional', motivos: [] })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.situacao === 'funcional'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mx-auto mb-1" />
                Funcional
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, situacao: 'nao_funcional' })}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.situacao === 'nao_funcional'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <ShieldOff className="w-5 h-5 mx-auto mb-1" />
                Não Funcional
              </button>
            </div>
          </div>

          {form.situacao === 'nao_funcional' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivos</label>
              <div className="space-y-2">
                {motivosNaoFuncional.map(motivo => (
                  <label
                    key={motivo}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      form.motivos.includes(motivo)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.motivos.includes(motivo)}
                      onChange={() => toggleMotivo(motivo)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">{motivo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Textarea
            label="Observações"
            placeholder="Observações adicionais..."
            value={form.observacoes}
            onChange={e => setForm({ ...form, observacoes: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalhes da Avaliação" size="md"
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Porteiro</p>
                <p className="text-sm font-medium text-gray-900">{selected.porteiroNome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unidade</p>
                <p className="text-sm font-medium text-gray-900">{selected.escolaNome || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Situação</p>
                <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                  selected.situacao === 'funcional' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selected.situacao === 'funcional' ? 'Funcional' : 'Não Funcional'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Técnico Responsável</p>
                <p className="text-sm font-medium text-gray-900">{selected.tecnicoResponsavel}</p>
              </div>
            </div>
            {selected.situacao === 'nao_funcional' && selected.motivo && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Motivos</p>
                <div className="flex flex-wrap gap-1">
                  {selected.motivo.split(', ').map((m, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-md">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {selected.observacoes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Observações</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selected.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AvaliacaoPortaria;
