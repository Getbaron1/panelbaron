# 🎯 Barra Animada de Meta Mensal - Guia de Uso

## ✨ O Que Mudou

### ❌ Removido
- Página de Rankings (`/comercial/rankings`)
- Botão "Rankings" no menu de gestão comercial

### ✅ Adicionado
- **Barra Animada de Meta** no topo da página de Gestão Comercial
- Mostra progresso em tempo real conforme closes de venda
- Admin Master pode editar a meta mês a mês

---

## 🎨 Características da Barra

```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Meta do Mês - Fevereiro 2025                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Meta: R$ 5.000,00 │ Realizado: R$ 2.350,00 │ Faltando: R$ │
│                                                             │
│ Progresso: 47.0%                                            │
│ ╔═══════════════════════════════════════════════════╗       │
│ ║░░░░░░░░░░░░░░░░░░░░░░░░░░  47.0% █░░░░░░░░░░░░║       │
│ ╚═══════════════════════════════════════════════════╝       │
│                                                             │
│ 📊 5 comissão(ões) registrada(s)                            │
│ [ Editar Meta ] ✏️                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🌈 Cores Dinâmicas

| Progresso | Cor | Significado |
|-----------|-----|-------------|
| 0-49% | 🔴 Vermelho/Laranja | Muito atrás da meta |
| 50-74% | 🟡 Amarelo/Laranja | Próximo de atingir |
| 75-99% | 🔵 Azul/Cyan | Quase lá! |
| 100%+ | 🟢 Verde | Meta atingida! |

### ✨ Animações

1. **Brilho**: Barra tem um brilho animado que passa da esquerda para a direita
2. **Transição Suave**: Quando atualiza, a barra cresce suavemente (700ms)
3. **Atualização em Tempo Real**: A cada 10 segundos, carrega o novo progresso

---

## 🚀 Como Usar

### 1️⃣ Executar SQL no Supabase

Execute o arquivo `database/SETUP_MONTHLY_TARGETS.sql`:

```sql
-- Criar tabela de metas mensais
CREATE TABLE monthly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes_ano DATE NOT NULL UNIQUE,
    meta_value DECIMAL(14, 2) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true
);

-- Inserir meta de exemplo
INSERT INTO monthly_targets (mes_ano, meta_value, descricao, ativo)
VALUES 
    (DATE_TRUNC('month', NOW())::date, 5000.00, 'Meta de fevereiro 2025', true);
```

### 2️⃣ Acessar a Página

1. Vá para: **Gestão Comercial** (`/comercial`)
2. Veja a barra de meta no **topo** antes dos stats cards
3. A barra mostra:
   - Meta do mês
   - Valor realizado (baseado em comissões pagas)
   - Percentual de progresso
   - Valor ainda faltando

### 3️⃣ Editar a Meta

1. Clique no botão **"Editar Meta"** ✏️
2. Digite o novo valor
3. Clique em **"Salvar"**
4. Barra atualiza automaticamente

---

## 📊 Como a Barra Calcula o Progresso

```
Valor Realizado = SOMA de todas as comissões PAGAS do mês

Percentual = (Valor Realizado / Meta) × 100

Valor Faltando = Meta - Valor Realizado

Status:
  ✅ 100%+ = Meta atingida!
  🔄 < 100% = Ainda faltando X reais
```

### Exemplo

```
Meta do Mês: R$ 5.000,00
Comissões Pagas (Fevereiro): R$ 2.350,00

Percentual = (2.350 / 5.000) × 100 = 47%
Faltando = 5.000 - 2.350 = R$ 2.650,00

Barra mostra:
  - Meta: R$ 5.000,00
  - Realizado: R$ 2.350,00 (verde)
  - Faltando: R$ 2.650,00 (laranja)
  - Progresso: 47.0%
  - Cores: Laranja (porque 47% < 50%)
```

---

## 🔄 Atualização em Tempo Real

A barra se atualiza automaticamente:

1. **Ao abrir a página**: Carrega a meta e progresso
2. **A cada 10 segundos**: Verifica se há novas comissões pagas
3. **Ao editar meta**: Atualiza imediatamente após salvar

---

## 📝 Exemplos de Uso

### Cenário 1: Acompanhando o Mês

```
Dia 1 do mês:
  Meta: R$ 10.000
  Realizado: R$ 0
  Progresso: 0% 🔴

Dia 10 do mês (após closes):
  Meta: R$ 10.000
  Realizado: R$ 2.500
  Progresso: 25% 🔴

Dia 20 do mês:
  Meta: R$ 10.000
  Realizado: R$ 7.500
  Progresso: 75% 🔵

Dia 25 do mês:
  Meta: R$ 10.000
  Realizado: R$ 10.500
  Progresso: 105% 🟢 ✅ META ATINGIDA!
