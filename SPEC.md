# SIME – Sistema Integrado de Monitoramento Escolar

## 1. Concept & Vision

SIME é uma plataforma robusta de monitoramento escolar que centraliza a vigilância de 19 unidades escolares, transformando dados de 300 câmeras em ações coordenadas. O sistema transmite confiança institucional através de uma interface profissional e limpa, onde informações críticas se destacam e operações fluem naturalmente. A experiência deve ser como um centro de controle moderno: organizado, eficiente, e sempre um passo à frente.

## 2. Design Language

### Aesthetic Direction
Inspirado em dashboards de centros de controle e sistemas de gestão pública de alto nível — clean, funcional, com hierarquia visual clara. Usa cards com sombras sutis e bordas arredondadas para organizar informações densas sem parecer abrumador.

### Color Palette
- **Primary**: `#1E40AF` (Azul institucional profundo)
- **Primary Light**: `#3B82F6` (Azul para elementos interativos)
- **Secondary**: `#0F172A` (Slate escuro para sidebars e headers)
- **Accent Success**: `#059669` (Verde para status normais/OK)
- **Accent Warning**: `#D97706` (Âmbar para atenção)
- **Accent Danger**: `#DC2626` (Vermelho para críticos)
- **Background**: `#F1F5F9` (Cinza claro neutro)
- **Surface**: `#FFFFFF` (Branco para cards)
- **Text Primary**: `#1E293B`
- **Text Secondary**: `#64748B`
- **Border**: `#E2E8F0`

### Typography
- **Headings**: Inter (700, 600) - Google Fonts
- **Body**: Inter (400, 500) - Google Fonts
- **Monospace**: JetBrains Mono para códigos/IDs

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Card padding: 24px
- Section gaps: 24px
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)

### Motion Philosophy
- Transições suaves de 200ms ease-out para hovers
- Modals com fade-in de 150ms + scale de 0.95→1
- Sidebar collapse/expand 300ms ease-in-out
- Loading states com pulse animation
- Notificações com slide-in da direita 250ms

### Visual Assets
- **Icons**: Lucide React (consistente, leve)
- **Charts**: Recharts para gráficos do dashboard
- **Empty States**: Ilustrações simples com ícones + texto explicativo

## 3. Layout & Structure

### Overall Architecture
```
┌─────────────────────────────────────────────────────────┐
│ Header (固定): Logo, Search, Notifications, User       │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                            │
│ (固定)   │ ┌────────────────────────────────────────┐   │
│          │ │ Page Header + Actions                 │   │
│ - Dash   │ ├────────────────────────────────────────┤   │
│ - Ocorr  │ │ Content (Cards, Tables, Forms)        │   │
│ - Chamad │ │                                        │   │
│ - Relat  │ │                                        │   │
│ - Escolas│ │                                        │   │
│ - Usuár  │ └────────────────────────────────────────┘   │
│ - Config │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Page Structure
1. **Dashboard**: Grid de métricas + gráficos + ocorrências recentes
2. **Ocorrências**: Table com filtros + modal de registro
3. **Chamados**: Kanban-style ou table com status
4. **Relatórios**: Listagem + gerador de relatórios
5. **Escolas**: Grid de cards das unidades
6. **Usuários**: Table de gestão + CRUD
7. **Configurações**: Tabs para diferentes configurações

### Responsive Strategy
- Desktop-first (sistema de monitoramento)
- Sidebar colapsável para tablets
- Cards empilham em mobile
- Tabelas horizontais scrolláveis

## 4. Features & Interactions

### 4.1 Dashboard (Administrador)
**Métricas em cards no topo:**
- Total de ocorrências do dia/mês
- Chamados em aberto/atendidos
- Status dos porteiros (funcionais/total)
- Unidades em atenção

**Gráficos:**
- Ocorrências por categoria (bar chart)
- Ocorrências por unidade (horizontal bar)
- Timeline de ocorrências (line chart)
- Status dos chamados (donut chart)

**Lista de Ocorrências Recentes:**
- Últimas 10 com status, unidade, categoria
- Click abre modal de detalhes

### 4.2 Registro de Ocorrência (Técnico de Monitoramento)
**Formulário:**
- Unidade (select com busca) - obrigatório
- Categoria (Security/Discipline/Structure/Other) - obrigatório
- Subtipo (baseado na categoria selecionada)
- Ambiente (Portão/Pátio/Sala/etc) - obrigatório
- Prioridade (Baixa/Média/Alta/Crítica) - obrigatório
- Descrição (textarea) - obrigatório
- Evidências (upload de imagens)

**Comportamentos:**
- Validação inline em todos campos
- Submit mostra loading state
- Sucesso: toast notification + limpa form
- Erro: mensagem de erro no topo do form

### 4.3 Sistema de Chamados
**Fluxo Visual:**
```
[Aberto] → [Em Atendimento] → [Finalizado] → [Encerrado]
```

**Card do Chamado:**
- ID, Unidade, Categoria
- Tempo desde abertura
- Técnico atribuído
- Prioridade (badge colorido)
- Ações: Atender, Ver Detalhes, Encerrar

### 4.4 Gravação de Áudio
**Funcionalidade:**
- Botão de gravar com feedback visual (pulsing red)
- Timer mostrando duração
- Botão parar → salva áudio
- Transcrição simulada (em produção usaria Whisper API)
- Texto transcrito editável
- Vincular ao chamado

### 4.5 Avaliação de Porteiros
**Formulário (após visita tática):**
- Porteiro (select da unidade)
- Situação: Funcional / Não Funcional
- Se Não Funcional:
  - Motivo (select: Ausência, Falta de atenção, Descumprimento, Atendimento inadequado, Outro)
  - Observações (textarea)
- Técnico responsible (auto-preenchido)
- Data/Hora (auto-preenchido)

### 4.6 Relatórios
**Tipos:**
- Relatório Diário (por unidade)
- Relatório Tático (por ocorrência)
- Relatório de Avaliação de Porteiros
- Relatório Gerencial (período customizável)

**Exportação:**
- Botões: PDF, Excel, CSV
- Filtros: período, unidade, categoria

### 4.7 Gestão de Usuários (Admin)
**Table com:**
- Nome, Email, Perfil, Status
- Ações: Editar, Ativar/Desativar, Excluir

**Formulário de cadastro:**
- Nome, Email, Senha, Perfil, Unidades asignadas

## 5. Component Inventory

### MetricCard
- **Default**: Ícone + valor grande + label + variação percentual
- **Hover**: Sutil elevação (shadow-md)
- **Loading**: Skeleton pulse

### DataTable
- **Default**: Header sticky, rows com hover highlight
- **Empty**: Mensagem + ícone ilustrativo
- **Loading**: 5 skeleton rows
- **Pagination**: Números + previous/next
- **Sort**: Ícone de seta no header

### Button
- **Primary**: bg-blue-600, hover:bg-blue-700, text-white
- **Secondary**: bg-white, border, hover:bg-gray-50
- **Danger**: bg-red-600, hover:bg-red-700
- **Disabled**: opacity-50, cursor-not-allowed
- **Loading**: Spinner interno + texto "Aguarde..."

### Badge/Status
- **Aberto**: bg-blue-100, text-blue-800
- **Em Atendimento**: bg-amber-100, text-amber-800
- **Finalizado**: bg-green-100, text-green-800
- **Crítico**: bg-red-100, text-red-800

### Modal
- **Backdrop**: bg-black/50, blur(4px)
- **Container**: bg-white, rounded-lg, shadow-xl
- **Animation**: fade-in + scale-up
- **Close**: X button no topo + click fora + ESC key

### Form Elements
- **Input**: border-gray-300, focus:ring-blue-500, error:border-red-500
- **Select**: Mesmo estilo, com chevron
- **Textarea**: Auto-resize opcional
- **Checkbox/Radio**: Custom styled com cores do tema

### Sidebar Navigation
- **Item Default**: text-slate-300, hover:bg-slate-700
- **Item Active**: bg-blue-600, text-white, left-border accent
- **Collapsed**: Ícones apenas, tooltip on hover

### Toast Notification
- **Success**: bg-green-500, checkmark icon
- **Error**: bg-red-500, X icon
- **Info**: bg-blue-500, info icon
- **Position**: top-right, stacked
- **Duration**: 5s auto-dismiss

## 6. Technical Approach

### Stack
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State**: React useState/useContext
- **Routing**: React Router DOM
- **Forms**: React Hook Form (ou vanilla)
- **Dates**: date-fns

### Data Model

```typescript
// Escola
interface Escola {
  id: string;
  nome: string;
  tipo: 'CEI' | 'CEM' | 'EM' | 'ERM';
  endereco: string;
  cameras: number;
}

