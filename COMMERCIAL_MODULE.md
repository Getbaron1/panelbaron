# MÓDULO COMERCIAL - ARQUITETURA E INTEGRAÇÃO

## 🎯 OBJETIVO

Estender o Baron Control com gestão comercial completa, mantendo **SEM DUPLICAR** o sistema financeiro existente.

---

## 📊 ARQUITETURA DE INTEGRAÇÃO

```
┌─────────────────┐
│   LEADS         │
│  (Pipeline)     │
└────────┬────────┘
         │ Convertido
         ▼
┌─────────────────────────────────────┐
│   ESTABLISHMENTS (Reutilizado)      │
│  - Ativa automaticamente             │
│  - Entra no faturamento existente    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   WITHDRAWAL_REQUESTS (Existente)   │
│  - Faturamento já calculado         │
│  - Taxas já aplicadas               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  COMMISSIONS    │
│  (Nova tabela)  │ ← Gerada automaticamente
└─────────────────┘
```

---

## 🔄 FLUXO COMERCIAL

### 1. **SDR Cria Lead**
```
Novo Lead → Status: 'novo'
  ├─ Nome estabelecimento
  ├─ Tipo de negócio
  ├─ Contato responsável
  └─ SDR responsável
```

### 2. **Registra Interações**
```
lead_contacts (múltiplos registros)
  ├─ WhatsApp / Telefone / Email
  ├─ Resultado
  └─ Data/Hora
```

### 3. **Registra Objeções**
```
lead_objections
  ├─ Tipo: preço, concorrência, timing, etc
  ├─ Fase: SDR ou Closer
  └─ Solução (se resolvida)
```

### 4. **Marca Reunião**
```
meetings
  ├─ SDR (quem marcou)
  ├─ Closer (quem vai realizar)
  ├─ Data/Hora
  └─ Local
```

### 5. **Closer Realiza Reunião**
```
meetings.status = 'realizada'
meetings.resultado = 'sucesso' | 'precisa_retorno' | 'perdido'
```

### 6. **Lead Convertido → Automaticamente Gera Comissão**
```
UPDATE leads
SET status = 'convertido'
  ↓
TRIGGER gerar_comissao_conversao()
  ├─ Cria establishment (se novo)
  ├─ Ativa no sistema existente
  └─ Gera comissão no primeiro mês
```

---

## 📋 NOVOS ROLES DE USUÁRIO

### **SDR** (role = 'sdr')
```
Permissões:
  ✓ Criar leads
  ✓ Registrar contatos/interações
  ✓ Registrar objeções
  ✓ Marcar reuniões
  ✓ Ver suas conversões
  ✓ Ver sua comissão esperada
  
Restrições:
  ✗ NÃO vê financeiro global
  ✗ NÃO vê comissões de outros SDRs
  ✗ NÃO acessa módulo de faturamento
```

### **CLOSER** (role = 'closer')
```
Permissões:
  ✓ Ver reuniões atribuídas
  ✓ Registrar resultado de reuniões
  ✓ Converter lead em cliente
  ✓ Ver sua comissão
  ✓ Visualizar objeções comuns
  
Restrições:
  ✗ NÃO cria leads
  ✗ NÃO vê comissões de outros closers
  ✗ NÃO acessa faturamento
```

### **ADMIN** (role = 'admin' / 'super_admin')
```
Permissões:
  ✓ Acesso completo ao módulo comercial
  ✓ Ver todos os SDRs/Closers
  ✓ Ver todas as comissões
  ✓ Alterar estrutura de comissões
  ✓ Integração com financeiro existente
```

---

## 🗂️ NOVAS TABELAS

