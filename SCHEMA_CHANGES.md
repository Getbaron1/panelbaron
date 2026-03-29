# Alterações do Schema do Banco de Dados

## Resumo das Mudanças

### 1. Renomeação da Tabela `estabelecimentos` → `establishments`
- Tabela principal renomeada para melhor consistência com o padrão internacional
- Todos os índices e triggers foram atualizados
- Todas as referências em Views foram ajustadas

**Afetado:**
- Tabela: `estabelecimentos` → `establishments`
- Índices atualizados
- Triggers atualizados
- Views: `vw_resumo_estabelecimentos`
- Funções: `get_dashboard_stats()`

### 2. Renomeação de Coluna: `estabelecimento_id` → `establishment_id`
Todas as tabelas relacionadas foram atualizadas para usar `establishment_id`:
- `categorias`
- `produtos`
- `clientes`
- `pedidos`
- `faturamento_diario`
- `withdrawal_requests` (antes `withdrawals`)

### 3. Simplificação da Tabela `withdrawals` → `withdrawal_requests`

**Antes:**
```sql
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estabelecimento_id UUID NOT NULL,
    gross_revenue DECIMAL(12, 2) NOT NULL,
    card_transactions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pix_transactions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pix_key VARCHAR(255) NOT NULL,
    pix_key_full VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Depois:**
```sql
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,  -- Valor já descontadas as taxas
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Mudanças Principais:**
- Campo `gross_revenue` substituído por `amount` (já com taxas descontadas)
- Campos `card_transactions`, `pix_transactions`, `pix_key`, `pix_key_full` removidos
- PIX agora é armazenado no estabelecimento, não na solicitação de saque
- Foco apenas no valor líquido a ser liberado

### 4. Remoção da Tabela `withdrawal_transactions`
- Tabela de mapeamento de transações removida
- O cálculo de taxas agora é feito antes de criar a solicitação de saque
- Simplifica o fluxo de dados

### 5. Remoção de Campos de Faturamento
Na tabela `faturamento_diario`:
- ❌ `valor_entrega` - removido
- ❌ `valor_desconto` - removido
- ❌ `ticket_medio` - removido
- ❌ `pedidos_cancelados` - removido

**Motivo:** O valor total já representa o valor líquido após taxas. Estes campos não são necessários.

### 6. Atualização da Tabela `audit_logs`
- Campo `withdrawal_id` → `withdrawal_request_id`
- Referência mantém coerência com nova tabela

## Código TypeScript Atualizado

### Arquivos Modificados:

1. **src/integrations/supabase/client.ts**
   - Queries atualizadas para usar `establishment_id`

2. **src/integrations/supabase/types.ts**
   - Tipos removidos relacionados a MercadoPago
   - Campos renomeados para inglês

3. **src/lib/supabase.ts**
   - Interfaces atualizadas
   - Queries ajustadas
   - Nomes de parâmetros padronizados

4. **src/pages/Faturamento.tsx**
   - Interface `Withdrawal` simplificada
   - Cálculos de taxa removidos (já vêm descontados)
   - Mock data atualizado
   - Exibição de "amount" direto (sem cálculos)

5. **src/lib/mockData.ts**
   - Todos os `estabelecimento_id` renomeados para `establishment_id`

## Fluxo de Saques Simplificado

**Antes:**
1. Saque registra `gross_revenue` + breakdown de transações
2. `withdrawal_transactions` mapeia cada pedido para o saque
3. Cálculo de taxas feito na visualização
4. Armazenava PIX por saque

**Depois:**
1. Estabelecimento faz solicitação com `amount` (já com taxas descontadas)
2. Sem tabela intermediária
3. Valor já é o valor líquido a pagar
4. PIX armazenado apenas no estabelecimento

## Status RLS (Row Level Security)
- Atualizado para `establishments` table
- Outras tabelas mantêm suas políticas

## Views Atualizadas
- `vw_resumo_estabelecimentos`
- `vw_faturamento_mensal`
- `vw_produtos_mais_vendidos`

## Funções SQL Atualizadas
- `get_dashboard_stats()`
- `get_faturamento_periodo()`

---

**Data:** 6 de Fevereiro, 2026
**Motivo:** Simplificação do modelo de dados e padronização de nomenclatura
