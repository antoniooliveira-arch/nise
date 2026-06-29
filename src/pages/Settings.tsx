import React, { useState } from 'react';
import { Save, Building2, Bell, Shield, Database, Mic, CheckCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    nomeMunicipio: 'Prefeitura Municipal',
    nomeSecretaria: 'Secretaria Municipal de Educação',
    nomeSistema: 'SIME',
    termoGmt: '-3',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    whatsappEnabled: false,
    soundEnabled: true,
    notificarAdmin: true,
    notificarTatico: true,
  });

  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    transcricaoAutomatica: true,
    engineTranscricao: 'whisper',
    duracaoMaxima: '60',
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    retencaoDados: '12',
    backupDiario: true,
    logAuditoria: true,
    sessaoTimeout: '30',
  });

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Building2 },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'audio', label: 'Áudio', icon: Mic },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      showToast('error', 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">
            Configurações gerais do sistema
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          loading={loading}
          icon={<Save className="w-4 h-4" />}
        >
          Salvar Alterações
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-64 flex-shrink-0">
          <Card padding="none">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Geral */}
          {activeTab === 'geral' && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <Input
                  label="Nome do Município"
                  value={generalSettings.nomeMunicipio}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, nomeMunicipio: e.target.value }))}
                />
                <Input
                  label="Nome da Secretaria"
                  value={generalSettings.nomeSecretaria}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, nomeSecretaria: e.target.value }))}
                />
                <Input
                  label="Nome do Sistema"
                  value={generalSettings.nomeSistema}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, nomeSistema: e.target.value }))}
                />
                <Select
                  label="Fuso Horário (GMT)"
                  value={generalSettings.termoGmt}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, termoGmt: e.target.value }))}
                  options={[
                    { value: '-5', label: 'GMT-5 (Brasília)' },
                    { value: '-4', label: 'GMT-4' },
                    { value: '-3', label: 'GMT-3' },
                  ]}
                />
              </div>
            </Card>
          )}

          {/* Notificações */}
          {activeTab === 'notificacoes' && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações de Notificação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Notificações por Email</p>
                    <p className="text-sm text-gray-500">Receba alertas por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Integração WhatsApp</p>
                    <p className="text-sm text-gray-500">Envio de notificações via WhatsApp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.whatsappEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, whatsappEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Som de Notificação</p>
                    <p className="text-sm text-gray-500">Reproduzir som ao receber notificação</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.soundEnabled}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Notificar Administradores</p>
                    <p className="text-sm text-gray-500">Enviar notificações para equipe administrativa</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notificarAdmin}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificarAdmin: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Notificar Técnicos Táticos</p>
                    <p className="text-sm text-gray-500">Enviar notificações para equipe tática</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notificarTatico}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, notificarTatico: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Áudio */}
          {activeTab === 'audio' && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações de Áudio</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Transcrição Automática</p>
                    <p className="text-sm text-gray-500">Transcrever áudios automaticamente usando IA</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audioSettings.transcricaoAutomatica}
                      onChange={(e) => setAudioSettings(prev => ({ ...prev, transcricaoAutomatica: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <Select
                  label="Engine de Transcrição"
                  value={audioSettings.engineTranscricao}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, engineTranscricao: e.target.value }))}
                  options={[
                    { value: 'whisper', label: 'OpenAI Whisper' },
                    { value: 'google', label: 'Google Speech-to-Text' },
                  ]}
                  disabled={!audioSettings.transcricaoAutomatica}
                />

                <Select
                  label="Duração Máxima de Gravação (segundos)"
                  value={audioSettings.duracaoMaxima}
                  onChange={(e) => setAudioSettings(prev => ({ ...prev, duracaoMaxima: e.target.value }))}
                  options={[
                    { value: '30', label: '30 segundos' },
                    { value: '60', label: '60 segundos' },
                    { value: '120', label: '120 segundos' },
                    { value: '300', label: '5 minutos' },
                  ]}
                />
              </div>
            </Card>
          )}

          {/* Segurança */}
          {activeTab === 'seguranca' && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações de Segurança</h3>
              <div className="space-y-4">
                <Select
                  label="Retenção de Dados (meses)"
                  value={securitySettings.retencaoDados}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, retencaoDados: e.target.value }))}
                  options={[
                    { value: '6', label: '6 meses' },
                    { value: '12', label: '12 meses' },
                    { value: '24', label: '24 meses' },
                    { value: '36', label: '36 meses' },
                  ]}
                />

                <Select
                  label="Timeout de Sessão (minutos)"
                  value={securitySettings.sessaoTimeout}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessaoTimeout: e.target.value }))}
                  options={[
                    { value: '15', label: '15 minutos' },
                    { value: '30', label: '30 minutos' },
                    { value: '60', label: '1 hora' },
                    { value: '120', label: '2 horas' },
                  ]}
                />

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Log de Auditoria</p>
                    <p className="text-sm text-gray-500">Registrar todas as ações dos usuários</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.logAuditoria}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, logAuditoria: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Configurações de Backup</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Backup Diário Automático</p>
                    <p className="text-sm text-gray-500">Realizar backup automático todos os dias às 3h</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.backupDiario}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, backupDiario: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Último Backup</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Realizado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                      </p>
                      <p className="text-sm text-blue-700">
                        Status: <span className="font-medium">Concluído com sucesso</span>
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="secondary" className="w-full">
                  Realizar Backup Agora
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;