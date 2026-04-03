# ✅ VALIDATION CHECKLIST - BANCO DE DADOS PRONTO

## Objetivo
Verificar que o banco de dados foi criado corretamente e está pronto para uso.

---

## 📋 CHECKLIST DE VALIDAÇÃO

### 1. NOVAS TABELAS CRIADAS ✅

```sql
-- Executar em Supabase SQL Editor:

-- Verificar leads
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'leads';
-- Deve retornar: leads

-- Verificar lead_contacts
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'lead_contacts';
-- Deve retornar: lead_contacts

-- Verificar lead_objections
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'lead_objections';
-- Deve retornar: lead_objections

-- Verificar meetings
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'meetings';
-- Deve retornar: meetings

-- Verificar commissions
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'commissions';
-- Deve retornar: commissions

✅ RESULTADO ESPERADO: Todos os 5 retornam as tabelas
```

---

### 2. CAMPOS CORRETOS EM LEADS ✅

```sql
SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'leads' 
ORDER BY ordinal_position;

✅ DEVE INCLUIR:
├─ id (UUID)
├─ establishment_id (UUID)
├─ nome_estabelecimento (VARCHAR)
├─ tipo (VARCHAR/ENUM)
├─ responsavel_nome (VARCHAR)
├─ responsavel_telefone (VARCHAR)
├─ responsavel_whatsapp (VARCHAR)
├─ responsavel_email (VARCHAR)
├─ instagram (VARCHAR)
├─ cidade (VARCHAR)
├─ estado (VARCHAR)
├─ faturamento_estimado (NUMERIC)
├─ origem_lead (VARCHAR)
├─ sdr_responsavel_id (UUID)
├─ status (VARCHAR)
├─ motivo_perda (TEXT)
├─ data_conversao (TIMESTAMP)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)
```

---

### 3. ADMIN_USERS ROLE ATUALIZADO ✅

```sql
SELECT constraint_name, constraint_type 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'admin_users';

-- Procurar por role CHECK constraint

✅ DEVE INCLUIR ROLES:
├─ super_admin
├─ admin
├─ viewer
├─ sdr (NOVO)
└─ closer (NOVO)

-- Verificação completa:
SELECT column_name, data_type 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'admin_users' AND column_name = 'role';
```

---

### 4. ÍNDICES CRIADOS ✅

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'lead_contacts', 'meetings', 'commissions')
ORDER BY tablename;

✅ DEVE INCLUIR:
leads:
├─ idx_leads_sdr_status
├─ idx_leads_establishment
├─ idx_leads_status_date
└─ idx_leads_origem

lead_contacts:
├─ idx_lead_contacts_lead
├─ idx_lead_contacts_user
└─ idx_lead_contacts_created

lead_objections:
├─ idx_lead_objections_lead
└─ idx_lead_objections_tipo

meetings:
├─ idx_meetings_lead
├─ idx_meetings_sdr
├─ idx_meetings_closer
├─ idx_meetings_status_date
└─ idx_meetings_data

commissions:
├─ idx_commissions_establishment
├─ idx_commissions_sdr
├─ idx_commissions_status_periodo
├─ idx_commissions_mes_referencia
└─ idx_commissions_tipo_comissao

TOTAL ESPERADO: 14+ índices
```

---

### 5. VIEWS CRIADAS ✅

```sql
SELECT table_name, table_type 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' 
AND table_type = 'VIEW'
ORDER BY table_name;

✅ DEVE INCLUIR:
├─ vw_performance_sdr (NOVO)
├─ vw_performance_closer (NOVO)
├─ vw_resumo_leads_status (NOVO)
├─ vw_pipeline_comercial (NOVO)
└─ (+ views existentes)

-- Validar estrutura de uma view:
SELECT column_name, udt_name 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE table_name = 'vw_performance_sdr';
```

---

### 6. FUNÇÕES CRIADAS ✅

```sql
SELECT routine_name, routine_type 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE routine_schema = 'public' 
AND routine_name IN ('converter_lead_para_estabelecimento', 'gerar_comissao_conversao');

✅ DEVE RETORNAR:
├─ converter_lead_para_estabelecimento (FUNCTION)
└─ gerar_comissao_conversao (FUNCTION)

-- Verificar função de conversão:
SELECT routine_definition 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE routine_name = 'converter_lead_para_estabelecimento';

-- Deve conter lógica de:
-- ├─ Checar se establishment_id é NULL
-- ├─ Criar novo establishment se necessário
-- ├─ Vincular lead
-- ├─ Atualizar status
-- └─ Retornar establishment_id

-- Verificar função de comissão:
SELECT routine_definition 
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE routine_name = 'gerar_comissao_conversao';

