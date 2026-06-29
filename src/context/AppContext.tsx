import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Escola, Usuario, Ocorrencia, Chamado, AvaliacaoPorteiro, RelatorioDiario, Audio as AudioType } from '../types';
import { escolas as initialEscolas, usuarios as initialUsuarios, ocorrencias as initialOcorrencias, chamados as initialChamados, avaliacoesPorteiros as initialAvaliacoes, relatoriosDiarios as initialRelatorios } from '../data/mockData';
import * as supabaseService from '../lib/supabaseService';

interface AppState {
  escolas: Escola[];
  usuarios: Usuario[];
  ocorrencias: Ocorrencia[];
  chamados: Chamado[];
  avaliacoesPorteiros: AvaliacaoPorteiro[];
  relatoriosDiarios: RelatorioDiario[];
  audios: AudioType[];
  notificacoes: Notificacao[];
  currentUser: Usuario;
  loading: boolean;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'success' | 'error';
  lida: boolean;
  data: Date;
}

interface AppContextType extends AppState {
  isAuthenticated: boolean;
  login: (email: string, senha: string) => boolean;
  logout: () => void;

  addEscola: (escola: Omit<Escola, 'id'>) => void;
  updateEscola: (id: string, data: Partial<Escola>) => void;

  addUsuario: (usuario: Omit<Usuario, 'id'>) => void;
  updateUsuario: (id: string, data: Partial<Usuario>) => void;

  addOcorrencia: (ocorrencia: Omit<Ocorrencia, 'id' | 'dataAbertura'>) => string;
  updateOcorrencia: (id: string, data: Partial<Ocorrencia>) => void;

  addChamado: (chamado: Omit<Chamado, 'id' | 'dataAbertura'>) => string;
  updateChamado: (id: string, data: Partial<Chamado>) => void;

  addAvaliacao: (avaliacao: Omit<AvaliacaoPorteiro, 'id' | 'data'>) => void;

  addRelatorioDiario: (relatorio: Omit<RelatorioDiario, 'id' | 'data'>) => void;

