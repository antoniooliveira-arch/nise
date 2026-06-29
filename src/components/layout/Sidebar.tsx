import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Headphones, 
  FileText, 
  Building2, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  X,
  Menu,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { currentUser } = useApp();

  const perfil = currentUser.perfil;

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', visible: perfil === 'admin' },
    { path: '/ocorrencias', icon: AlertTriangle, label: perfil === 'tecnico_tatico' ? 'Ocorrências/Recebidas' : 'Ocorrências', visible: true },
    { path: '/chamados', icon: Headphones, label: 'Chamados', visible: true },
    { path: '/relatorios', icon: FileText, label: 'Relatórios', visible: perfil === 'admin' },
    { path: '/escolas', icon: Building2, label: 'Escolas', visible: perfil === 'admin' },
    { path: '/usuarios', icon: Users, label: 'Usuários', visible: perfil === 'admin' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações', visible: perfil === 'admin' },
    { path: '/avaliacao-portaria', icon: ShieldCheck, label: 'Avalia/Portaria', visible: perfil === 'admin' || perfil === 'tecnico_tatico' },
  ];

  const visibleItems = menuItems.filter(item => item.visible);

  const handleNavClick = () => {
    // Close mobile menu on navigation
    if (window.innerWidth < 768) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-slate-900 text-white z-50 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg shadow-lg">
              <Video className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              <h1 className="font-bold text-base md:text-lg tracking-tight">NISE</h1>
              <p className="text-[10px] md:text-xs text-slate-400 hidden lg:block">Núcleo de Inteligência em Segurança Escolar</p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${collapsed ? 'justify-center lg:justify-start' : 'justify-start'}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className={`text-sm font-medium transition-all duration-300 ${collapsed ? 'lg:hidden' : ''}`}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden md:block absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Recolher</span>
              </>
            )}
          </button>
        </div>

        {/* Stats (Desktop only, when expanded) */}
        {!collapsed && (
          <div className="hidden lg:block absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">19</p>
                  <p className="text-xs text-slate-400">Unidades</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Video className="w-3 h-3" />
                <span>300 câmeras ativas</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button (visible only on mobile) */}
      <button
        onClick={() => document.getElementById('mobile-menu-btn')?.click()}
        className="md:hidden fixed bottom-20 left-4 z-30 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        style={{ display: mobileOpen ? 'none' : 'flex' }}
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
};

export default Sidebar;