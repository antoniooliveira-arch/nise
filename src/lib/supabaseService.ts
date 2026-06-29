import { supabase } from './supabase';
import type {
  Escola, Usuario, Ocorrencia, Chamado,
  AvaliacaoPorteiro, RelatorioDiario,
} from '../types';

// Mapeamento de colunas snake_case para camelCase
const mapEscola = (row: any): Escola => ({
  id: row.id,
  nome: row.nome,
  tipo: row.tipo,
  endereco: row.endereco,
  cameras: row.cameras,
});

const mapUsuario = (row: any): Usuario => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  perfil: row.perfil,
  status: row.status,
  unidades: row.unidades,
  senha: row.senha,
});

const mapOcorrencia = (row: any): Ocorrencia => ({
  id: row.id,
  escolaId: row.escola_id,
  escolaNome: row.escola_nome,
  categoria: row.categoria,
  tipo: row.tipo,
  ambiente: row.ambiente,
  descricao: row.descricao,
  prioridade: row.prioridade,
  status: row.status,
  dataAbertura: new Date(row.data_abertura),
  dataEncerramento: row.data_encerramento ? new Date(row.data_encerramento) : undefined,
});

const mapChamado = (row: any): Chamado => ({
  id: row.id,
  ocorrenciaId: row.ocorrencia_id,
  tecnicoMonitoramento: row.tecnico_monitoramento,
  tecnicoTatico: row.tecnico_tatico,
  status: row.status,
  dataAbertura: new Date(row.data_abertura),
  dataAtendimento: row.data_atendimento ? new Date(row.data_atendimento) : undefined,
  dataFinalizacao: row.data_finalizacao ? new Date(row.data_finalizacao) : undefined,
  dataEncerramento: row.data_encerramento ? new Date(row.data_encerramento) : undefined,
  observacoesAdmin: row.observacoes_admin,
  encerradoPor: row.encerrado_por,
});

const mapAvaliacao = (row: any): AvaliacaoPorteiro => ({
  id: row.id,
  escolaId: row.escola_id,
  escolaNome: row.escola_nome,
  porteiroNome: row.porteiro_nome,
  situacao: row.situacao,
  motivo: row.motivo,
  observacoes: row.observacoes,
  tecnicoResponsavel: row.tecnico_responsavel,
  data: new Date(row.data),
});

const mapRelatorio = (row: any): RelatorioDiario => ({
  id: row.id,
  escolaId: row.escola_id,
  escolaNome: row.escola_nome,
  data: new Date(row.data),
  situacao: row.situacao,
  observacoes: row.observacoes,
  enviadoPor: row.enviado_por,
});

// ============================
// ESCOLAS
// ============================
export async function fetchEscolas(): Promise<Escola[]> {
  const { data, error } = await supabase.from('escolas').select('*').order('nome');
  if (error) throw error;
  return (data || []).map(mapEscola);
}

export async function createEscola(escola: Omit<Escola, 'id'>): Promise<Escola> {
  const { data, error } = await supabase
    .from('escolas')
    .insert({ nome: escola.nome, tipo: escola.tipo, endereco: escola.endereco, cameras: escola.cameras })
    .select()
    .single();
  if (error) throw error;
  return mapEscola(data);
}

export async function updateEscola(id: string, data: Partial<Escola>): Promise<void> {
  const updates: any = {};
  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.tipo !== undefined) updates.tipo = data.tipo;
  if (data.endereco !== undefined) updates.endereco = data.endereco;
  if (data.cameras !== undefined) updates.cameras = data.cameras;
  const { error } = await supabase.from('escolas').update(updates).eq('id', id);
  if (error) throw error;
}

// ============================
// USUÁRIOS
// ============================
export async function fetchUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome');
  if (error) throw error;
  return (data || []).map(mapUsuario);
}

export async function createUsuario(usuario: Omit<Usuario, 'id'>): Promise<Usuario> {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      status: usuario.status,
      unidades: usuario.unidades,
      senha: usuario.senha,
    })
    .select()
    .single();
  if (error) throw error;
  return mapUsuario(data);
}

export async function updateUsuario(id: string, data: Partial<Usuario>): Promise<void> {
  const updates: any = {};
  if (data.nome !== undefined) updates.nome = data.nome;
  if (data.email !== undefined) updates.email = data.email;
  if (data.perfil !== undefined) updates.perfil = data.perfil;
  if (data.status !== undefined) updates.status = data.status;
  if (data.unidades !== undefined) updates.unidades = data.unidades;
  if (data.senha !== undefined) updates.senha = data.senha;
  const { error } = await supabase.from('usuarios').update(updates).eq('id', id);
  if (error) throw error;
}

// ============================
// OCORRÊNCIAS
// ============================
export async function fetchOcorrencias(): Promise<Ocorrencia[]> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .select('*, escolas!inner(nome)')
    .order('data_abertura', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...mapOcorrencia(row),
    escolaNome: row.escolas?.nome,
  }));
}

