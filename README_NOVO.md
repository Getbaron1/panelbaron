# 🚀 Baron Control - Painel Administrativo Master

![Baron Control](https://via.placeholder.com/800x400/1a1a2e/D4AF37?text=Baron+Control+Admin+Panel)

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)]()
[![Backend](https://img.shields.io/badge/backend-✅%20completo-green)]()
[![Frontend](https://img.shields.io/badge/frontend-🚧%2050%25-orange)]()

## 📋 Visão Geral

Sistema completo de gerenciamento para redes de estabelecimentos (bares, restaurantes, pizzarias) com:

- ✅ **Controle de Estabelecimentos** - Cadastro, status, planos
- ✅ **Gestão Financeira** - Faturamento, taxas (Pix 2% / Crédito 0.5%), saques
- ✅ **Módulo Comercial** - Pipeline de leads, SDRs, Closers, comissões
- ✅ **Dashboard Administrativo** - KPIs, gráficos, relatórios
- 🚧 **Dashboard Comercial** - Implementação em progresso
- 🔒 **Autenticação** - Admin + Panel financeiro por establishment

---

## 🎯 Objetivos

### Fase 1 ✅ (Concluída)
- Schema PostgreSQL completo
- Tabelas comerciais (leads, reuniões, comissões)
- Edge functions para autenticação
- RLS policies para controle de acesso
- Views de performance

### Fase 2 🚧 (Em Progresso)
- Dashboard comercial React
- Componentes de forms/lists para leads e reuniões
- Integração com Supabase client
- Telas de performance para SDR/Closer

### Fase 3 📅 (Planejada)
- Segurança: implementar bcrypt para senhas
- Integrações: WhatsApp API, automação de leads
- Relatórios: exportar PDF/Excel
- Mobile: versão responsiva completa

---

## 🚀 Stack Tecnológico

### Backend
| Tecnologia | Uso |
|-----------|-----|
| **PostgreSQL** | Banco de dados principal |
| **Supabase** | Hosting, Auth, RLS, Edge Functions |
| **Deno** | Runtime para Edge Functions |
| **SQL/PL/pgSQL** | Triggers, functions, views |

### Frontend
| Tecnologia | Uso |
|-----------|-----|
| **React 18** | Framework UI |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e dev server |
| **Tailwind CSS** | Estilização |
| **Supabase JS Client** | Integração backend |

---

## 📁 Estrutura do Projeto

```
baron-admin-panel-main/
├── database/
│   └── schema.sql                    # ✅ Schema PostgreSQL completo
├── supabase/
│   └── functions/
│       └── verify-financial-password/ # ✅ Edge function
├── src/
│   ├── components/                   # Componentes reutilizáveis
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── dashboard/
│   │   │   └── KPICard.tsx
│   │   └── ui/                       # Primitivos UI
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── integrations/
│   │   └── supabase/                 # Cliente Supabase
│   ├── lib/
│   │   ├── supabase.ts               # Config Supabase
│   │   ├── commercialServices.ts     # 🆕 Serviços comerciais
│   │   ├── mockData.ts
│   │   └── utils.ts
│   ├── pages/                        # Páginas/rotas
│   │   ├── Dashboard.tsx             # Dashboard principal
│   │   ├── Clientes.tsx
│   │   ├── Faturamento.tsx
│   │   ├── Pedidos.tsx
│   │   ├── Produtos.tsx
│   │   ├── Mapa.tsx
│   │   ├── Login.tsx
│   │   ├── Configuracoes.tsx
│   │   └── Comercial/                # 🆕 Módulo comercial
│   │       ├── DashboardComercial.tsx
│   │       ├── Leads.tsx
│   │       ├── Reunioes.tsx
│   │       └── Comissoes.tsx
│   ├── types/
│   │   ├── withdrawals.ts
│   │   └── commercial.ts             # 🆕 Tipos comerciais
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── COMMERCIAL_MODULE_INTEGRATION.md  # 🆕 Guia comercial
├── STATUS.md                         # Status desenvolvimento
├── DEPLOYMENT_STEPS.md               # Deployment
├── DEPLOY_INSTRUCTIONS.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── index.html
```

---

## 🗄️ Banco de Dados

### Tabelas de Gestão
| Tabela | Descrição |
|--------|-----------|
| `establishments` | Clientes Baron Control |
| `admin_users` | Usuários do painel (roles: super_admin, admin, sdr, closer, viewer) |
| `logs_sistema` | Auditoria de ações |

### Tabelas Operacionais
| Tabela | Descrição |
|--------|-----------|
| `produtos` | Cardápio dos estabelecimentos |
| `categorias` | Categorias de produtos |
| `clientes` | Clientes dos estabelecimentos |
| `pedidos` | Pedidos realizados |
| `pedido_itens` | Itens dos pedidos |

### Tabelas Financeiras
| Tabela | Descrição |
|--------|-----------|
| `faturamento_diario` | Agregado de faturamento |
| `withdrawal_requests` | Solicitações de saque |
| `audit_logs` | Logs de auditoria financeira |

### Tabelas Comerciais ⭐
| Tabela | Descrição |
|--------|-----------|
| `leads` | Pipeline de prospecção |
| `lead_contacts` | Histórico de interações |
| `lead_objections` | Objeções registradas |
| `meetings` | Reuniões agendadas/realizadas |
| `commissions` | Comissões de vendas |

### Views (Relatórios)
```sql
vw_resumo_estabelecimentos       -- Resumo por estabelecimento
vw_faturamento_mensal             -- Faturamento por período
vw_produtos_mais_vendidos         -- Top 10 produtos
vw_performance_sdr                -- Performance de SDRs
vw_performance_closer             -- Performance de Closers
vw_pipeline_comercial             -- Pipeline completo
vw_resumo_leads_status            -- Leads por status
```

---

## 👥 Tipos de Usuário

### 🔑 SUPER_ADMIN
- Acesso total ao sistema
- Gerencia admin users
- Visualiza todos os módulos
- Acesso a todos os relatórios

### 👨‍💼 ADMIN
- Gerencia estabelecimentos e usuários
- Visualiza financeiro global
- Aprova saques
- Visualiza performance comercial
- Gerencia SDRs e Closers

### 🎯 SDR (Sales Development Representative)
- Cria e gerencia leads
- Registra contatos e interações
- Marca reuniões
- **Visualiza**: Seus leads, contatos, reuniões
- **Não acessa**: Financeiro, comissões, outros leads

### ✅ CLOSER (Fechador)
- Realiza reuniões marcadas
- Registra resultados
- Converte leads em clientes
- **Visualiza**: Reuniões atribuídas, suas comissões
- **Não acessa**: Todos os leads, financeiro global

### 👁️ VIEWER
- Apenas leitura
- Visualiza relatórios e dashboards
- **Sem permissão** de escrita

---

## 🔐 Segurança

### Autenticação
- ✅ Supabase Auth (JWT)
- ✅ Row Level Security (RLS) habilitada
- ✅ Policies granulares por role
- 🔒 Edge Function para verify-financial-password

### Autorização (RLS)
```sql
-- Admin: acesso total a todas as tabelas
-- SDR: vê apenas seus leads e comissões
-- Closer: vê apenas reuniões atribuídas e suas comissões
-- Viewer: SELECT apenas em views públicas
```

### Autenticação de Painel Financeiro
- Edge Function: `verify-financial-password`
- Campo: `establishments.senha_painel_hash`
- Verificação por establishment_id + senha

---

## 🚀 Como Começar

### Pré-requisitos
```bash
node --version   # v18.0.0 ou superior
npm --version    # v9.0.0 ou superior
git --version
```

### 1. Clone o Repositório
```bash
git clone https://github.com/your-repo/baron-admin-panel.git
cd baron-admin-panel-main
```

### 2. Instale Dependências
```bash
npm install
```

### 3. Configure o Banco de Dados (Supabase)
```bash
# Acesse https://supabase.com
# Crie um novo projeto

# Execute o schema SQL
# Copie o conteúdo de database/schema.sql
# Cole no editor SQL do Supabase e execute
```

### 4. Configure Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais Supabase:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 5. Inicie o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse em `http://localhost:5173`

### 6. Deploy de Edge Functions (Opcional)
```bash
# Se tiver supabase CLI instalado
supabase functions deploy verify-financial-password
```

---

## 📊 Funcionalidades

### Dashboard Principal
- KPIs principais (estabelecimentos, faturamento, pedidos)
- Gráficos de tendências
- Alertas e notificações
- Últimas transações

### Gestão de Estabelecimentos
- Criar/editar estabelecimentos
- Filtrar por status, plano, cidade
- Atribuir planos
- Visualizar histórico

### Faturamento
- Resumo de receitas
- Cálculo de taxas (Pix 2% / Crédito 0.5%)
- Requisições de saque
- Auditoria de transações

### Módulo Comercial
- **Dashboard Comercial**: KPIs de vendas, pipeline
- **Leads**: Criar, editar, filtrar, converter
- **Reuniões**: Agendar, registrar resultado
- **Comissões**: Visualizar status, histórico de pagamentos
- **Performance**: SDRs e Closers

---

## 💡 Exemplos de Uso

### Criar um Lead (SDR)
```typescript
import { createLead } from '@/lib/commercialServices';

const handleCreateLead = async () => {
  const { data, error } = await createLead(
    {
      nome_estabelecimento: 'Pizzaria Bella',
      tipo: 'pizzaria',
      responsavel_nome: 'João Silva',
      responsavel_telefone: '11999999999',
      responsavel_email: 'joao@pizzaria.com',
      cidade: 'São Paulo',
      estado: 'SP',
      origem_lead: 'prospeccao',
    },
    currentUser.id
  );

  if (error) {
    console.error('Erro ao criar lead:', error);
  } else {
    console.log('Lead criado:', data);
  }
};
```

### Converter Lead → Estabelecimento (Admin)
```typescript
import { convertLeadToEstablishment } from '@/lib/commercialServices';

const handleConvert = async (leadId: string) => {
  const { data, error } = await convertLeadToEstablishment(
    leadId,
    null // null = criar novo, ou UUID = vincular existente
  );

  if (!error) {
    console.log('Lead convertido! Novo establishment ID:', data);
  }
};
```

### Visualizar Performance de SDR (Admin)
```typescript
import { getSDRPerformance } from '@/lib/commercialServices';

const handleViewPerformance = async () => {
  const { data, error } = await getSDRPerformance();

  if (data) {
    console.log('Performance de SDRs:', data);
    // Dados: total_leads, leads_convertidos, taxa_conversao, etc
  }
};
```

---

## 🔄 Fluxo Comercial

```
NOVO LEAD
    ↓
SDR cria lead e registra contatos
    ↓
Lead avança no pipeline
    ↓
SDR marca reunião com Closer
    ↓
Closer realiza reunião
    ↓
Lead convertido → Novo Establishment
    ↓
✅ Comissão criada automaticamente (65% do plano)
```

---

## 📈 Cálculo de Comissões

### Regra Padrão
```
Plano Base: R$ 160,00
Comissão: 65%

Comissão = 160,00 × 0,65 = R$ 104,00
```

### Para Outros Planos
```
Profissional: 400,00 × 0,65 = R$ 260,00
Enterprise: 800,00 × 0,65 = R$ 520,00
```

### Status de Comissão
- **Pendente**: Recém-criada, aguardando aprovação
- **Paga**: Transferência realizada
- **Cancelada**: Descartada/revertida

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev        # Inicia servidor desenvolvimento
npm run build      # Build para produção
npm run preview    # Preview do build
npm run lint       # Verifica lint
```

### Estrutura de Componentes
```bash
src/components/
├── ui/                 # Componentes primitivos reutilizáveis
├── layout/             # Componentes de layout
├── dashboard/          # Componentes de dashboard
└── comercial/          # Componentes comerciais (quando criado)
```

### Adicionando Nova Página
1. Criar arquivo em `src/pages/NomePagina.tsx`
2. Adicionar rota em `src/App.tsx`
3. Adicionar menu item em `src/components/Sidebar.tsx`
4. Importar tipos necessários de `src/types/`

---

## 📱 Responsividade

- ✅ Desktop (1920px+)
- ✅ Laptop (1440px+)
- ✅ Tablet (768px+)
- 🚧 Mobile (320px+) - Em progresso

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Erro de autenticação" | Verificar variáveis .env.local |
| "RLS policy missing" | Verificar se schema.sql foi executado |
| "Estabelecimento não encontrado" | Validar UUID do estabelecimento |
| "Senha incorreta no painel" | Verificar campo `senha_painel_hash` |
| "Componente não renderiza" | Verificar imports e tipos TypeScript |

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [COMMERCIAL_MODULE_INTEGRATION.md](./COMMERCIAL_MODULE_INTEGRATION.md) | Guia completo do módulo comercial |
| [STATUS.md](./STATUS.md) | Status atual de desenvolvimento |
| [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) | Passos de deployment em produção |
| [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) | Instruções detalhadas |

---

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit suas mudanças: `git commit -am 'Add feature'`
4. Push para a branch: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

---

## 📞 Suporte e Dúvidas

- 📖 Consulte a documentação em `COMMERCIAL_MODULE_INTEGRATION.md`
- 🐛 Verifique a seção Troubleshooting
- 💬 Abra uma issue no repositório

---

## 📄 Licença

Proprietary © 2026 Baron Control. Todos os direitos reservados.

---

## 🎯 Roadmap

### Q1 2026
- ✅ Backend comercial 100%
- 🚧 Frontend comercial 50%
- 📅 Dashboard comercial completo

### Q2 2026
- 📅 Integrações WhatsApp
- 📅 Automação de leads
- 📅 Relatórios PDF/Excel

### Q3 2026
- 📅 App mobile (React Native)
- 📅 Notificações push
- 📅 Analytics avançado

---

**Versão**: 1.0.0  
**Última atualização**: Fevereiro 2026  
**Mantido por**: Time de Desenvolvimento Baron  
**Status**: 🟡 Em Desenvolvimento Ativo
