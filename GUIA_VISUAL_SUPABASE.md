# 🎯 GUIA VISUAL - Como Executar no Supabase

## 📍 Locais dos Arquivos

```
baron-admin-panel/
├── SOLUCAO_FOREIGN_KEY_ERROR.md          ← LEIA PRIMEIRO (guia passo-a-passo)
├── SETUP_COMISSOES_GUIDE.md              ← detalhes técnicos
├── RESUMO_SOLUCAO.md                     ← este arquivo
└── database/
    └── SETUP_USUARIOS_COMISSOES.sql      ← execute no Supabase
```

---

## 🚀 EXECUÇÃO RÁPIDA (3 PASSOS)

### 📱 Passo 1: Abra o Supabase

```
1. Vá para: https://app.supabase.com
2. Selecione seu projeto
3. Clique em: "SQL Editor" (lateral esquerda)
4. Clique em: "+ New Query" (azul, canto superior)
```

### ✏️ Passo 2: Cole o SQL

Copie o arquivo `database/SETUP_USUARIOS_COMISSOES.sql` ou execute direto:

```sql
INSERT INTO admin_users (email, senha_hash, nome, role, ativo)
VALUES 
    ('miguel@baroncontrol.com', '$2a$10$example_hash_miguel', 'Miguel', 'closer', true),
    ('murilo@baroncontrol.com', '$2a$10$example_hash_murilo', 'Murilo', 'closer', true)
ON CONFLICT (email) DO NOTHING;
```

### ▶️ Passo 3: Execute

```
1. Cole no editor
2. Clique em: "Run" (verde, canto inferior)
3. Veja: "Successfully inserted 2 rows"
```

**✅ PRONTO! Miguel e Murilo criados.**

---

## 🔍 Verificações Importantes

### Verificar se os usuários foram criados:

```sql
SELECT id, nome, email, role 
FROM admin_users 
WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');
```

**Resultado esperado:**
```
| id                                   | nome   | email                      | role    |
|--------------------------------------|--------|----------------------------|---------|
| 550e8400-e29b-41d4-a716-446655440000 | Miguel | miguel@baroncontrol.com    | closer  |
| 550e8400-e29b-41d4-a716-446655440001 | Murilo | murilo@baroncontrol.com    | closer  |
```

### Verificar estrutura da tabela leads:

```sql
\d leads
```

Procure por: `sdr_responsavel_id` com `REFERENCES admin_users(id)`

---

## 💡 Agora Você Pode Fazer:

### ✅ Criar um Lead
```sql
INSERT INTO leads 
(nome_estabelecimento, tipo, responsavel_nome, responsavel_telefone, 
 responsavel_email, cidade, estado, origem_lead, sdr_responsavel_id, status)
VALUES
('Hamburgueria Top', 'hamburgueria', 'Carlos', '11988888888', 'carlos@example.com',
 'São Paulo', 'SP', 'prospeccao', 
 (SELECT id FROM admin_users WHERE nome = 'Miguel'), 
 'novo');
```

### ✅ Ver leads criados
```sql
SELECT nome_estabelecimento, sdr_responsavel_id, status FROM leads;
```

### ✅ Criar uma reunião
```sql
INSERT INTO meetings 
(lead_id, sdr_id, closer_id, data_reuniao, status)
VALUES
((SELECT id FROM leads WHERE nome_estabelecimento = 'Hamburgueria Top' LIMIT 1),
 (SELECT id FROM admin_users WHERE nome = 'Miguel'),
 (SELECT id FROM admin_users WHERE nome = 'Murilo'),
 NOW() + INTERVAL '7 days',
 'agendada');
```

### ✅ Ver ranking de comissões
```sql
SELECT * FROM vw_ranking_simples;
```

---