### **leads**
```sql
├─ id: UUID
├─ establishment_id: UUID (FK → establishments) [NULLABLE]
├─ nome_estabelecimento: VARCHAR
├─ tipo: ENUM (bar, balada, restaurante, cafe, pizzaria, hamburgueria, outro)
├─ responsavel_nome: VARCHAR
├─ responsavel_telefone: VARCHAR
├─ responsavel_whatsapp: VARCHAR
├─ responsavel_email: VARCHAR
├─ instagram: VARCHAR
├─ cidade: VARCHAR
├─ estado: VARCHAR(2)
├─ faturamento_estimado: DECIMAL
├─ origem_lead: ENUM (indicacao, prospeccao, evento, rede-social, referencia, outro)
├─ sdr_responsavel_id: UUID (FK → admin_users)
├─ status: ENUM (novo, contato_realizado, interessado, reuniao_marcada, reuniao_realizada, perdido, convertido)
├─ motivo_perda: TEXT
├─ data_conversao: TIMESTAMP
├─ created_at, updated_at
```

### **lead_contacts** (histórico de interações)
```sql
├─ id: UUID
├─ lead_id: UUID (FK → leads)
├─ user_id: UUID (FK → admin_users)
├─ tipo_contato: ENUM (whatsapp, telefone, email, pessoalmente, mensagem)
├─ resultado: VARCHAR
├─ observacoes: TEXT
├─ created_at
```

### **lead_objections**
```sql
├─ id: UUID
├─ lead_id: UUID (FK → leads)
├─ tipo_objecao: ENUM (preco, concorrencia, timing, necessidade, confianca, tecnica, outro)
├─ descricao: TEXT
├─ fase_objecao: ENUM (sdr, closer)
├─ resolvida: BOOLEAN
├─ solucao: TEXT
├─ registrado_por: UUID (FK → admin_users)
├─ created_at
```

### **meetings**
```sql
├─ id: UUID
├─ lead_id: UUID (FK → leads)
├─ sdr_id: UUID (FK → admin_users)
├─ closer_id: UUID (FK → admin_users)
├─ data_reuniao: TIMESTAMP
├─ local: VARCHAR
├─ status: ENUM (agendada, realizada, cancelada, nao_compareceu)
├─ resultado: VARCHAR
├─ observacoes: TEXT
├─ criada_por: UUID (FK → admin_users)
├─ created_at, updated_at
```

### **commissions** (integrado ao financeiro)
```sql
├─ id: UUID
├─ establishment_id: UUID (FK → establishments) ← CHAVE
├─ sdr_id: UUID (FK → admin_users)
├─ closer_id: UUID (FK → admin_users)
├─ plano_valor: DECIMAL (valor do plano)
├─ percentual_comissao: DECIMAL (default: 65.00%)
├─ valor_comissao: DECIMAL (calculado automaticamente)
├─ tipo_comissao: ENUM (primeira_venda, renovacao, upsell)
├─ mes_referencia: DATE
├─ status: ENUM (pendente, paga, cancelada)
├─ data_pagamento: TIMESTAMP
├─ observacoes: TEXT
├─ created_at, updated_at
```

---

## ⚙️ AUTOMATIZAÇÕES

### **TRIGGER: gerar_comissao_conversao**
```
Quando: lead.status = 'convertido' (foi atualizado de outro status)
Ação:
  1. Cria registro em commissions
  2. Calcula 65% do faturamento_estimado
  3. Status = 'pendente'
  4. Vincula ao SDR responsável
```

### **FUNÇÃO: converter_lead_para_estabelecimento**
```sql
converter_lead_para_estabelecimento(
  p_lead_id UUID,
  p_establishment_id UUID (OPCIONAL)
)
RETORNA: UUID (id do establishment)

Lógica:
  1. Se establishment_id não informado:
     └─ Cria novo establishment com dados do lead
  2. Vincula lead ao establishment
  3. Atualiza status = 'convertido'
  4. TRIGGER gera comissão automaticamente
```

---

## 📊 VIEWS DE RELATÓRIO

### **vw_performance_sdr**
```
├─ user_id
├─ sdr_nome
├─ total_leads
├─ leads_convertidos
├─ contatos_realizados
├─ reunioes_marcadas
├─ taxa_conversao (%)
├─ total_comissao
└─ comissao_paga
```

### **vw_performance_closer**
```
├─ user_id
├─ closer_nome
├─ reunioes_realizadas
├─ reunioes_concluidas
├─ vendas_fechadas
├─ total_comissao
├─ comissao_paga
└─ comissao_pendente
```