```

### Cenário 2: Ajustando a Meta

```
1. Início do mês: Meta de R$ 5.000
2. No meio do mês, vê que a equipe está muito rápida
3. Clica "Editar Meta" e sube para R$ 7.500
4. A barra recalcula e mostra o novo progresso
```

---

## 🎯 Integração com o Sistema

A barra lê dados de:

### Tabela: `monthly_targets`
```sql
mes_ano: Data do mês (ex: 2025-02-01)
meta_value: Valor da meta (ex: 5000.00)
descricao: Descrição (ex: "Meta de fevereiro 2025")
ativo: Booleano (true/false)
```

### View: `vw_monthly_progress`
```sql
SELECT 
    mes_ano,
    meta_value,
    valor_realizado,        -- Soma de comissões
    percentual_atingido,    -- Percentual (0-100+)
    valor_faltante,         -- Meta - Realizado
    total_comissoes         -- Contagem de comissões
FROM vw_monthly_progress
```

---

## 💾 Dados Armazenados

### monthly_targets
```
id: UUID único
mes_ano: 2025-02-01 (primeiro dia do mês)
meta_value: 5000.00
descricao: "Meta de fevereiro 2025"
ativo: true
created_at: timestamp
updated_at: timestamp
```

---

## 🔍 Verificações

### Ver metas cadastradas:
```sql
SELECT mes_ano, meta_value, descricao 
FROM monthly_targets 
ORDER BY mes_ano DESC;
```

### Ver progresso atual:
```sql
SELECT mes_ano, meta_value, valor_realizado, percentual_atingido
FROM vw_monthly_progress;
```

### Ver comissões do mês:
```sql
SELECT DATE_TRUNC('month', created_at), COUNT(*), SUM(valor_comissao)
FROM commissions
WHERE status = 'paga'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY 1 DESC;
```

---

## ⚙️ Configurações Técnicas

### Arquivo: `src/components/comercial/MonthlyTargetBar.tsx`
- 📍 Tamanho: ~250 linhas
- 🎨 Componente React com hooks
- 🔄 Atualização a cada 10 segundos
- 💾 Integrado com Supabase
- ✨ Animações CSS

### Arquivo: `database/SETUP_MONTHLY_TARGETS.sql`
- 📍 Tamanho: ~85 linhas
- 📊 Cria tabela `monthly_targets`
- 🔍 Cria view `vw_monthly_progress`
- 🔄 Trigger para updated_at

---

## 🎓 Fluxo Completo

```
1. Admin Master define meta do mês
   └─ INSERT INTO monthly_targets

2. Equipe vende e gera comissões
   └─ INSERT INTO commissions

3. Admin aprova comissões
   └─ UPDATE commissions SET status = 'paga'

4. Barra atualiza automaticamente
   └─ SELECT * FROM vw_monthly_progress

5. Barra mostra progresso em tempo real
   └─ Animação suave, cores dinâmicas

6. Se precisa ajustar meta, edita
   └─ UPDATE monthly_targets SET meta_value
```

---

## 📱 Layout Responsivo

```
DESKTOP (1200px+)
┌────────────────────────────────────────────────────────────┐
│ 🎯 Meta do Mês - Fevereiro 2025                       Feb  │
├────────────────────────────────────────────────────────────┤
│ Meta: R$ 5K │ Real: R$ 2.3K │ Falta: R$ 2.7K              │
│ ████████░░░░░░░░░░░░░░░░░ 47.0%                           │
│ 📊 5 comissões  [Editar Meta]                              │
└────────────────────────────────────────────────────────────┘

MOBILE (< 768px)
┌─────────────────────────────────┐
│ 🎯 Meta do Mês - Fevereiro      │
├─────────────────────────────────┤
│ Meta: R$ 5K                     │
│ Real: R$ 2.3K  Falta: R$ 2.7K  │
│ ████████░░░░░░░░░░ 47.0%       │
│ 📊 5 comissões                  │
│ [Editar Meta]                   │
└─────────────────────────────────┘
```

---

## ✨ Benefícios

✅ **Motivação da equipe**: Veem o progresso em tempo real
✅ **Decisão rápida**: Admin ajusta meta conforme necessário
✅ **Visualização clara**: Barra animada é autoexplicativa
✅ **Dados confiáveis**: Conecta direto ao banco de comissões
✅ **Performance**: Atualiza a cada 10s (não sobrecarrega)

---

## 📌 Próximas Ações

1. ✅ Execute `SETUP_MONTHLY_TARGETS.sql` no Supabase
2. ✅ Acesse `/comercial` para ver a barra
3. ✅ Crie algumas comissões (elas atualizam automático)
4. ✅ Teste editar a meta
5. ✅ Veja a barra atualizar em tempo real

---

**Status**: ✅ PRONTO PARA USAR

Commit: `fe795a3`
Build: ✓ 2235 modules transformed
