import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Menu, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onMobileMenuToggle }) => {
  const { currentUser, notificacoes, marcarNotificacaoLida, marcarTodasLidas, logout } = useApp();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login', { replace: true });
  };


  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      tecnico_monitoramento: 'Técnico de Monitoramento',
      tecnico_tatico: 'Técnico Tático',
    };
    return labels[perfil] || perfil;
  };

  const unreadCount = notificacoesNaoLidas.length;

  return (
    <header 
      className={`fixed top-0 right-0 h-16 md:h-16 bg-white border-b border-gray-200 shadow-sm z-30 transition-all duration-300 ${
        sidebarCollapsed ? 'md:left-20 left-0' : 'md:left-64 left-0'
      } left-0`}
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ocorrências, escolas, relatórios..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={marcarTodasLidas} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Marcar todas lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notificacoes.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => marcarNotificacaoLida(notif.id)}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 cursor-pointer ${!notif.lida ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.lida && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                            )}
                            <div className={notif.lida ? 'ml-5' : ''}>
                              <div className="flex items-center gap-2">
                                {getNotificationIcon(notif.tipo)}
                                <p className="text-sm font-medium text-gray-900">{notif.titulo}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{notif.mensagem}</p>
                              <p className="text-xs text-gray-400 mt-1">{format(new Date(notif.data), 'HH:mm')}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {currentUser.nome.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{currentUser.nome}</p>
                <p className="text-xs text-gray-500">{getPerfilLabel(currentUser.perfil)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{currentUser.nome}</p>
                    <p className="text-xs text-gray-500">{getPerfilLabel(currentUser.perfil)}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;