### **vw_pipeline_comercial**
```
├─ lead_id
├─ nome_estabelecimento
├─ tipo
├─ status
├─ sdr_responsavel_id / sdr_nome
├─ total_contatos
├─ total_objecoes
├─ total_reunioes
├─ ultimo_contato
├─ faturamento_estimado
└─ comissao_esperada
```

### **vw_resumo_leads_status**
```
├─ status
├─ total_leads
├─ sdrs_envolvidos
├─ estabelecimentos_vinculados
├─ faturamento_medio_estimado
└─ ultima_atualizacao
```

---

## 💰 CÁLCULO DE COMISSÕES

### **Primeira Venda (SDR)**
```
Fórmula: plano_valor × 65%
Exemplo: R$ 160 × 0,65 = R$ 104

Quando: Na data da conversão do lead
Status: 'pendente' até aprovação do admin
```

### **Futuras Expansões (Estrutura Pronta)**
```
- Renovação (% menor, máximo 12 meses)
- Upsell (venda adicional)
- Salário fixo + comissão
- Comissão compartilhada (SDR + Closer)
```

---

## 🔐 SEGURANÇA E PERMISSÕES

### **RLS (Row Level Security) Futura**
```
SDR vê:
  - Apenas seus próprios leads
  - Suas reuniões como SDR
  - Suas comissões

Closer vê:
  - Apenas suas reuniões
  - Apenas suas comissões

Admin vê:
  - Tudo
```

---

## 🔄 FLUXO DE CONVERSÃO DETALHADO

```
1. SDR cria lead
   ├─ nome_estabelecimento
   ├─ responsavel_nome
   ├─ tipo de negócio
   └─ origem

2. SDR interage (múltiplos contatos)
   ├─ lead_contacts (histórico)
   └─ lead_objections (objeções resolvidas)

3. SDR marca reunião
   ├─ Cria meeting com SDR + Closer
   └─ status = 'agendada'

4. Closer realiza reunião
   ├─ Atualiza meeting.status = 'realizada'
   ├─ Registra resultado
   └─ Se sucesso:
       │
       └─ 5. Lead é marcado como convertido
           ├─ UPDATE leads SET status = 'convertido'
           │
           └─ TRIGGER executa automaticamente:
               ├─ Cria establishment (se novo)
               ├─ Ativa no sistema de faturamento
               ├─ Cria comissão em 'pendente'
               └─ Associa SDR à comissão

6. Financeiro recebe novo establishment
   ├─ Entra automaticamente no sistema de taxas
   ├─ Começa a gerar withdrawal_requests
   └─ Comissão fica vinculada ao primeiro faturamento
```

---

## 📈 INTEGRAÇÕES COM SISTEMA EXISTENTE

### **Sem Duplicação:**
- ✅ Reutiliza tabela `establishments`
- ✅ Reutiliza `admin_users` (apenas novo role)
- ✅ Reutiliza sistema de `withdrawal_requests` existente
- ✅ Reutiliza cálculo de taxas (Pix 2%, Crédito 0,5%)

### **Dados que Fluem:**
```
Leads → Establishments → Orders → Revenue → Withdrawals → Commissions
                                                              ↑
                                           (Automaticamente vinculado)
```

---

## 🚀 PRÓXIMOS PASSOS (SEM IMPLEMENTAR AGORA)

- [ ] Integração WhatsApp (criar tabela de templates)
- [ ] Automação de leads (CRM externo)
- [ ] Comissão compartilhada (SDR + Closer)
- [ ] Metas e bônus
- [ ] Relatórios avançados
- [ ] Integração com email/calendário
- [ ] Mobile app para SDR/Closer
- [ ] Notification system

---

## 📝 NOTA IMPORTANTE

**Este módulo foi projetado para:**
- ✅ Estender, não duplicar
- ✅ Integrar-se perfeitamente ao financeiro existente
- ✅ Ser escalável e flexível
- ✅ Manter rastreabilidade completa
- ✅ Permitir análise comercial detalhada

**Status:** Pronto para desenvolvimento de UI/UX

