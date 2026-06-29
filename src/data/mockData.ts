import { Escola, Usuario, Ocorrencia, Chamado, AvaliacaoPorteiro, RelatorioDiario } from '../types';

// Escolas do sistema
export const escolas: Escola[] = [
  // CEI - Centros de Educação Infantil
  { id: 'cei-1', nome: 'CEI Luiz Felipe', tipo: 'CEI', endereco: 'Rua das Flores, 123 - Centro', cameras: 16 },
  { id: 'cei-2', nome: 'CEI São Cristóvão', tipo: 'CEI', endereco: 'Av. Brasil, 456 - São Cristóvão', cameras: 18 },
  { id: 'cei-3', nome: 'CEI Arco Íris', tipo: 'CEI', endereco: 'Rua do Arco, 789 - Jardim das Cores', cameras: 14 },
  { id: 'cei-4', nome: 'CEI Bruno Leonardo', tipo: 'CEI', endereco: 'Rua dos Artistas, 321 - Vila Nova', cameras: 16 },
  { id: 'cei-5', nome: 'CEI Dom Franco', tipo: 'CEI', endereco: 'Av. Monsenhor, 654 - Centro', cameras: 18 },
  { id: 'cei-6', nome: 'CEI Menino Jesus', tipo: 'CEI', endereco: 'Rua da Paz, 987 - Bairro Alto', cameras: 14 },
  { id: 'cei-7', nome: 'CEI Nosso Lar', tipo: 'CEI', endereco: 'Rua da Esperança, 147 - Conjunto Habitat', cameras: 16 },
  { id: 'cei-8', nome: 'CEI Vasco Papa', tipo: 'CEI', endereco: 'Rua do Esporte, 258 - Vila Athletic', cameras: 18 },
  { id: 'cei-9', nome: 'CEI Criança Feliz', tipo: 'CEI', endereco: 'Av. da Alegria, 369 - Parque Infantil', cameras: 14 },
  // CEM - Centros Educacionais Municipais
  { id: 'cem-1', nome: 'CEM Guilherme', tipo: 'CEM', endereco: 'Rua das Escolas, 111 - Centro', cameras: 22 },
  { id: 'cem-2', nome: 'CEM Orlando Pereira', tipo: 'CEM', endereco: 'Av. da Educação, 222 - Jardim Central', cameras: 24 },
  // EM - Escolas Municipais
  { id: 'em-1', nome: 'EM Maria Hilda', tipo: 'EM', endereco: 'Rua Professoras, 333 - Vila dos Professores', cameras: 20 },
  { id: 'em-2', nome: 'EM Paulo Freire', tipo: 'EM', endereco: 'Av. do Conhecimento, 444 - Bairro Académico', cameras: 22 },
  { id: 'em-3', nome: 'EM José Anchieta', tipo: 'EM', endereco: 'Rua São José, 555 - Centro Histórico', cameras: 18 },
  // ERM - Escolas Rurais Municipais
  { id: 'erm-1', nome: 'ERM Álvares de Azevedo', tipo: 'ERM', endereco: 'Estrada Rural, km 15 - Zona Rural', cameras: 10 },
  { id: 'erm-2', nome: 'ERM Cora Coralina', tipo: 'ERM', endereco: 'Estrada Rural, km 22 - Comunidade do Brejo', cameras: 8 },
  { id: 'erm-3', nome: 'ERM Euclides Cunha', tipo: 'ERM', endereco: 'Estrada Rural, km 35 - Assentamento', cameras: 10 },
  { id: 'erm-4', nome: 'ERM Osvaldo Cruz', tipo: 'ERM', endereco: 'Estrada Rural, km 48 - Comunidade São Francisco', cameras: 8 },
  { id: 'erm-5', nome: 'ERM Vinícius de Moraes', tipo: 'ERM', endereco: 'Estrada Rural, km 12 - Sitio dos Ipês', cameras: 10 },
];

// Usuários do sistema
export const usuarios: Usuario[] = [
  { id: 'usr-1', nome: 'Administrador NISE', email: 'nise', perfil: 'admin', status: 'ativo', senha: 'admin123' },
];

