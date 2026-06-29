import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <Header 
        sidebarCollapsed={sidebarCollapsed} 
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      <main 
        className={`pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        } ${mobileMenuOpen ? 'md:pl-64' : 'pl-0'}`}
      >
        <div className="p-4 md:p-6 pb-20 md:pb-24">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer 
        className={`fixed bottom-0 right-0 h-16 md:h-14 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700/50 flex items-center justify-center transition-all duration-300 z-20 ${
          sidebarCollapsed ? 'md:left-20' : 'md:left-64'
        } left-0`}
      >
        <div className="flex items-center gap-2 px-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse hidden sm:block" />
          <p className="text-xs sm:text-sm text-slate-300">
            <span className="font-semibold text-blue-400">NISE</span> – Núcleo de Inteligência em Segurança Escolar
          </p>
          <span className="text-slate-600 mx-1 sm:mx-2 hidden sm:inline">|</span>
          <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">
            Desenvolvido pelo Departamento de Tecnologia SME
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;