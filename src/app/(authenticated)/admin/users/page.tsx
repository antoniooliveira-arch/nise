"use client";

import { useEffect, useState, useCallback } from "react";

interface School {
  id: number;
  name: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  schoolId: number | null;
  active: boolean;
  createdAt: string;
  schoolName: string | null;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  administrador: { label: "Administrador", color: "bg-primary-100 text-primary-700" },
  tecnico: { label: "Técnico", color: "bg-emerald-100 text-emerald-700" },
  gestor: { label: "Gestor", color: "bg-amber-100 text-amber-700" },
};

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/schools"),
      ]);
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setName("");
    setPassword("");
    setRole("");
    setEditUser(null);
    setShowForm(false);
  };

  const startEdit = (user: UserItem) => {
    setEditUser(user);
    setName(user.name);
    setPassword("");
    setRole(user.role);
    setShowForm(true);
  };

  const generateUsername = (fullName: string) =>
    fullName
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "");

  const handleSubmit = async () => {
    if (!name || !role) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!editUser && !password) {
      alert("A senha é obrigatória para novos usuários.");
      return;
    }

    setSubmitting(true);
    try {
      const username = generateUsername(name);

      if (editUser) {
        const body: Record<string, unknown> = {
          id: editUser.id,
          name,
          email: username,
          role,
        };
        if (password) body.password = password;

        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          resetForm();
          fetchData();
        } else {
          const data = await res.json();
          alert(data.error || "Erro ao atualizar usuário");
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: username,
            password,
            role,
          }),
        });

        if (res.ok) {
          resetForm();
          fetchData();
        } else {
          const data = await res.json();
          alert(data.error || "Erro ao criar usuário. Talvez o nome gere um usuário duplicado.");
        }
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: UserItem) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    fetchData();
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
            Gerenciar Usuários
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Criação e administração de contas de usuário
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editUser ? "Editar Usuário" : "Novo Usuário"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha {editUser ? "(deixe vazio para manter)" : "*"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Perfil *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Selecione o perfil</option>
                <option value="administrador">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="gestor">Gestor Escolar</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            O usuário para login será gerado automaticamente a partir do nome.
          </p>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Salvando..."
                : editUser
                ? "Atualizar"
                : "Criar Usuário"}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Users Table - Desktop */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Usuário
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Perfil
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Escola
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        ROLE_LABELS[u.role]?.color || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ROLE_LABELS[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {u.schoolName || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        u.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          u.active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {u.active ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {usersList.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-700">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ROLE_LABELS[u.role]?.color || "bg-gray-100 text-gray-600"
                }`}
              >
                {ROLE_LABELS[u.role]?.label || u.role}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{u.schoolName || "Sem escola"}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(u)}
                  className="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    u.active
                      ? "text-red-600 hover:bg-red-50"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {u.active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