  addAudio: (audio: Omit<AudioType, 'id' | 'data'>) => string;

  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'data' | 'lida'>) => void;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;

  getEscolaById: (id: string) => Escola | undefined;
  getOcorrenciasByEscola: (escolaId: string) => Ocorrencia[];
  getChamadosByOcorrencia: (ocorrenciaId: string) => Chamado[];
  getUsuarioById: (id: string) => Usuario | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: Usuario = {
  id: 'usr-1',
  nome: 'Administrador NISE',
  email: 'nise',
  perfil: 'admin',
  status: 'ativo',
  senha: 'admin123',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [escolas, setEscolas] = useState<Escola[]>(initialEscolas);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>(initialOcorrencias);
  const [chamados, setChamados] = useState<Chamado[]>(initialChamados);
  const [avaliacoesPorteiros, setAvaliacoesPorteiros] = useState<AvaliacaoPorteiro[]>(initialAvaliacoes);
  const [relatoriosDiarios, setRelatoriosDiarios] = useState<RelatorioDiario[]>(initialRelatorios);
  const [audios, setAudios] = useState<AudioType[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadFromSupabase() {
      try {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }

        const [escolasData, usuariosData, ocorrenciasData, chamadosData, avaliacoesData, relatoriosData] =
          await Promise.all([
            supabaseService.fetchEscolas(),
            supabaseService.fetchUsuarios(),
            supabaseService.fetchOcorrencias(),
            supabaseService.fetchChamados(),
            supabaseService.fetchAvaliacoes(),
            supabaseService.fetchRelatorios(),
          ]);
        if (escolasData.length) setEscolas(escolasData);
        if (usuariosData.length) setUsuarios(usuariosData);
        if (ocorrenciasData.length) setOcorrencias(ocorrenciasData);
        if (chamadosData.length) setChamados(chamadosData);
        if (avaliacoesData.length) setAvaliacoesPorteiros(avaliacoesData);
        if (relatoriosData.length) setRelatoriosDiarios(relatoriosData);
      } catch (err) {
        console.warn('Supabase não disponível, usando dados mock:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFromSupabase();
  }, []);

  const login = useCallback((usuario: string, senha: string): boolean => {
    const user = usuarios.find(u =>
      (u.email === usuario || u.nome.toLowerCase().includes(usuario.toLowerCase())) &&
      u.senha === senha
    );
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, [usuarios]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addEscola = useCallback(async (escola: Omit<Escola, 'id'>) => {
    try {
      const created = await supabaseService.createEscola(escola);
      setEscolas(prev => [...prev, created]);
    } catch {
      const newEscola: Escola = { ...escola, id: generateId('esc') };
      setEscolas(prev => [...prev, newEscola]);
    }
  }, []);

  const updateEscola = useCallback(async (id: string, data: Partial<Escola>) => {
    try {
      await supabaseService.updateEscola(id, data);
      setEscolas(prev => prev.map(esc => esc.id === id ? { ...esc, ...data } : esc));
    } catch {
      setEscolas(prev => prev.map(esc => esc.id === id ? { ...esc, ...data } : esc));
    }
  }, []);

  const addUsuario = useCallback(async (usuario: Omit<Usuario, 'id'>) => {
    try {
      const created = await supabaseService.createUsuario(usuario);
      setUsuarios(prev => [...prev, created]);
    } catch {
      const newUsuario: Usuario = { ...usuario, id: generateId('usr') };
      setUsuarios(prev => [...prev, newUsuario]);
    }
  }, []);

  const updateUsuario = useCallback(async (id: string, data: Partial<Usuario>) => {
    try {
      await supabaseService.updateUsuario(id, data);
      setUsuarios(prev => prev.map(usr => usr.id === id ? { ...usr, ...data } : usr));
    } catch {
      setUsuarios(prev => prev.map(usr => usr.id === id ? { ...usr, ...data } : usr));
    }
  }, []);

  const addOcorrencia = useCallback((ocorrencia: Omit<Ocorrencia, 'id' | 'dataAbertura'>): string => {
    const id = generateId('occ');
    const newOcorrencia: Ocorrencia = { ...ocorrencia, id, dataAbertura: new Date() };
    setOcorrencias(prev => [newOcorrencia, ...prev]);
    supabaseService.createOcorrencia(ocorrencia).then(created => {
      setOcorrencias(prev => prev.map(o => o.id === id ? { ...o, id: created.id } : o));
    }).catch(() => {});
    return id;
  }, []);

  const updateOcorrencia = useCallback(async (id: string, data: Partial<Ocorrencia>) => {
    try {
      await supabaseService.updateOcorrencia(id, data);
      setOcorrencias(prev => prev.map(occ => occ.id === id ? { ...occ, ...data } : occ));
    } catch {
      setOcorrencias(prev => prev.map(occ => occ.id === id ? { ...occ, ...data } : occ));
    }
  }, []);

  const addChamado = useCallback((chamado: Omit<Chamado, 'id' | 'dataAbertura'>): string => {
    const id = generateId('chm');
    const newChamado: Chamado = { ...chamado, id, dataAbertura: new Date() };
    setChamados(prev => [newChamado, ...prev]);
    supabaseService.createChamado(chamado).then(created => {
      setChamados(prev => prev.map(c => c.id === id ? { ...c, id: created.id } : c));
    }).catch(() => {});
    return id;
  }, []);

  const updateChamado = useCallback(async (id: string, data: Partial<Chamado>) => {
    try {
      await supabaseService.updateChamado(id, data);
      setChamados(prev => prev.map(chm => chm.id === id ? { ...chm, ...data } : chm));
    } catch {
      setChamados(prev => prev.map(chm => chm.id === id ? { ...chm, ...data } : chm));
    }
  }, []);

  const addAvaliacao = useCallback(async (avaliacao: Omit<AvaliacaoPorteiro, 'id' | 'data'>) => {
    try {
      const created = await supabaseService.createAvaliacao(avaliacao);
      setAvaliacoesPorteiros(prev => [created, ...prev]);
    } catch {
      const newAvaliacao: AvaliacaoPorteiro = { ...avaliacao, id: generateId('avp'), data: new Date() };
      setAvaliacoesPorteiros(prev => [newAvaliacao, ...prev]);
    }
  }, []);

  const addRelatorioDiario = useCallback(async (relatorio: Omit<RelatorioDiario, 'id' | 'data'>) => {
    try {
      const created = await supabaseService.createRelatorio(relatorio);
      setRelatoriosDiarios(prev => [created, ...prev]);
    } catch {
      const newRelatorio: RelatorioDiario = { ...relatorio, id: generateId('rd'), data: new Date() };
      setRelatoriosDiarios(prev => [newRelatorio, ...prev]);
    }
  }, []);

  const addAudio = useCallback((audio: Omit<AudioType, 'id' | 'data'>): string => {
    const id = generateId('aud');
    const newAudio: AudioType = { ...audio, id, data: new Date() };
    setAudios(prev => [newAudio, ...prev]);
    return id;
  }, []);

  const addNotificacao = useCallback((n: Omit<Notificacao, 'id' | 'data' | 'lida'>) => {
    const id = generateId('not');
    const nova: Notificacao = { ...n, id, data: new Date(), lida: false };
    setNotificacoes(prev => [nova, ...prev]);

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(n.titulo, { body: n.mensagem });
    }
  }, []);

  const marcarNotificacaoLida = useCallback((id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  const marcarTodasLidas = useCallback(() => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }, []);

  const getEscolaById = useCallback((id: string) => {
    return escolas.find(esc => esc.id === id);
  }, [escolas]);

  const getOcorrenciasByEscola = useCallback((escolaId: string) => {
    return ocorrencias.filter(occ => occ.escolaId === escolaId);
  }, [ocorrencias]);

  const getChamadosByOcorrencia = useCallback((ocorrenciaId: string) => {
    return chamados.filter(chm => chm.ocorrenciaId === ocorrenciaId);
  }, [chamados]);

  const getUsuarioById = useCallback((id: string) => {
    return usuarios.find(usr => usr.id === id);
  }, [usuarios]);

  const value: AppContextType = {
    escolas,
    usuarios,
    ocorrencias,
    chamados,
    avaliacoesPorteiros,
    relatoriosDiarios,
    audios,
    notificacoes,
    currentUser: currentUser || defaultUser,
    loading,
    isAuthenticated,
    login,
    logout,
    addEscola,
    updateEscola,
    addUsuario,
    updateUsuario,
    addOcorrencia,
    updateOcorrencia,
    addChamado,
    updateChamado,
    addAvaliacao,
    addRelatorioDiario,
    addAudio,
    addNotificacao,
    marcarNotificacaoLida,
    marcarTodasLidas,
    getEscolaById,
    getOcorrenciasByEscola,
    getChamadosByOcorrencia,
    getUsuarioById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