## 🎨 Interface Visual (Estrutura)

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE DASHBOARD                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔸 SQL Editor                                          │
│     └─ 📄 New Query                                     │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │ INSERT INTO admin_users (...)            │          │
│  │ VALUES                                   │          │
│  │   ('miguel@...', '...', 'Miguel', ...   │          │
│  │   ('murilo@...', '...', 'Murilo', ...   │          │
│  │                                          │          │
│  │ [Run] ◀── Clique aqui                   │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ✅ Successfully inserted 2 rows                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist de Execução

- [ ] Abrir Supabase Dashboard
- [ ] Ir para SQL Editor
- [ ] Criar New Query
- [ ] Colar SQL do SETUP_USUARIOS_COMISSOES.sql
- [ ] Clicar Run
- [ ] Ver "Successfully inserted 2 rows"
- [ ] Executar SELECT para verificar
- [ ] Confirmar que Miguel e Murilo aparecem

---

## 💰 Lógica de Comissão Resumida

```
CENÁRIO 1: SDR + Closer Diferentes
┌──────────────────────────────────┐
│ Lead: "Pizzaria Bella"           │
│ Valor: R$ 1.000                  │
├──────────────────────────────────┤
│ Miguel (SDR):    35% = R$ 350   │
│ Murilo (Closer): 35% = R$ 350   │
│ Total dividido:     70%          │
└──────────────────────────────────┘

CENÁRIO 2: Mesma Pessoa (SDR + Closer)
┌──────────────────────────────────┐
│ Lead: "Hamburgueria"             │
│ Valor: R$ 1.000                  │
├──────────────────────────────────┤
│ Miguel (SDR + Closer): 65% = R$ 650 │
│ Total completo:        65%       │
└──────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Erro: "Key is not present in table"
❌ **Causa**: Usuário não existe
✅ **Solução**: Execute o INSERT INTO admin_users

### Erro: "Duplicate key value"
❌ **Causa**: Miguel/Murilo já existem
✅ **Solução**: Isso é OK! `ON CONFLICT ... DO NOTHING` ignora

### Erro: "Invalid UUID"
❌ **Causa**: Você passou um ID inválido
✅ **Solução**: Use `SELECT id FROM admin_users WHERE nome = 'Miguel'`

### Query vazia (sem resultados)
❌ **Causa**: Dados não foram inseridos
✅ **Solução**: Verifique se executou o INSERT e viu "Successfully inserted"

---

## 📞 Dúvidas

**P: Preciso fazer algo mais?**
R: Não! Só execute o SQL uma vez. O banco fica atualizado.

**P: Posso deletar e refazer?**
R: Sim! Execute:
```sql
DELETE FROM admin_users WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');
```
Depois execute INSERT novamente.

**P: Como vejo se funcionou?**
R: Execute:
```sql
SELECT COUNT(*) as total FROM admin_users WHERE role = 'closer';
```
Deve ter pelo menos 2.

**P: E a senha dos usuários?**
R: Por enquanto não precisa. Depois você configura no painel do Supabase.

---

## ✨ Status Final

```
✅ Arquivo SQL criado: database/SETUP_USUARIOS_COMISSOES.sql
✅ Documentação: SOLUCAO_FOREIGN_KEY_ERROR.md
✅ Guia completo: SETUP_COMISSOES_GUIDE.md
✅ Componente React: src/components/ComissaoCalculator.tsx
✅ Views SQL: vw_ranking_simples (automática)
✅ Código no GitHub: Commit 7648eff

🚀 PRONTO PARA USAR!
```

---

## 🎓 Próximas Ações

1. Execute o SQL no Supabase (veja passos acima)
2. Verifique se Miguel e Murilo aparecem
3. Use o frontend para criar leads
4. Crie reuniões vinculando SDR + Closer
5. Veja comissões sendo calculadas

**Quer mais ajuda? Leia:**
- `SOLUCAO_FOREIGN_KEY_ERROR.md` - Guia passo-a-passo
- `SETUP_COMISSOES_GUIDE.md` - Detalhes técnicos
- `RESUMO_SOLUCAO.md` - Overview completo