-- Deve conter:
-- ├─ Check IF NEW.status = 'convertido'
-- ├─ Calcular 65% de comissão
-- ├─ INSERT INTO commissions
-- └─ RETURN NEW
```

---

### 7. TRIGGERS CRIADOS ✅

```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE trigger_schema = 'public' 
AND event_object_table = 'leads';

✅ DEVE INCLUIR:
├─ trigger_gerar_comissao_conversao (AFTER UPDATE)
└─ (+ triggers de updated_at existentes)

-- Verificar detalhes do trigger:
SELECT * FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE trigger_name = 'trigger_gerar_comissao_conversao';

-- Deve mostrar:
├─ AFTER UPDATE
├─ FOR EACH ROW
├─ EXECUTE FUNCTION gerar_comissao_conversao()
```

---

### 8. FOREIGN KEYS CORRETOS ✅

```sql
-- Verificar FK em leads
SELECT constraint_name, table_name, column_name, 
       referenced_table_name, referenced_column_name
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'leads' 
AND COLUMN_NAME IN ('establishment_id', 'sdr_responsavel_id');

✅ DEVE INCLUIR:
├─ FK: leads.establishment_id → establishments.id
├─ FK: leads.sdr_responsavel_id → admin_users.id

-- Verificar FK em commissions
SELECT constraint_name, table_name, column_name
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'commissions'
AND REFERENCED_TABLE_NAME IS NOT NULL;

✅ DEVE INCLUIR:
├─ FK: commissions.establishment_id → establishments.id
├─ FK: commissions.sdr_id → admin_users.id
└─ FK: commissions.closer_id → admin_users.id [nullable]
```

---

### 9. CONSTRAINTS FUNCIONANDO ✅

```sql
-- Testar NOT NULL
INSERT INTO leads (nome_estabelecimento) VALUES (NULL);
-- ❌ Deve falhar: "não posso inserir NULL em nome_estabelecimento"

-- Testar ENUM status
INSERT INTO leads (nome_estabelecimento, status) 
VALUES ('Test', 'status_invalido');
-- ❌ Deve falhar: "novo, contato_realizado, etc apenas"

-- Testar FK
INSERT INTO leads (
  nome_estabelecimento, 
  sdr_responsavel_id
) VALUES (
  'Test',
  'invalid-uuid'
);
-- ❌ Deve falhar: "sdr_responsavel_id não existe em admin_users"
```

---

### 10. PERMISSÕES RLS SETUP ✅

```sql
-- Verificar se RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('leads', 'commissions', 'meetings');

✅ DEVE RETORNAR:
├─ leads: relrowsecurity = true (ready)
├─ commissions: relrowsecurity = true (ready)
└─ meetings: relrowsecurity = true (ready)

-- Se tudo retorna 'true', RLS está pronto para ativar

-- NÃO ATIVAR AGORA (será usado depois):
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "sdr_ver_apenas_proprios" ON leads ...
```

---

## 📊 TESTE COMPLETO DE FLUXO

### Teste 1: Criar um Lead

```sql
-- 1. Verificar que existe um SDR no sistema
SELECT id, name, role FROM admin_users WHERE role = 'sdr' LIMIT 1;
-- Se vazio, criar:
-- INSERT INTO admin_users (name, email, role) 
-- VALUES ('João SDR', 'joao@baron.com', 'sdr');

-- 2. Inserir um lead de teste
INSERT INTO leads (
  nome_estabelecimento,
  tipo,
  responsavel_nome,
  responsavel_telefone,
  responsavel_whatsapp,
  responsavel_email,
  cidade,
  estado,
  faturamento_estimado,
  origem_lead,
  sdr_responsavel_id,
  status
) VALUES (
  'Bar do Teste',
  'bar',
  'João Silva',
  '11999999999',
  '11999999999',
  'joao@teste.com',
  'São Paulo',
  'SP',
  160.00,
  'prospeccao',
  'REPLACE_WITH_SDR_ID_HERE',
  'novo'
) RETURNING id;

✅ DEVE RETORNAR: Uma UUID (ex: 'abc-123-def')
```

### Teste 2: Registrar Interação

```sql
-- Assumindo que você criou um lead com id = 'lead-123'

INSERT INTO lead_contacts (
  lead_id,
  user_id,
  tipo_contato,
  resultado,
  observacoes
) VALUES (
  'lead-123',
  'REPLACE_WITH_USER_ID',
  'whatsapp',
  'Respondeu com interesse',
  'Cliente pediu mais informações sobre preço'
) RETURNING id;

✅ DEVE RETORNAR: Uma UUID
```

### Teste 3: Converter Lead (TRIGGER)

```sql
-- Atualizar lead para convertido (ISTO DEVE DISPARAR O TRIGGER!)

