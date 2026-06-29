import React, { useState } from 'react';
import { Plus, Edit, UserX, UserCheck, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { Usuario, PerfilUsuario } from '../types';

const Users: React.FC = () => {
  const { usuarios, addUsuario, updateUsuario } = useApp();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    nome: '',
    perfil: '' as PerfilUsuario | '',
    status: 'ativo' as 'ativo' | 'inativo',
    senha: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredUsers = usuarios.filter(usr => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return usr.nome.toLowerCase().includes(searchLower);
  });

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!form.perfil) newErrors.perfil = 'Selecione o perfil';
    if (!editingUser && !form.senha.trim()) newErrors.senha = 'Senha é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (editingUser) {
        updateUsuario(editingUser.id, {
          nome: form.nome,
          perfil: form.perfil as PerfilUsuario,
          status: form.status,
          ...(form.senha ? { senha: form.senha } : {}),
        });
        showToast('success', 'Usuário atualizado com sucesso!');
      } else {
        addUsuario({
          nome: form.nome,
          email: `${form.nome.toLowerCase().replace(/\s+/g, '.')}@nise.seguranca.br`,
          perfil: form.perfil as PerfilUsuario,
          status: form.status,
          senha: form.senha,
        });
        showToast('success', 'Usuário criado com sucesso!');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      showToast('error', 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setForm({
      nome: user.nome,
      perfil: user.perfil,
      status: user.status,
      senha: '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = (user: Usuario) => {
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    updateUsuario(user.id, { status: newStatus });
    showToast('success', `Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
  };

  const resetForm = () => {
    setForm({ nome: '', perfil: '', status: 'ativo', senha: '' });
    setErrors({});
    setEditingUser(null);
  };

  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      tecnico_monitoramento: 'Técnico de Monitoramento',
      tecnico_tatico: 'Técnico Tático',
    };
    return labels[perfil] || perfil;
  };

  const getPerfilBadge = (perfil: string) => {
    const variants: Record<string, 'info' | 'warning' | 'success'> = {
      admin: 'info',
      tecnico_monitoramento: 'warning',
      tecnico_tatico: 'success',
    };
    return variants[perfil] || 'info';
  };

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (item: Usuario) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
            {item.nome.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.nome}</p>
            <p className="text-xs text-gray-500">@{item.nome.toLowerCase().replace(/\s+/g, '.').substring(0, 20)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'perfil',
      header: 'Perfil',
      render: (item: Usuario) => (
        <Badge variant={getPerfilBadge(item.perfil)} size="sm">
          {getPerfilLabel(item.perfil)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Usuario) => (
        <Badge variant={item.status === 'ativo' ? 'success' : 'secondary'} size="sm">
          {item.status === 'ativo' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (item: Usuario) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
            className={`p-1.5 rounded transition-colors ${
              item.status === 'ativo' 
                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            }`}
            title={item.status === 'ativo' ? 'Desativar' : 'Ativar'}
          >
            {item.status === 'ativo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    admins: usuarios.filter(u => u.perfil === 'admin').length,
    tecnicos: usuarios.filter(u => u.perfil === 'tecnico_monitoramento' || u.perfil === 'tecnico_tatico').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">
            Gestão de usuários e permissões do sistema
          </p>
        </div>
        <Button 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total de Usuários</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.admins}</p>
          <p className="text-sm text-gray-500">Administradores</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-600">{stats.tecnicos}</p>
          <p className="text-sm text-gray-500">Técnicos</p>
        </Card>
      </div>

      {/* Search */}
      <Card padding="sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum usuário encontrado"
      />

      {/* User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome Completo"
            required
            value={form.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Digite o nome completo"
            error={errors.nome}
          />
          <Select
            label="Perfil"
            required
            value={form.perfil}
            onChange={(e) => handleInputChange('perfil', e.target.value)}
            options={[
              { value: 'admin', label: 'Administrador' },
              { value: 'tecnico_monitoramento', label: 'Técnico de Monitoramento' },
              { value: 'tecnico_tatico', label: 'Técnico Tático' },
            ]}
            placeholder="Selecione o perfil"
            error={errors.perfil}
          />
          <Input
            label="Senha"
            type="password"
            value={form.senha}
            onChange={(e) => handleInputChange('senha', e.target.value)}
            placeholder="Digite a senha de acesso"
            error={errors.senha}
          />
          {editingUser && (
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Users;