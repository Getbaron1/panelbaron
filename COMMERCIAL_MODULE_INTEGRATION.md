# 🚀 Módulo Comercial - Guia de Integração

## 📋 Visão Geral

Extensão completa do sistema GetBaron com gestão comercial integrada, permitindo:
- Pipeline comercial com leads
- Registro de contatos, reuniões e objeções
- Cálculo automático de comissões
- Dashboards específicos para SDR, Closer e Admin

## ✅ O que já está implementado

### Banco de Dados ✓
- ✅ Tabela `leads` - Pipeline comercial
- ✅ Tabela `lead_contacts` - Histórico de interações
- ✅ Tabela `lead_objections` - Objeções registradas
- ✅ Tabela `meetings` - Reuniões agendadas/realizadas
- ✅ Tabela `commissions` - Comissões de vendas
- ✅ Triggers automáticos para gestão de comissões
- ✅ Função `converter_lead_para_estabelecimento()` - Conversão de leads
- ✅ Views de performance comercial (`vw_performance_sdr`, `vw_performance_closer`, `vw_pipeline_comercial`)
- ✅ Políticas RLS para SDR, Closer e Admin

### Tipos de Usuário ✓
- ✅ SDR (Vendedor de Desenvolvimento)
- ✅ CLOSER (Fechador de Vendas)
- ✅ ADMIN (Acesso total)

### Autenticação de Painel Financeiro ✓
- ✅ Edge function `verify-financial-password` para autenticação por establishment
- ✅ Campo `senha_painel_hash` na tabela `establishments`

---

## 🏗️ Estrutura Comercial

### Tabelas Principais

#### `leads`
```sql
- id (UUID, PK)
- establishment_id (UUID, FK) -- Null até conversão
- nome_estabelecimento (VARCHAR)
- tipo (bar, balada, restaurante, cafe, pizzaria, hamburgueria, outro)
- responsavel_nome, telefone, whatsapp, email
- instagram (VARCHAR)
- cidade, estado
- faturamento_estimado (DECIMAL)
- origem_lead (indicacao, prospeccao, evento, rede-social, referencia, outro)
- sdr_responsavel_id (UUID, FK → admin_users)
- status: novo → contato_realizado → interessado → reuniao_marcada → reuniao_realizada → convertido/perdido
- created_at, updated_at
```

**Status Flow:**
```
novo
  ↓
contato_realizado
  ↓
interessado
  ↓
reuniao_marcada
  ↓
reuniao_realizada
  ↙            ↘
convertido    perdido
```

#### `lead_contacts`
```sql
- id (UUID, PK)
- lead_id (UUID, FK)
- user_id (UUID, FK → admin_users)
- tipo_contato (whatsapp, telefone, email, pessoalmente, mensagem)
- resultado (VARCHAR)
- observacoes (TEXT)
- created_at
```

#### `lead_objections`
```sql
- id (UUID, PK)
- lead_id (UUID, FK)
- tipo_objecao (preco, concorrencia, timing, necessidade, confianca, tecnica, outro)
- descricao (TEXT)
- fase_objecao (sdr, closer) -- Quem registrou
- resolvida (BOOLEAN)
- solucao (TEXT)
- registrado_por (UUID, FK)
- created_at
```

#### `meetings`
```sql
- id (UUID, PK)
- lead_id (UUID, FK)
- sdr_id (UUID, FK) -- Quem marcou
- closer_id (UUID, FK) -- Quem realiza
- data_reuniao (TIMESTAMP)
- local (VARCHAR)
- status (agendada, realizada, cancelada, nao_compareceu)
- resultado (VARCHAR)
- observacoes (TEXT)
- created_at, updated_at
```

#### `commissions`
```sql
- id (UUID, PK)
- establishment_id (UUID, FK) -- Estabelecimento vendido
- sdr_id (UUID, FK) -- Responsável pela prospecção
- closer_id (UUID, FK) -- Responsável pelo fechamento
- plano_valor (DECIMAL) -- Ex: 160.00
- percentual_comissao (DECIMAL) -- Ex: 65.00
- valor_comissao (DECIMAL) -- plano_valor * percentual_comissao / 100
- tipo_comissao (primeira_venda, renovacao, upsell)
- mes_referencia (DATE) -- Mês da comissão
- status (pendente, paga, cancelada)
- data_pagamento (TIMESTAMP, nullable)
- created_at, updated_at
```