// Helper para gerar datas
const diasAtras = (dias: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - dias);
  return date;
};

// Ocorrências geradas
export const ocorrencias: Ocorrencia[] = [];

// Chamados
export const chamados: Chamado[] = [];

// Avaliações de Porteiros
export const avaliacoesPorteiros: AvaliacaoPorteiro[] = [];

// Relatórios Diários
export const relatoriosDiarios: RelatorioDiario[] = [
  {
    id: 'rd-001',
    escolaId: 'cei-1',
    escolaNome: 'CEI Luiz Felipe',
    data: new Date(),
    situacao: 'normal',
    observacoes: 'Dia transcorreu normalmente. Atividades pedagógicas realizadas sem intercorrências.',
    enviadoPor: 'Ana Oliveira',
  },
  {
    id: 'rd-002',
    escolaId: 'cem-1',
    escolaNome: 'CEM Guilherme',
    data: new Date(),
    situacao: 'atencao',
    observacoes: 'Manutenção necessária no portão principal. Equipe de manutenção já solicitada.',
    enviadoPor: 'Carlos Silva',
  },
  {
    id: 'rd-003',
    escolaId: 'em-2',
    escolaNome: 'EM Paulo Freire',
    data: new Date(),
    situacao: 'normal',
    observacoes: 'Dia de aula normal. Evento cultural realizado no período da tarde.',
    enviadoPor: 'Fernanda Lima',
  },
  {
    id: 'rd-004',
    escolaId: 'erm-1',
    escolaNome: 'ERM Álvares de Azevedo',
    data: diasAtras(1),
    situacao: 'critico',
    observacoes: 'Câmera com defeito. Registro de ocorrência para manutenção.',
    enviadoPor: 'Lucia Ferreira',
  },
  {
    id: 'rd-005',
    escolaId: 'cei-2',
    escolaNome: 'CEI São Cristóvão',
    data: diasAtras(1),
    situacao: 'normal',
    observacoes: 'Todas as atividades transcorreram dentro da normalidade.',
    enviadoPor: 'Ana Oliveira',
  },
];

// Opções para formulários
export const categorias = [
  { value: 'seguranca', label: 'Segurança', tipos: ['Briga', 'Bullying', 'Evasão escolar', 'Invasão', 'Acesso não autorizado'] },
  { value: 'disciplina', label: 'Disciplina', tipos: ['Uso indevido de celular', 'Comportamento inadequado', 'Desrespeito às normas'] },
  { value: 'estrutura', label: 'Estrutura', tipos: ['Problemas em portões', 'Problemas em câmeras', 'Problemas em áreas externas'] },
  { value: 'outros', label: 'Outros', tipos: ['Ocorrência Administrativa', 'Ocorrência Operacional'] },
];

export const ambientes = [
  'Normal',
  'Portão',
  'Pátio',
  'Área de alimentação',
  'Parquinho',
  'Cozinha',
  'Corredores',
  'Salas de aula',
  'Área externa',
];

export const prioridades = [
  { value: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critica', label: 'Crítica', color: 'bg-red-100 text-red-800' },
];

export const statusOcorrencia = [
  { value: 'aberta', label: 'Aberta', color: 'bg-blue-100 text-blue-800' },
  { value: 'em_atendimento', label: 'Em Atendimento', color: 'bg-amber-100 text-amber-800' },
  { value: 'finalizada', label: 'Finalizada', color: 'bg-green-100 text-green-800' },
  { value: 'encerrada', label: 'Encerrada', color: 'bg-gray-100 text-gray-800' },
];

export const motivosAvaliacao = [
  'Ausência do posto',
  'Falta de atenção',
  'Descumprimento de protocolo',
  'Atendimento inadequado',
  'Outro',
];

// Estatísticas para o dashboard
export const estatisticas = {
  ocorrenciasHoje: 0,
  ocorrenciasMes: 0,
  chamadosAbertos: 0,
  chamadosAtendidos: 0,
  porteirosFuncionais: 0,
  porteirosTotal: 0,
  unidadesAtencao: 0,
  unidadesTotal: 19,
};