export async function createOcorrencia(ocorrencia: Omit<Ocorrencia, 'id' | 'dataAbertura'>): Promise<Ocorrencia> {
  const { data, error } = await supabase
    .from('ocorrencias')
    .insert({
      escola_id: ocorrencia.escolaId,
      categoria: ocorrencia.categoria,
      tipo: ocorrencia.tipo,
      ambiente: ocorrencia.ambiente,
      descricao: ocorrencia.descricao,
      prioridade: ocorrencia.prioridade,
      status: ocorrencia.status || 'aberta',
      data_abertura: new Date().toISOString(),
    })
    .select('*, escolas!inner(nome)')
    .single();
  if (error) throw error;
  return {
    ...mapOcorrencia(data),
    escolaNome: (data as any).escolas?.nome,
  };
}

export async function updateOcorrencia(id: string, data: Partial<Ocorrencia>): Promise<void> {
  const updates: any = {};
  if (data.escolaId !== undefined) updates.escola_id = data.escolaId;
  if (data.categoria !== undefined) updates.categoria = data.categoria;
  if (data.tipo !== undefined) updates.tipo = data.tipo;
  if (data.ambiente !== undefined) updates.ambiente = data.ambiente;
  if (data.descricao !== undefined) updates.descricao = data.descricao;
  if (data.prioridade !== undefined) updates.prioridade = data.prioridade;
  if (data.status !== undefined) updates.status = data.status;
  if (data.dataEncerramento !== undefined) updates.data_encerramento = data.dataEncerramento.toISOString();
  const { error } = await supabase.from('ocorrencias').update(updates).eq('id', id);
  if (error) throw error;
}

// ============================
// CHAMADOS
// ============================
export async function fetchChamados(): Promise<Chamado[]> {
  const { data, error } = await supabase.from('chamados').select('*').order('data_abertura', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapChamado);
}

export async function createChamado(chamado: Omit<Chamado, 'id' | 'dataAbertura'>): Promise<Chamado> {
  const { data, error } = await supabase
    .from('chamados')
    .insert({
      ocorrencia_id: chamado.ocorrenciaId,
      tecnico_monitoramento: chamado.tecnicoMonitoramento,
      tecnico_tatico: chamado.tecnicoTatico,
      status: chamado.status || 'aberto',
      data_abertura: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return mapChamado(data);
}

export async function updateChamado(id: string, data: Partial<Chamado>): Promise<void> {
  const updates: any = {};
  if (data.ocorrenciaId !== undefined) updates.ocorrencia_id = data.ocorrenciaId;
  if (data.tecnicoMonitoramento !== undefined) updates.tecnico_monitoramento = data.tecnicoMonitoramento;
  if (data.tecnicoTatico !== undefined) updates.tecnico_tatico = data.tecnicoTatico;
  if (data.status !== undefined) updates.status = data.status;
  if (data.dataAtendimento !== undefined) updates.data_atendimento = data.dataAtendimento.toISOString();
  if (data.dataFinalizacao !== undefined) updates.data_finalizacao = data.dataFinalizacao.toISOString();
  if (data.dataEncerramento !== undefined) updates.data_encerramento = data.dataEncerramento.toISOString();
  if (data.observacoesAdmin !== undefined) updates.observacoes_admin = data.observacoesAdmin;
  if (data.encerradoPor !== undefined) updates.encerrado_por = data.encerradoPor;
  const { error } = await supabase.from('chamados').update(updates).eq('id', id);
  if (error) throw error;
}

// ============================
// AVALIAÇÕES DE PORTEIROS
// ============================
export async function fetchAvaliacoes(): Promise<AvaliacaoPorteiro[]> {
  const { data, error } = await supabase
    .from('avaliacoes_porteiros')
    .select('*, escolas!inner(nome)')
    .order('data', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...mapAvaliacao(row),
    escolaNome: row.escolas?.nome,
  }));
}

export async function createAvaliacao(avaliacao: Omit<AvaliacaoPorteiro, 'id' | 'data'>): Promise<AvaliacaoPorteiro> {
  const { data, error } = await supabase
    .from('avaliacoes_porteiros')
    .insert({
      escola_id: avaliacao.escolaId,
      porteiro_nome: avaliacao.porteiroNome,
      situacao: avaliacao.situacao,
      motivo: avaliacao.motivo,
      observacoes: avaliacao.observacoes,
      tecnico_responsavel: avaliacao.tecnicoResponsavel,
      data: new Date().toISOString(),
    })
    .select('*, escolas!inner(nome)')
    .single();
  if (error) throw error;
  return {
    ...mapAvaliacao(data),
    escolaNome: (data as any).escolas?.nome,
  };
}

// ============================
// RELATÓRIOS DIÁRIOS
// ============================
export async function fetchRelatorios(): Promise<RelatorioDiario[]> {
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .select('*, escolas!inner(nome)')
    .order('data', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...mapRelatorio(row),
    escolaNome: row.escolas?.nome,
  }));
}

export async function createRelatorio(relatorio: Omit<RelatorioDiario, 'id' | 'data'>): Promise<RelatorioDiario> {
  const { data, error } = await supabase
    .from('relatorios_diarios')
    .insert({
      escola_id: relatorio.escolaId,
      situacao: relatorio.situacao,
      observacoes: relatorio.observacoes,
      enviado_por: relatorio.enviadoPor,
      data: new Date().toISOString(),
    })
    .select('*, escolas!inner(nome)')
    .single();
  if (error) throw error;
  return {
    ...mapRelatorio(data),
    escolaNome: (data as any).escolas?.nome,
  };
}
