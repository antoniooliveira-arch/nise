// Tipos do Sistema SIME

export type TipoEscola = 'CEI' | 'CEM' | 'EM' | 'ERM';
export type PerfilUsuario = 'admin' | 'tecnico_monitoramento' | 'tecnico_tatico';
export type StatusUsuario = 'ativo' | 'inativo';
export type CategoriaOcorrencia = 'seguranca' | 'disciplina' | 'estrutura' | 'outros';
export type PrioridadeOcorrencia = 'baixa' | 'media' | 'alta' | 'critica';
export type StatusOcorrencia = 'aberta' | 'em_atendimento' | 'finalizada' | 'encerrada';
export type StatusChamado = 'aberto' | 'atendido' | 'finalizado' | 'encerrado';
export type StatusPorteiro = 'funcional' | 'nao_funcional';
export type TipoRelatorio = 'diario' | 'tatico' | 'avaliacao_porteiro' | 'gerencial';
export type StatusNormalidade = 'normal' | 'atencao' | 'critico';

export interface Escola {
  id: string;
  nome: string;
  tipo: TipoEscola;
  endereco: string;
  cameras: number;
}

export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  unidades?: string[];
  senha?: string;
}

export interface Ocorrencia {
  id: string;
  escolaId: string;
  escolaNome?: string;
  categoria: CategoriaOcorrencia;
  tipo: string;
  ambiente: string;
  descricao: string;
  prioridade: PrioridadeOcorrencia;
  status: StatusOcorrencia;
  dataAbertura: Date;
  dataEncerramento?: Date;
}

export interface Chamado {
  id: string;
  ocorrenciaId: string;
  tecnicoMonitoramento: string;
  tecnicoTatico?: string;
  status: StatusChamado;
  dataAbertura: Date;
  dataAtendimento?: Date;
  dataFinalizacao?: Date;
  dataEncerramento?: Date;
  observacoesAdmin?: string;
  encerradoPor?: string;
}

export interface Relatorio {
  id: string;
  tipo: TipoRelatorio;
  escolaId?: string;
  conteudo: Record<string, unknown>;
  data: Date;
  autor: string;
}

export interface AvaliacaoPorteiro {
  id: string;
  escolaId: string;
  escolaNome?: string;
  porteiroNome: string;
  situacao: StatusPorteiro;
  motivo?: string;
  observacoes?: string;
  tecnicoResponsavel: string;
  data: Date;
}

export interface Audio {
  id: string;
  ocorrenciaId: string;
  arquivoUrl: string;
  transcricao?: string;
  duracao: number;
  data: Date;
}

export interface Encaminhamento {
  id: string;
  ocorrenciaId: string;
  administrador: string;
  destino: string;
  descricao: string;
  data: Date;
}

export interface RelatorioDiario {
  id: string;
  escolaId: string;
  escolaNome?: string;
  data: Date;
  situacao: StatusNormalidade;
  observacoes: string;
  enviadoPor: string;
}

export interface MetricData {
  label: string;
  value: number;
  change?: number;
  icon: string;
  color: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}