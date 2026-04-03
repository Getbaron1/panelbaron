# 🚀 DEPLOYMENT GUIDE - BANCO DE DADOS

## Objetivo
Guia passo-a-passo para colocar o schema novo em produção no Supabase.

---

## ⚠️ PRÉ-REQUISITOS

- [ ] Backup recente do banco de dados
- [ ] Acesso de admin ao Supabase
- [ ] Sem usuários conectados no sistema durante deploy
- [ ] Schema.sql atualizado em `database/schema.sql`

---

## 📝 PASSO 1: BACKUP DO BANCO

### Option 1: Via Supabase Console (Recomendado)

1. Ir para [Supabase Dashboard](https://app.supabase.com)
2. Selecionar seu projeto
3. Settings → Backups
4. Clicar em "Request a backup"

**⏱️ Tempo:** 5-10 minutos

### Option 2: Via SQL Export

```sql
-- No Supabase SQL Editor, executar:
pg_dump --host db.xxxxx.supabase.co \
        --port 5432 \
        --username postgres \
        --database postgres \
        --format plain \
        > backup_$(date +%Y%m%d).sql
```

**Resultado:** Arquivo SQL com backup completo

---

## 🔄 PASSO 2: REVISAR SCHEMA.SQL

### Checklist antes do deploy:

```sql
-- Verificar que o arquivo contém:
grep -n "CREATE TABLE leads" database/schema.sql
grep -n "CREATE TABLE commissions" database/schema.sql
grep -n "CREATE TRIGGER trigger_gerar_comissao_conversao" database/schema.sql
grep -n "CREATE OR REPLACE FUNCTION gerar_comissao_conversao" database/schema.sql

✅ Todos devem retornar resultados (linhas onde estão)
```

### Validar sintaxe SQL:

```bash
# Linux/Mac:
sqlcheck database/schema.sql

# Ou usar online: https://www.sqlvalidator.com/
```

---

## 🌐 PASSO 3: DEPLOY NO SUPABASE

### Option 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link projeto local ao Supabase
supabase link --project-ref xxxxx

# 4. Executar migrations
supabase db push

# 5. Verificar status
supabase status
```

### Option 2: Via SQL Editor Direto

1. Abrir [Supabase Console](https://app.supabase.com)
2. Ir para SQL Editor
3. Criar nova query
4. Copiar conteúdo de `database/schema.sql`
5. Colar na query
6. Clicar "Run"

**⚠️ Isso pode ser lento se o arquivo for grande!**

### Option 3: Via Script Bash

```bash
#!/bin/bash

# variables
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="xxxxx"
DB_PASSWORD="xxxxx"

# Deploy schema
PGPASSWORD="$DB_PASSWORD" psql \
  -h db.xxxxx.supabase.co \
  -U postgres \
  -d postgres \
  -f database/schema.sql

echo "✅ Schema deployed successfully"
```

---

## ✅ PASSO 4: VALIDAR DEPLOY

### Verificar que tudo foi criado:

```sql
-- No Supabase SQL Editor:

-- 1. Contar tabelas novas
SELECT COUNT(*) as total_tables 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public';

-- Esperado: > 25 (era ~20, agora +5 tabelas)

-- 2. Verificar tabelas específicas
SELECT table_name FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' 
AND table_name IN ('leads', 'lead_contacts', 'lead_objections', 'meetings', 'commissions');

-- Esperado: 5 linhas

-- 3. Verificar views novas
SELECT table_name FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'public' 
AND table_type = 'VIEW'
AND table_name LIKE 'vw_%';

-- Esperado: 11+ views (incluindo as 4 novas)

-- 4. Verificar funções novas
SELECT proname FROM pg_proc 
WHERE proname IN ('gerar_comissao_conversao', 'converter_lead_para_estabelecimento');

-- Esperado: 2 linhas

-- 5. Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_gerar_comissao_conversao';

-- Esperado: 1 linha
```

---

## 🧪 PASSO 5: TESTE BÁSICO

### Teste sem risco: Inserir lead de teste

```sql
-- 1. Pegar um SDR ID (ou criar um teste)
SELECT id FROM admin_users WHERE role = 'sdr' LIMIT 1;
-- Se vazio:
INSERT INTO admin_users (name, email, role) 
VALUES ('SDR Teste', 'sdr.teste@baron.com', 'sdr')
RETURNING id;

-- 2. Copiar o UUID retornado

-- 3. Inserir lead de teste
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
  'Teste Bar Deploy',
  'bar',
  'João Tester',
  '11999999999',
  '11999999999',
  'teste@baron.com',
  'São Paulo',
  'SP',
  160.00,
  'prospeccao',
  'COLE_O_SDR_UUID_AQUI',
  'novo'
) RETURNING id;

