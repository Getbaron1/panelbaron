# 🚀 SETUP COMPLETO - Módulo Comercial GetBaron

## ✅ O Que Foi Criado

### Frontend (React + TypeScript)
- ✅ **3 NOVAS PÁGINAS**: 
  - `/comercial/reunioes` - Gerenciar reuniões
  - `/comercial/comissoes` - Acompanhar comissões
  - `/comercial/rankings` - Ver performance (SDR/Closer)

- ✅ **1 NOVO COMPONENTE**:
  - `CreateLeadForm` - Form para criar leads

- ✅ **4 ROTAS ADICIONADAS** em `App.tsx`

- ✅ **INTEGRAÇÃO COMPLETA** com Supabase

### Backend (Supabase SQL)
- ✅ **6 TABELAS NOVAS**:
  - `leads` - Pipeline comercial completo
  - `lead_contacts` - Histórico de contatos (WhatsApp, Email, Telefone)
  - `lead_objections` - Rastreamento de objeções
  - `meetings` - Reuniões com SDR/Closer
  - `commissions` - Comissões de venda (65% primeira venda)
  - `message_templates` - Templates de mensagem com variáveis

- ✅ **7 VIEWS PARA DASHBOARDS**:
  - `vw_performance_sdr` - RANKING SDR com comissões
  - `vw_performance_closer` - RANKING Closer com vendas
  - `vw_pipeline_comercial` - Pipeline completo com todos os dados
  - `vw_resumo_leads_status` - Resumo por status
  - `vw_ranking_comissoes` - Ranking geral de comissões
  - `vw_dashboard_kpis` - KPIs executivos
  - `vw_leads_proxima_acao` - Próximas ações com urgência

- ✅ **TRIGGERS AUTOMÁTICOS**:
  - Auto-update de `updated_at`
  - Auto-geração de comissão ao converter lead (65%)
  - Auto-registro de templates padrão

- ✅ **RLS HABILITADO** em todas as tabelas

---

## 📋 PASSO A PASSO PARA SETUP

### 1️⃣ EXECUTAR SQL NO SUPABASE

```bash
# Copie TODO o conteúdo do arquivo:
SETUP_COMERCIAL_v2.sql

# Vá para: https://supabase.com/dashboard/project/[seu-projeto]/sql/new

# Cole TODO o SQL e execute
# Vai criar:
# - 6 tabelas
# - 7 views
# - Triggers
# - Políticas RLS
# - 5 templates padrão
```

### 2️⃣ VERIFICAR SE FUNCIONOU

No Supabase, vá para SQL Editor e execute:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'lead%' OR table_name LIKE 'meeting%' OR table_name = 'commissions' OR table_name = 'message_templates';

-- Verificar views criadas
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'vw_%';

-- Contar templates
SELECT COUNT(*) FROM message_templates;
```

### 3️⃣ O SISTEMA JÁ ESTÁ ONLINE

Frontend já foi feito e está no GitHub:
- ✅ Visite `/comercial` → Vê página de leads
- ✅ Clique "Novo Lead" → Abre form
- ✅ Preencha e cria lead → Automático em Supabase
- ✅ Clique "Reuniões" → Vê página de reuniões
- ✅ Clique "Comissões" → Vê ranking com valores
- ✅ Clique "Rankings" → Vê performance SDR/Closer

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### Leads
- ✅ Criar novo lead (formulário completo)
- ✅ Filtrar por status, cidade, SDR
- ✅ Ver próxima ação com urgência
- ✅ Converter para estabelecimento
- ✅ Rastrear contatos (WhatsApp/Email/Telefone)

### Reuniões
- ✅ Listar reuniões agendadas
- ✅ Filtrar por status e tipo (presencial/online)
- ✅ Ver responsável (SDR/Closer)
- ✅ Registrar resultado

### Comissões
- ✅ Ver todas as comissões (pendentes/pagas)
- ✅ Ranking por valor
- ✅ Status: Pendente/Paga/Cancelada
- ✅ KPI: Total, Paga, Pendente

### Rankings
- ✅ **SDR Ranking**: Leads criados, convertidos, taxa conversão, comissão
- ✅ **Closer Ranking**: Reuniões realizadas, vendas fechadas, comissão
- ✅ Posição (🥇🥈🥉)
- ✅ Barra de progresso visual

### WhatsApp
- ✅ Redirecionamento automático ao clicar "WhatsApp"
- ✅ Link pré-preenchido com mensagem
- ✅ Registro automático de clique

### Templates
- ✅ 5 templates padrão incluídos
- ✅ Variáveis dinâmicas: {{nome}}, {{vendedor}}, {{tipo_estabelecimento}}, {{data}}, {{hora}}, {{plano}}
- ✅ Substituição automática

---

## 🔄 FLUXO COMPLETO

```
1. SDR cria LEAD
   ↓
