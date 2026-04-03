# Setup de Usuários SDR/Closer e Lógica de Comissões

## ❌ Problema Identificado

Você estava recebendo erro:
```
code: "23503"
message: "insert or update on table \"leads\" violates foreign key constraint \"leads_sdr_responsavel_id_fkey\""
```

**Causa**: A tabela `leads` tenta fazer referência a usuários (`admin_users`) que não existem.

## ✅ Solução

### 1. Criar Usuários Miguel e Murilo

Você tem dois arquivos SQL para aplicar:

**No Supabase Editor SQL:**

```sql
-- Criar usuários
INSERT INTO admin_users (email, senha_hash, nome, role, ativo)
VALUES 
    ('miguel@baroncontrol.com', '$2a$10$example_hash_miguel', 'Miguel', 'closer', true),
    ('murilo@baroncontrol.com', '$2a$10$example_hash_murilo', 'Murilo', 'closer', true)
ON CONFLICT (email) DO NOTHING;

-- Verificar inserção
SELECT id, nome, email, role FROM admin_users;
```

### 2. Lógica de Comissão

Conforme você especificou:

**Cenário 1: SDR e Closer DIFERENTES no mesmo lead**
- SDR recebe: **35%** da comissão
- Closer recebe: **35%** da comissão
- Total dividido: **70%**

**Cenário 2: Mesma pessoa é SDR E Closer do mesmo lead**
- Recebe: **65%** completo

### 3. Estrutura de Dados

#### Tabela `admin_users`
- `id`: UUID único
- `email`: Email único (miguel@baroncontrol.com, murilo@baroncontrol.com)
- `nome`: Nome do usuário
- `role`: Pode ser 'sdr', 'closer', 'admin'

#### Tabela `meetings` (vínculo SDR/Closer)
- `sdr_id`: ID do SDR que levou o lead
- `closer_id`: ID do Closer que fechou o negócio
- `lead_id`: ID do lead

#### Tabela `commissions` (cálculo de comissão)
- `sdr_id`: ID do SDR
- `closer_id`: ID do Closer
- `valor_comissao`: Valor base da comissão (65%)
- `percentual_comissao`: Percentual aplicado (65% ou 35% conforme lógica)

### 4. View de Ranking

Criada view `vw_ranking_simples` que calcula:
- Total de conversões por pessoa
- Comissão total (com lógica de divisão)
- Leads em cada estágio do pipeline

## 📋 Próximos Passos

1. **Execute o arquivo SETUP_USUARIOS_COMISSOES.sql** no Supabase:
   - Copie todo conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run"

2. **Verifique se os usuários foram criados:**
   ```sql
   SELECT id, nome, email FROM admin_users WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');
   ```

3. **Agora você pode:**
   - Criar leads atribuindo a Miguel ou Murilo
   - Criar reuniões vinculando SDR e Closer
   - Ver o ranking atualizado com as comissões corretas

## 💰 Exemplo de Fluxo Completo

1. **Lead criado**
   ```sql
   INSERT INTO leads (..., sdr_responsavel_id, status)
   VALUES (..., {id_miguel}, 'novo');
   ```

2. **Reunião agendada**
   ```sql
   INSERT INTO meetings (lead_id, sdr_id, closer_id, ...)
   VALUES ({lead_id}, {id_miguel}, {id_murilo}, ...);
   ```

3. **Lead convertido**
   ```sql
   UPDATE leads SET status = 'convertido' WHERE id = {lead_id};
   ```

4. **Comissão calculada automaticamente:**
   - Miguel (SDR): 35% da comissão
   - Murilo (Closer): 35% da comissão

## 🔍 Verificar Comissões

```sql
SELECT * FROM vw_ranking_simples;
```

Resultado:
```
| nome   | total_conversoes | comissao_total | leads_novos | ... |
|--------|------------------|----------------|-------------|-----|
| Miguel |        5         |    2275.00     |      2      | ... |
| Murilo |        4         |    2000.00     |      1      | ... |
```

## ⚠️ Notas Importantes

- **Hashes de senha**: Os hashes de exemplo (`$2a$10$example_hash_...`) são placeholders
  - Se precisar mudar a senha, use um hash bcrypt válido
  - Ou configure a senha direto na UI do Supabase

- **Foreign Keys**: Agora que os usuários existem, os leads podem ser criados sem erro

- **RLS (Row Level Security)**: Se habilitado, você pode precisar de permissões específicas

## 📞 Suporte

Se encontrar erro ao executar:
1. Verifique se a tabela `admin_users` existe
2. Verifique se há triggers que fazem validações adicionais
3. Confira se o UUID do usuário está correto quando cria leads