UPDATE leads 
SET status = 'convertido'
WHERE id = 'lead-123'
RETURNING id, status;

✅ DEVE RETORNAR: id, status='convertido'

-- 2. Verificar que comissão foi criada automaticamente:
SELECT * FROM commissions WHERE lead_id = 'lead-123';

✅ DEVE RETORNAR:
├─ establishment_id: (criado automaticamente)
├─ sdr_id: (do lead)
├─ valor_comissao: 104.00 (65% de 160)
├─ status: 'pendente'
└─ mes_referencia: 2024-01-01 (1º dia do mês)

// SE NÃO APARECEU NADA, O TRIGGER NÃO DISPAROU!
// Verificar: SELECT * FROM pg_trigger WHERE tgname = 'trigger_gerar_comissao_conversao';
```

### Teste 4: Verificar Views

```sql
-- Dashboard SDR
SELECT * FROM vw_performance_sdr WHERE user_id = 'REPLACE_WITH_SDR_ID';

✅ DEVE RETORNAR:
├─ total_leads: 1
├─ leads_convertidos: 1
├─ taxa_conversao: 100.00
├─ total_comissao: 104.00
├─ comissao_paga: 0
└─ comissao_pendente: 104.00

-- Pipeline Comercial (visão completa)
SELECT * FROM vw_pipeline_comercial LIMIT 1;

✅ DEVE RETORNAR: Uma linha com todos os dados agregados
```

---

## 🔍 DEBUG: SE ALGO NÃO FUNCIONAR

### Problema: Trigger não disparou

```sql
-- 1. Verificar que o trigger existe:
SELECT * FROM pg_trigger WHERE tgname = 'trigger_gerar_comissao_conversao';
-- Se vazio = trigger não foi criado

-- 2. Verificar que a função existe:
SELECT * FROM pg_proc WHERE proname = 'gerar_comissao_conversao';
-- Se vazio = função não foi criada

-- 3. Verificar erros recentes:
SELECT * FROM pg_stat_statements WHERE query LIKE '%gerar_comissao%';

-- 4. Tente criar manualmente (para testar):
SELECT gerar_comissao_conversao();
```

### Problema: FK constraint failed

```sql
-- Erro: "violação de constraint de chave estrangeira"

-- Solução: Verificar se o ID referenciado existe
SELECT id FROM admin_users WHERE id = 'REPLACE_WITH_USER_ID';
-- Se vazio = user não existe

SELECT id FROM establishments WHERE id = 'REPLACE_WITH_ESTAB_ID';
-- Se vazio = establishment não existe
```

### Problema: Campo não existe

```sql
-- Erro: "coluna 'xyz' não existe"

-- Solução: Verificar estrutura da tabela
SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'leads';

-- Procurar pelo campo correto
```

---

## 📈 PERFORMANCE CHECK

```sql
-- Verificar que os índices estão sendo usados

-- Query 1: Filtrar leads por SDR (deve ser rápido)
EXPLAIN ANALYZE
SELECT * FROM leads 
WHERE sdr_responsavel_id = 'abc-123' 
AND status = 'novo'
LIMIT 10;

✅ DEVE MOSTRAR: "Index Scan on idx_leads_sdr_status" (não "Seq Scan")

-- Query 2: Aggregação por mês (deve ser rápido)
EXPLAIN ANALYZE
SELECT mes_referencia, SUM(valor_comissao) 
FROM commissions 
GROUP BY mes_referencia;

✅ DEVE MOSTRAR: "Index Scan on idx_commissions_mes_referencia"
```

---

## ✅ FINAL VALIDATION

Se tudo passou, você pode marcar como:

- [x] Tabelas criadas
- [x] Campos corretos
- [x] Roles atualizadas
- [x] Índices criados
- [x] Views criadas
- [x] Funções criadas
- [x] Triggers criados
- [x] FKs validadas
- [x] Constraints testadas
- [x] Fluxo completo funciona
- [x] Views retornam dados
- [x] Performance OK
- [x] RLS pronto

**✅ DATABASE LAYER: PRONTO PARA PRODUÇÃO**

---

## 🚀 PRÓXIMO PASSO

Criar TypeScript Types em `src/integrations/supabase/types.ts`

```typescript
export interface Lead {
  id: string;
  establishment_id?: string | null;
  nome_estabelecimento: string;
  // ... resto dos campos
}

export interface Commission {
  // ... campos
}
```

Sem tipos TypeScript, não conseguiremos implementar os API endpoints!

---

**Last Updated:** 2024
**Status:** ✅ VALIDATION READY