-- Copiar o UUID retornado

-- 4. Converter para testar trigger
UPDATE leads 
SET status = 'convertido'
WHERE id = 'COLE_O_LEAD_UUID_AQUI'
RETURNING id, status, establishment_id;

-- Esperado:
-- id: [uuid]
-- status: 'convertido'
-- establishment_id: [novo uuid criado pelo trigger]

-- 5. Verificar comissão foi criada
SELECT id, valor_comissao, status 
FROM commissions 
WHERE establishment_id = (
  SELECT establishment_id FROM leads WHERE id = 'COLE_O_LEAD_UUID_AQUI'
);

-- Esperado: 1 linha com valor_comissao ≈ 104.00 (65% de 160)
```

### Se tudo retornar resultados esperados: ✅ DEPLOY BEM-SUCEDIDO

---

## 🗑️ PASSO 6: LIMPEZA DE TESTE

### Remover dados de teste:

```sql
-- 1. Deletar comissões de teste
DELETE FROM commissions 
WHERE establishment_id IN (
  SELECT establishment_id FROM leads 
  WHERE nome_estabelecimento LIKE '%Teste%' 
  OR nome_estabelecimento LIKE '%Test%'
);

-- 2. Deletar leads de teste
DELETE FROM leads 
WHERE nome_estabelecimento LIKE '%Teste%' 
OR nome_estabelecimento LIKE '%Test%';

-- 3. Deletar SDR teste (opcional)
DELETE FROM admin_users 
WHERE email = 'sdr.teste@baron.com';

-- 4. Deletar establishment teste (opcional)
DELETE FROM establishments 
WHERE name LIKE '%Teste%' OR name LIKE '%Test%';
```

---

## 🔒 PASSO 7: SEGURANÇA

### Ativar Row Level Security (RLS) - FUTURO

```sql
-- ⚠️ NÃO EXECUTAR AGORA!
-- Isso é para depois, quando os API endpoints estiverem prontos

-- Habilitar RLS nas tabelas comerciais
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Criar políticas (exemplos)
-- CREATE POLICY "sdr_ver_apenas_proprios" ON leads
--   FOR SELECT USING (sdr_responsavel_id = auth.uid());

-- CREATE POLICY "admin_ver_todos" ON leads
--   USING (auth.jwt() ->> 'role' = 'admin');
```

**Ativar apenas quando os endpoints estiverem prontos!**

---

## 📊 PASSO 8: MONITORAMENTO

### Verificar health do banco após deploy:

```sql
-- 1. Verificar conexões
SELECT count(*) as active_connections FROM pg_stat_activity;
-- Esperado: < 20

-- 2. Verificar tamanho do banco
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as total_size,
  (SELECT pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) 
   FROM pg_tables WHERE schemaname='public') as tables_size;
-- Esperado: < 100 MB (era ~10 MB, agora +10 MB das novas tabelas)

-- 3. Verificar últimas queries lentas
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
-- Esperado: Nenhuma query > 1000ms

-- 4. Verificar replicação (se usar)
SELECT slot_name, restart_lsn FROM pg_replication_slots;
-- Esperado: Slot ativo
```

---

## 🚨 ROLLBACK (Se algo der errado)

### Se o deploy falhar, fazer rollback:

```bash
# 1. Restaurar do backup
# No Supabase Console → Settings → Backups
# Clicar em "Restore" do backup que você fez antes