---

## 🔄 Fluxo de Conversão

### Quando um Lead é Convertido:

1. **Status muda para "convertido"** via UPDATE na tabela `leads`
2. **Trigger `gerar_comissao_conversao` ativa:**
   - Se `establishment_id` for NULL → Cria novo establishment
   - Se `establishment_id` existir → Vincula lead ao existing
   - Cria registro em `commissions` com 65% de comissão
3. **Estabelecimento está ativo** e pronto para faturamento

### Função SQL:
```sql
-- Chamar manualmente ou via aplicação
SELECT converter_lead_para_estabelecimento(
    p_lead_id => 'uuid-do-lead',
    p_establishment_id => NULL  -- NULL = criar novo, ou UUID = existente
);
```

---

## 🔐 Política de Acesso (RLS)

### ADMIN
- ✅ Acesso total a todas as tabelas comerciais

### SDR
| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| leads | Apenas seus | Sim | Seus | Seus |
| lead_contacts | Seus leads | Seus | Seus | - |
| lead_objections | Seus leads | Seus | Seus | - |
| meetings | Seus + SDR | Seus | Seus | - |
| commissions | ❌ NÃO VÊ | ❌ | ❌ | ❌ |

### CLOSER
| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| leads | Em suas reuniões | ❌ | ❌ | ❌ |
| lead_contacts | Em suas reuniões | ❌ | ❌ | ❌ |
| lead_objections | Em suas reuniões | Seus | Seus | - |
| meetings | Seus | ❌ | Seus | ❌ |
| commissions | Suas | ❌ | ❌ | ❌ |

---

## 📊 Views para Dashboards

### `vw_performance_sdr`
```sql
SELECT 
    user_id, sdr_nome,
    total_leads, leads_convertidos, contatos_realizados,
    reunioes_marcadas, taxa_conversao (%),
    total_comissao, comissao_paga
FROM vw_performance_sdr
```

### `vw_performance_closer`
```sql
SELECT 
    user_id, closer_nome,
    reunioes_realizadas, reunioes_concluidas,
    vendas_fechadas,
    total_comissao, comissao_paga, comissao_pendente
FROM vw_performance_closer
```

### `vw_pipeline_comercial`
Visão completa do pipeline com todos os dados relacionados:
```sql
SELECT 
    lead_id, nome_estabelecimento, status,
    sdr_nome, total_contatos, total_objecoes,
    total_reunioes, ultimo_contato,
    faturamento_estimado, comissao_esperada
FROM vw_pipeline_comercial
```

### `vw_resumo_leads_status`
Agregação por status:
```sql
SELECT 
    status, total_leads, sdrs_envolvidos,
    estabelecimentos_vinculados, faturamento_medio_estimado,
    ultima_atualizacao
FROM vw_resumo_leads_status
```

---

## 🎯 Próximas Implementações (Frontend)

### 1️⃣ Módulo Comercial (UI)
```
Menu Lateral:
├── Dashboard Comercial
│   ├── KPIs (leads, conversão, comissão)
│   ├── Gráficos (pipeline, performance)
│   └── Tabelas (leads, reuniões, comissões)
├── Leads
│   ├── Listar leads
│   ├── Criar lead
│   ├── Detalhe lead (contatos, objeções, reuniões)
│   └── Converter lead
├── Reuniões
│   ├── Agendar reunião
│   ├── Listar reuniões
│   └── Registrar resultado
├── Minhas Comissões (Closer only)
│   ├── Listar comissões
│   └── Status de pagamento
└── Performance (Admin only)
    ├── SDRs
    ├── Closers
    └── Pipeline
```

### 2️⃣ Componentes React
- `LeadForm` - Criar/editar leads
- `LeadDetail` - Detalhe do lead com timeline
- `MeetingForm` - Agendar/registrar reunião
- `CommissionCard` - Exibir comissão
- `PipelineChart` - Gráfico de pipeline
- `PerformanceTable` - Performance de SDR/Closer