// Usuario
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'tecnico_monitoramento' | 'tecnico_tatico';
  status: 'ativo' | 'inativo';
  unidades?: string[]; // IDs das unidades que pode acessar
}

// Ocorrencia
interface Ocorrencia {
  id: string;
  escolaId: string;
  categoria: 'seguranca' | 'disciplina' | 'estrutura' | 'outros';
  tipo: string;
  ambiente: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberta' | 'em_atendimento' | 'finalizada' | 'encerrada';
  dataAbertura: Date;
  dataEncerramento?: Date;
}

// Chamado
interface Chamado {
  id: string;
  ocorrenciaId: string;
  tecnicoMonitoramento: string;
  tecnicoTatico?: string;
  status: 'aberto' | 'atendido' | 'finalizado';
  dataAbertura: Date;
  dataAtendimento?: Date;
  dataFinalizacao?: Date;
}

// Relatorio
interface Relatorio {
  id: string;
  tipo: 'diario' | 'tatico' | 'avaliacao_porteiro' | 'gerencial';
  conteudo: object;
  data: Date;
  autor: string;
}

// AvaliacaoPorteiro
interface AvaliacaoPorteiro {
  id: string;
  escolaId: string;
  porteiroNome: string;
  situacao: 'funcional' | 'nao_funcional';
  motivo?: string;
  observacoes?: string;
  tecnicoResponsavel: string;
  data: Date;
}

// Audio
interface Audio {
  id: string;
  ocorrenciaId: string;
  arquivoUrl: string;
  transcricao?: string;
  duracao: number;
  data: Date;
}
```

### Arquivo Estrutura
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── DataTable.tsx
│   │   ├── Toast.tsx
│   │   └── MetricCard.tsx
│   ├── dashboard/
│   │   ├── DashboardCharts.tsx
│   │   └── RecentOccurrences.tsx
│   ├── occurrences/
│   │   ├── OccurrenceForm.tsx
│   │   └── OccurrenceList.tsx
│   ├── calls/
│   │   └── CallCard.tsx
│   └── reports/
│       └── ReportGenerator.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Occurrences.tsx
│   ├── Calls.tsx
│   ├── Reports.tsx
│   ├── Schools.tsx
│   ├── Users.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useToast.ts
│   └── useAuth.ts
├── context/
│   └── AppContext.tsx
├── data/
│   └── mockData.ts
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
├── App.tsx
└── main.tsx
```

### API Simulation
Como não temos Supabase configurado, todos os dados serão gerenciados via React Context com estado local. Os dados mockados incluirão:
- 19 escolas pré-cadastradas
- 10 usuários de exemplo
- 50 ocorrências históricas
- 20 chamados em diferentes status