# Ou via linha de comando:
supabase db remote set backup-id [ID_DO_BACKUP]
supabase db pull
```

### Se precisar deletar tudo e recomeçar:

```sql
-- ⚠️ CUIDADO: Isso deleta TUDO da tabela!

-- Deletar triggers primeiro
DROP TRIGGER IF EXISTS trigger_gerar_comissao_conversao ON leads;

-- Deletar funções
DROP FUNCTION IF EXISTS gerar_comissao_conversao();
DROP FUNCTION IF EXISTS converter_lead_para_estabelecimento(UUID, UUID);

-- Deletar views
DROP VIEW IF EXISTS vw_performance_sdr;
DROP VIEW IF EXISTS vw_performance_closer;
DROP VIEW IF EXISTS vw_resumo_leads_status;
DROP VIEW IF EXISTS vw_pipeline_comercial;

-- Deletar tabelas (nesta ordem por FK)
DROP TABLE IF EXISTS commissions;
DROP TABLE IF EXISTS meetings;
DROP TABLE IF EXISTS lead_objections;
DROP TABLE IF EXISTS lead_contacts;
DROP TABLE IF EXISTS leads;
```

---

## 📋 DEPLOYMENT CHECKLIST

Marcar conforme avança:

- [ ] Backup criado e testado
- [ ] Schema.sql revisado
- [ ] Deploy executado
- [ ] Tabelas verificadas
- [ ] Views verificadas
- [ ] Funções verificadas
- [ ] Triggers verificados
- [ ] Teste de lead criado
- [ ] Trigger disparou corretamente
- [ ] Comissão foi gerada automaticamente
- [ ] Dados de teste limpos
- [ ] Documentação atualizada
- [ ] Documentação atualizada

---

## ✅ CONFIRMAÇÃO DE SUCESSO

Se todos os checks passaram:

```
✅ BANCO DE DADOS PRONTO PARA PRODUÇÃO
✅ TODAS AS TABELAS CRIADAS
✅ TODAS AS VIEWS CRIADAS
✅ TRIGGER AUTOMÁTICO FUNCIONANDO
✅ INTEGRAÇÃO COM SISTEMA EXISTENTE OK
✅ PRONTO PARA DESENVOLVIMENT DE API
```

---

## 🔄 PRÓXIMOS PASSOS

1. **TypeScript Types** (1h)
   - Criar `src/integrations/supabase/types.ts`
   - Definir interfaces para Lead, Commission, etc

2. **API Endpoints** (3-4h)
   - Criar endpoints de CRUD para leads
   - Criar endpoints de comissões
   - Implementar validações

3. **UI Components** (4-6h)
   - Criar páginas comerciais
   - Criar dashboards SDR/Closer
   - Integrar com API

4. **Testing** (2-3h)
   - Testes unitários
   - Testes de integração
   - Testes E2E

---

## 📞 TROUBLESHOOTING

### Problema: "ERROR: duplicate key value violates unique constraint"
**Solução:** Schema já existe. Usar `DROP TABLE IF EXISTS` ou `CREATE TABLE IF NOT EXISTS`

### Problema: "ERROR: foreign key constraint 'xxx' is violated"
**Solução:** Verificar que establishment_id/sdr_responsavel_id existem nas tabelas referenciadas

### Problema: "ERROR: column 'xxx' of table 'yyy' does not exist"
**Solução:** Schema não foi aplicado completamente. Rodar o schema.sql novamente

### Problema: Trigger não dispara
**Solução:** 
```sql
-- 1. Verificar que trigger existe:
SELECT * FROM pg_trigger WHERE tgname = 'trigger_gerar_comissao_conversao';

-- 2. Verificar que é AFTER UPDATE:
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_gerar_comissao_conversao';

-- 3. Se não existir, criar:
-- CREATE TRIGGER trigger_gerar_comissao_conversao
--   AFTER UPDATE ON leads FOR EACH ROW
--   EXECUTE FUNCTION gerar_comissao_conversao();
```

---

**Status:** 🟢 PRONTO PARA DEPLOY
**Última Atualização:** 2024
**Versão:** 1.0 - Commercial Module

