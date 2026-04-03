-- ============================================================================
-- SCHEMA UPDATE PARA GESTÃO COMERCIAL
-- Execute no Supabase SQL Editor
-- ============================================================================

-- 0. Ajustar estrutura da tabela leads para o novo schema comercial
-- Renomear colunas para ficar consistente com o novo modelo

ALTER TABLE leads RENAME COLUMN responsavel_nome TO nome;
ALTER TABLE leads RENAME COLUMN responsavel_telefone TO telefone;
ALTER TABLE leads RENAME COLUMN responsavel_email TO email;
ALTER TABLE leads RENAME COLUMN tipo TO tipo_estabelecimento;
ALTER TABLE leads RENAME COLUMN nome_estabelecimento TO empresa;
ALTER TABLE leads RENAME COLUMN sdr_responsavel_id TO vendedor_id;
ALTER TABLE leads RENAME COLUMN origem_lead TO origem;

-- Adicionar coluna para nome do vendedor (denormalizado)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vendedor_nome VARCHAR(255);

-- 1. Adicionar campos à tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proxima_acao VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS data_proxima_acao TIMESTAMP WITH TIME ZONE;

-- Comentários para os campos
COMMENT ON COLUMN leads.proxima_acao IS 'whatsapp, call, meeting, follow_up, send_proposal, wait';
COMMENT ON COLUMN leads.data_proxima_acao IS 'Data/hora da próxima ação prevista';

-- 2. Criar tabela message_templates (se não existir)
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON message_templates(created_by);

-- RLS para message_templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view message_templates"
ON message_templates FOR SELECT
USING (true);

CREATE POLICY "Users can create message_templates"
ON message_templates FOR INSERT
WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update own message_templates"
ON message_templates FOR UPDATE
USING (auth.uid()::text = created_by::text)
WITH CHECK (auth.uid()::text = created_by::text);

-- 3. Adicionar campo tipo à tabela meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'presencial';

COMMENT ON COLUMN meetings.tipo IS 'online ou presencial';

-- 4. Template padrão de mensagens
INSERT INTO message_templates (name, message, created_by) VALUES
(
  'Primeiro Contato',
  'Olá {{nome}}, tudo bem? Sou {{vendedor}} da Baron Control. Gostaria de conversar sobre soluções que podem otimizar sua {{tipo_estabelecimento}}. Tem 5 minutos?',
  (SELECT id FROM admin_users LIMIT 1)
),
(
  'Follow-up 1',
  'Oi {{nome}}, é o {{vendedor}} novamente. Como você ficou? Temos uma solução perfeita para {{tipo_estabelecimento}} que pode aumentar sua eficiência em 30%.',
  (SELECT id FROM admin_users LIMIT 1)
),
(
  'Follow-up 2',
  'Olá {{nome}}, você viu o que enviei? A Baron Control já ajudou centenas de {{tipo_estabelecimento}}. Posso agendar uma reunião rápida?',
  (SELECT id FROM admin_users LIMIT 1)
),
(
  'Pós-Reunião',
  'Oi {{nome}}, foi ótimo conversar contigo! Segue em anexo a proposta. Podemos marcar um próximo encontro para {{data}} às {{hora}}?',
  (SELECT id FROM admin_users LIMIT 1)
),
(
  'Fechamento',
  'Olá {{nome}}, só para confirmar: você quer prosseguir com o plano {{plano}}? Preciso dessa confirmação para liberar seu acesso. 🚀',
  (SELECT id FROM admin_users LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Verificar se tudo foi criado corretamente
-- ============================================================================

-- Ver colunas da tabela leads (deve incluir proxima_acao e data_proxima_acao)
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver templates criados
SELECT name, message FROM message_templates ORDER BY created_at;

-- Ver estrutura do meetings (para confirmar campo tipo)
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'meetings' AND table_schema = 'public'
ORDER BY ordinal_position;