### 3️⃣ Páginas Sugeridas
```
src/pages/
├── Comercial/
│   ├── DashboardComercial.tsx
│   ├── Leads.tsx
│   ├── LeadDetalhes.tsx
│   ├── Reunioes.tsx
│   └── Comissoes.tsx
└── Performance/
    ├── SDRs.tsx
    └── Closers.tsx
```

---

## 🚀 Deployment Checklist

### Backend (Supabase)
- [x] Schema criado com todas as tabelas
- [x] Triggers e Functions implementados
- [x] RLS Policies configuradas
- [x] Views de reporting criadas
- [x] Edge Function `verify-financial-password` deployado

### Frontend (React)
- [ ] Menu "Comercial" adicionado ao Layout
- [ ] Páginas comerciais criadas
- [ ] Componentes de form e list
- [ ] Integrações com API (Supabase client)
- [ ] Permissões de rol implementadas no frontend
- [ ] Testes funcionais

### Produção
- [ ] Migração de dados existentes (se houver)
- [ ] Testes de RLS/Segurança
- [ ] Validação de performance (índices)
- [ ] Documentação para usuários finais

---

## 📱 Exemplo de Uso (Frontend)

### Criar Lead (SDR)
```typescript
const createLead = async (leadData) => {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      ...leadData,
      sdr_responsavel_id: currentUser.id,
      status: 'novo'
    }]);
  
  return { data, error };
};
```

### Converter Lead → Estabelecimento (Admin/Closer)
```typescript
const convertLead = async (leadId, establishmentId = null) => {
  const { data, error } = await supabase
    .rpc('converter_lead_para_estabelecimento', {
      p_lead_id: leadId,
      p_establishment_id: establishmentId
    });
  
  return { data, error };
};
```

### Agendar Reunião (SDR)
```typescript
const scheduleMeeting = async (leadId, closerId, date) => {
  const { data, error } = await supabase
    .from('meetings')
    .insert([{
      lead_id: leadId,
      closer_id: closerId,
      sdr_id: currentUser.id,
      data_reuniao: date,
      status: 'agendada'
    }]);
  
  return { data, error };
};
```

### Registrar Resultado (Closer)
```typescript
const registerMeetingResult = async (meetingId, result, observations) => {
  const { data, error } = await supabase
    .from('meetings')
    .update({
      status: 'realizada',
      resultado: result,
      observacoes: observations
    })
    .eq('id', meetingId);
  
  return { data, error };
};
```

### Visualizar Performance (Admin)
```typescript
const getSDRPerformance = async () => {
  const { data, error } = await supabase
    .from('vw_performance_sdr')
    .select('*');
  
  return { data, error };
};
```

---

## 🔧 Configuração de Planos

### Valores Padrão
```javascript
const PLANOS = {
  basico: {
    valor: 160.00,
    comissao_percentual: 65.00,
    descricao: 'Plano básico para iniciantes'
  },
  profissional: {
    valor: 400.00,
    comissao_percentual: 65.00,
    descricao: 'Plano profissional com mais recursos'
  },
  enterprise: {
    valor: 800.00,
    comissao_percentual: 65.00,
    descricao: 'Plano enterprise com suporte dedicado'
  }
};

// Usar em conversão:
const valor_comissao = valor_plano * (percentual_comissao / 100);
```

---

## 🐛 Troubleshooting

### Problema: SDR vê comissões de outros
**Solução:** Verificar RLS policy `sdr_no_commissions` - deve retornar `false`

### Problema: Closer não consegue criar objeções
**Solução:** Verificar se existe reunião atribuída a ele no lead

### Problema: Lead não converte para comissão
**Solução:** Verificar trigger `gerar_comissao_conversao` e logs de erro

### Problema: RLS bloqueia acesso legítimo
**Solução:** Confirmar que `auth.uid()` retorna o mesmo valor do usuário logado

---

## 📚 Referências

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [SQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

## 📞 Suporte

Para dúvidas sobre:
- **Schema/Database**: Verificar `database/schema.sql`
- **Edge Functions**: Verificar `supabase/functions/verify-financial-password/`
- **Frontend Integration**: Aguardando implementação dos componentes React

---

**Última atualização:** Fevereiro 2026
**Status:** ✅ Backend 100% | ⏳ Frontend 0% (Aguardando implementação)
