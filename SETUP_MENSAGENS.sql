-- =====================================================
-- BARON CONTROL - SETUP ADICIONAL
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna observacoes na tabela leads (se não existir)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adicionar coluna meta_clientes na tabela monthly_targets
ALTER TABLE monthly_targets ADD COLUMN IF NOT EXISTS meta_clientes INTEGER DEFAULT 10;

-- =====================================================
-- ATUALIZAR TABELA MEETINGS (adicionar tipo e link)
-- =====================================================
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tipo_reuniao VARCHAR(20) DEFAULT 'online';
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS link_reuniao TEXT;

-- =====================================================
-- CRIAR USUÁRIOS COMERCIAIS (Miguel e Murilo)
-- =====================================================

-- Primeiro, adicionar 'comercial' à constraint de role (se ainda não existir)
-- Se der erro, significa que já existe ou precisa dropar e recriar
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
  CHECK (role IN ('admin', 'super_admin', 'sdr', 'closer', 'comercial'));

-- Inserir usuário Miguel (comercial)
INSERT INTO admin_users (email, nome, role, senha_hash, ativo) VALUES
('miguel.matenco@gmail.com', 'Miguel Matenco', 'comercial', '$2b$10$h6rngQx0TgJIfjaWgYGA9.PYMFqTMJPnpK0wtKwqHCi9.dqNpGFTK', true)
ON CONFLICT (email) DO UPDATE SET 
  senha_hash = '$2b$10$h6rngQx0TgJIfjaWgYGA9.PYMFqTMJPnpK0wtKwqHCi9.dqNpGFTK',
  role = 'comercial',
  ativo = true;

-- Inserir usuário Murilo (comercial)
INSERT INTO admin_users (email, nome, role, senha_hash, ativo) VALUES
('muriloayabe59@gmail.com', 'Murilo Ayabe', 'comercial', '$2b$10$KyUt6TXbBmSRZpZHRtPCKeUkBBX7IFZ5IzKgYCBq6rvZqtO5cOHp2', true)
ON CONFLICT (email) DO UPDATE SET 
  senha_hash = '$2b$10$KyUt6TXbBmSRZpZHRtPCKeUkBBX7IFZ5IzKgYCBq6rvZqtO5cOHp2',
  role = 'comercial',
  ativo = true;

-- Verificar usuários criados
SELECT id, email, nome, role, ativo, created_at FROM admin_users ORDER BY created_at DESC;

-- =====================================================
-- TEMPLATES DE MENSAGENS (PESSOAIS POR USUÁRIO)
-- =====================================================

-- Criar tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_templates_ativo ON message_templates(ativo);
CREATE INDEX IF NOT EXISTS idx_message_templates_ordem ON message_templates(ordem);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON message_templates(created_by);

-- NOTA: Cada usuário cria suas próprias mensagens no sistema.
-- Não há mensagens globais - cada comercial gerencia suas mensagens pessoais.

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at 
    BEFORE UPDATE ON message_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_message_templates_updated_at();

-- Desabilitar RLS (para simplificar)
ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY;

SELECT 'Tabela message_templates criada com sucesso!' AS resultado;