2. Registra CONTATOS (WhatsApp, Email, etc)
   ↓
3. Registra OBJEÇÕES (preço, concorrência, etc)
   ↓
4. Marca REUNIÃO com Closer
   ↓
5. Closer realiza REUNIÃO
   ↓
6. CONVERTIDO → TRIGGER DISPARA ⚡
   ├─ Cria/vincula ESTABLISHMENT
   ├─ Integra ao FATURAMENTO
   └─ Gera COMISSÃO 65% (pendente)
   ↓
7. Admin aprova COMISSÃO
   ↓
8. SDR recebe pagamento ✅
```

---

## 📊 DADOS QUE CADA PAGE MOSTRA

### `/comercial` (Dashboard)
- 4 KPI Cards: Total Leads, Novos, Próximas Ações, Atrasados
- Lista de leads com filtros
- Botões de ação rápida: WhatsApp, Ligar, Personalizar

### `/comercial/reunioes`
- Lista de reuniões com filtros (status, tipo)
- Coluna: Data/Hora, Local, SDR/Closer, Status
- Busca por estabelecimento/responsável

### `/comercial/comissoes`
- 3 KPI Cards: Total, Pagas, Pendentes
- Tabela com: Estabelecimento, SDR, Closer, Valor Plano, Comissão, Status
- Filtros e sort por valor

### `/comercial/rankings`
- **SDR Ranking**: Leads, Convertidos, Taxa, Comissão + 🥇🥈🥉
- **Closer Ranking**: Reuniões, Sucesso, Vendas + 🥇🥈🥉
- Barra de progresso para cada vendedor

---

## 🛠️ TECNOLOGIAS

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (ícones)
- React Router (navegação)

**Backend:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Triggers e Functions
- Views para reporting

**Deploy:**
- GitHub (código)
- Supabase (banco de dados)

---

## ⚠️ IMPORTANTE

1. **RLS habilitado**: Use user_id para filtrar dados
2. **Comissão automática**: Ao status='convertido', cria comissão
3. **WhatsApp**: Abre wa.me/numero com mensagem
4. **Templates**: Use {{variavel}} para substituição
5. **Próxima Ação**: Campo obrigatório para rastreamento

---

## 📝 PRÓXIMOS PASSOS (Opcional)

- [ ] Integrar com WhatsApp API (envio automático)
- [ ] Gráficos de performance (Chart.js)
- [ ] Exportar relatórios (Excel/PDF)
- [ ] Notificações em tempo real
- [ ] Mobile app para SDR

---

## ❓ DÚVIDAS?

Se algo não funcionar após executar o SQL:
1. Verifique se as tabelas foram criadas: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'lead%'`
2. Verifique as views: `SELECT viewname FROM pg_views WHERE viewname LIKE 'vw_%'`
3. Rode um INSERT teste: `INSERT INTO leads (...) VALUES (...)`
4. Checa o erro retornado

✅ **TUDO PRONTO PARA USAR!**
