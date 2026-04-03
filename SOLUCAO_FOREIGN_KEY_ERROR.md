# 🚀 EXECUÇÃO PASSO A PASSO - FIX DO ERRO DE FOREIGN KEY

## ❌ Seu Erro Atual

```
code: "23503"
message: "insert or update on table \"leads\" violates foreign key constraint \"leads_sdr_responsavel_id_fkey\""
```

**Significa:** Você está tentando criar um lead atribuído a um usuário que **NÃO EXISTE** na tabela `admin_users`.

---

## ✅ SOLUÇÃO RÁPIDA (5 MINUTOS)

### Passo 1: Abrir Supabase Editor SQL

1. Vá para: **Dashboard Supabase** → **SQL Editor**
2. Crie uma **New Query**

### Passo 2: Criar Usuários Miguel e Murilo

Cole e execute este SQL:

```sql
INSERT INTO admin_users (email, senha_hash, nome, role, ativo)
VALUES 
    ('miguel@baroncontrol.com', '$2a$10$example_hash_miguel', 'Miguel', 'closer', true),
    ('murilo@baroncontrol.com', '$2a$10$example_hash_murilo', 'Murilo', 'closer', true)
ON CONFLICT (email) DO NOTHING;
```

✅ **Resultado esperado:** "Successfully inserted 2 rows"

### Passo 3: Verificar Inserção

Execute:

```sql
SELECT id, nome, email, role FROM admin_users 
WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');
```

Você deve ver:
```
| id                                   | nome   | email                      | role    |
|--------------------------------------|--------|----------------------------|---------|
| xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Miguel | miguel@baroncontrol.com    | closer  |
| xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | Murilo | murilo@baroncontrol.com    | closer  |
```

### Passo 4: Agora Criar um Lead

Cole no seu code:

```javascript
const { data, error } = await supabase
  .from('leads')
  .insert([
    {
      nome_estabelecimento: 'Pizzaria Teste',
      tipo: 'pizzaria',
      responsavel_nome: 'João Silva',
      responsavel_telefone: '11999999999',
      responsavel_email: 'joao@example.com',
      cidade: 'São Paulo',
      estado: 'SP',
      origem_lead: 'prospeccao',
      sdr_responsavel_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // ID do Miguel ou Murilo
      status: 'novo'
    }
  ])
```

---

## 💰 LÓGICA DE COMISSÃO EXPLICADA

Conforme você pediu:

### Cenário 1: Um SDR e Um Closer DIFERENTES

```
Lead: "Pizzaria Bella"
- SDR: Miguel
- Closer: Murilo
- Valor da venda: R$ 1.000
- Comissão base: 70%

Divisão:
- Miguel (SDR): R$ 350 (35% do valor da comissão)
- Murilo (Closer): R$ 350 (35% do valor da comissão)
```

### Cenário 2: Mesma Pessoa é SDR E Closer

```
Lead: "Hamburgueria The Burger"
- SDR: Miguel
- Closer: Miguel (mesma pessoa)
- Valor da venda: R$ 1.000
- Comissão base: 70%

Divisão:
- Miguel: R$ 650 (65% completo)
```

---

## 📊 ESTRUTURA DO BANCO

```
admin_users
├── id (UUID)
├── email (único)
├── nome
└── role ('sdr', 'closer', 'admin')

leads
├── id (UUID)
├── nome_estabelecimento
├── sdr_responsavel_id → ⚠️ REFERENCIA admin_users(id)
└── status

meetings
├── id (UUID)
├── lead_id → references leads
├── sdr_id → ⚠️ REFERENCIA admin_users(id)
├── closer_id → ⚠️ REFERENCIA admin_users(id)
└── status

commissions
├── id (UUID)
├── sdr_id → ⚠️ REFERENCIA admin_users(id)
├── closer_id → ⚠️ REFERENCIA admin_users(id)
├── valor_comissao
└── percentual_comissao
```

⚠️ As setas mostram onde o erro acontecia: você tentava inserir um ID que **não existia**!

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Criar usuários** (passo acima)
2. ✅ **Criar leads** com `sdr_responsavel_id` apontando para um usuário existente
3. ✅ **Criar meetings** vinculando SDR e Closer
4. ✅ **Converter lead** (status = 'convertido')
5. ✅ **Comissão calculada automaticamente** via triggers

---

## 🔍 VERIFICAÇÕES

### Verificar todos os usuários:
```sql
SELECT id, nome, email, role FROM admin_users;
```

### Verificar leads criados:
```sql
SELECT id, nome_estabelecimento, sdr_responsavel_id, status FROM leads;
```

### Ver ranking de comissões (a view que criamos):
```sql
SELECT * FROM vw_ranking_simples;
```

---

## ❓ DÚVIDAS FREQUENTES

**P: Preciso atualizar a senha?**
R: Não por enquanto. Depois você configura no Supabase UI.

**P: E se eu cometer erro e quiser deletar?**
R: Execute:
```sql
DELETE FROM admin_users WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');
```

**P: Como saber o ID do Miguel para colocar no lead?**
R: Execute:
```sql
SELECT id FROM admin_users WHERE nome = 'Miguel';
```

**P: E se eu quisesse que Miguel seja tanto SDR quanto Closer?**
R: Na tabela `meetings`, coloque o mesmo ID em `sdr_id` e `closer_id`:
```sql
INSERT INTO meetings (lead_id, sdr_id, closer_id, data_reuniao)
VALUES ('lead-uuid', 'miguel-uuid', 'miguel-uuid', NOW());
```
Aí Miguel recebe os 65% completos.

---

## 📌 RESUMO EXECUTIVO

| O quê | Como | Resultado |
|-------|------|-----------|
| Criar Miguel | SQL INSERT | ✅ Usuário criado |
| Criar Lead p/ Miguel | INSERT com sdr_responsavel_id | ✅ Lead criado |
| Criar Reunião | Vincular SDR + Closer | ✅ Comissão calculada |
| Ver Ranking | SELECT vw_ranking_simples | ✅ Comissões por pessoa |

---

## ⚡ TESTE RÁPIDO

Copie e cole tudo junto:

```sql
-- 1. Criar usuários
INSERT INTO admin_users (email, senha_hash, nome, role, ativo)
VALUES 
    ('miguel@baroncontrol.com', '$2a$10$example_hash_miguel', 'Miguel', 'closer', true),
    ('murilo@baroncontrol.com', '$2a$10$example_hash_murilo', 'Murilo', 'closer', true)
ON CONFLICT (email) DO NOTHING;

-- 2. Verificar
SELECT id, nome FROM admin_users WHERE nome IN ('Miguel', 'Murilo');
```

Se retornar 2 linhas com IDs → ✅ **SUCESSO!**

Agora você pode criar leads sem erro! 🎉
