-- ============================================================================
-- SETUP COMPLETO DO MÓDULO COMERCIAL
-- Executa NO SUPABASE - primeiro este arquivo, depois o schema.sql
-- ============================================================================

-- =====================================================
-- TABELA: admin_users (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: leads (CRIADA DO ZERO)
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informações do contato
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20) NOT NULL,
    
    -- Informações da empresa
    empresa VARCHAR(255) NOT NULL,
    tipo_estabelecimento VARCHAR(50) NOT NULL,
    
    -- Vendedor responsável
    vendedor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    vendedor_nome VARCHAR(255),
    
    -- Origem e contexto
    origem VARCHAR(100),
    
    -- Status e ações
    status VARCHAR(50) DEFAULT 'novo' CHECK (status IN ('novo', 'contato_realizado', 'reuniao_agendada', 'proposta_enviada', 'conversao', 'perdido')),
    proxima_acao VARCHAR(50),
    data_proxima_acao TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_proxima_acao ON leads(data_proxima_acao);

-- =====================================================
-- TABELA: lead_contacts (Histórico de contatos)
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    
    tipo_contato VARCHAR(50) NOT NULL CHECK (tipo_contato IN ('whatsapp', 'telefone', 'email', 'pessoalmente', 'mensagem')),
    resultado VARCHAR(100),
    observacoes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_user ON lead_contacts(user_id);

-- =====================================================
-- TABELA: lead_objections (Objeções registradas)
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    
    objection VARCHAR(255) NOT NULL,
    notas TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_objections_lead ON lead_objections(lead_id);

-- =====================================================
-- TABELA: meetings (Reuniões agendadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    
    data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
    local VARCHAR(255),
    tipo VARCHAR(20) DEFAULT 'presencial' CHECK (tipo IN ('online', 'presencial')),
    status VARCHAR(50) DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
    notas TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_data ON meetings(data_reuniao);

-- =====================================================
-- TABELA: message_templates (Templates de mensagem)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON message_templates(created_by);

-- =====================================================
-- TABELA: commissions (Comissões)
-- =====================================================
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    
    valor_comissao DECIMAL(10, 2) NOT NULL,
    percentual_comissao DECIMAL(5, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_vendor ON commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Policies para leads
DROP POLICY IF EXISTS "Leads are visible to everyone" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;

CREATE POLICY "Leads are visible to everyone" ON leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leads" ON leads FOR UPDATE USING (true);

-- Policies para lead_contacts
DROP POLICY IF EXISTS "Lead contacts visible to all" ON lead_contacts;
DROP POLICY IF EXISTS "Users can insert lead contacts" ON lead_contacts;

CREATE POLICY "Lead contacts visible to all" ON lead_contacts FOR SELECT USING (true);
CREATE POLICY "Users can insert lead contacts" ON lead_contacts FOR INSERT WITH CHECK (true);

-- Policies para lead_objections
DROP POLICY IF EXISTS "Lead objections visible to all" ON lead_objections;
DROP POLICY IF EXISTS "Users can insert lead objections" ON lead_objections;

CREATE POLICY "Lead objections visible to all" ON lead_objections FOR SELECT USING (true);
CREATE POLICY "Users can insert lead objections" ON lead_objections FOR INSERT WITH CHECK (true);

-- Policies para meetings
DROP POLICY IF EXISTS "Meetings visible to all" ON meetings;
DROP POLICY IF EXISTS "Users can insert meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update meetings" ON meetings;

CREATE POLICY "Meetings visible to all" ON meetings FOR SELECT USING (true);
CREATE POLICY "Users can insert meetings" ON meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update meetings" ON meetings FOR UPDATE USING (true);

-- Policies para message_templates
DROP POLICY IF EXISTS "Message templates visible to all" ON message_templates;
DROP POLICY IF EXISTS "Users can create templates" ON message_templates;

CREATE POLICY "Message templates visible to all" ON message_templates FOR SELECT USING (true);
CREATE POLICY "Users can create templates" ON message_templates FOR INSERT WITH CHECK (true);

-- Policies para commissions
DROP POLICY IF EXISTS "Commissions visible to vendor and admin" ON commissions;
DROP POLICY IF EXISTS "Admins can insert commissions" ON commissions;

CREATE POLICY "Commissions visible to vendor and admin" ON commissions FOR SELECT USING (true);
CREATE POLICY "Admins can insert commissions" ON commissions FOR INSERT WITH CHECK (true);

-- =====================================================
-- TEMPLATES PADRÃO
-- =====================================================
INSERT INTO message_templates (name, message, created_by) 
SELECT
  'Primeiro Contato',
  'Olá {{nome}}, tudo bem? Sou {{vendedor}} da Baron Control. Gostaria de conversar sobre soluções que podem otimizar sua {{tipo_estabelecimento}}. Tem 5 minutos?',
  (SELECT id FROM admin_users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Primeiro Contato');

INSERT INTO message_templates (name, message, created_by) 
SELECT
  'Follow-up 1',
  'Oi {{nome}}, é o {{vendedor}} novamente. Como você ficou? Temos uma solução perfeita para {{tipo_estabelecimento}} que pode aumentar sua eficiência em 30%.',
  (SELECT id FROM admin_users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Follow-up 1');

INSERT INTO message_templates (name, message, created_by) 
SELECT
  'Follow-up 2',
  'Olá {{nome}}, você viu o que enviei? A Baron Control já ajudou centenas de {{tipo_estabelecimento}}. Posso agendar uma reunião rápida?',
  (SELECT id FROM admin_users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Follow-up 2');

INSERT INTO message_templates (name, message, created_by) 
SELECT
  'Pós-Reunião',
  'Oi {{nome}}, foi ótimo conversar contigo! Segue em anexo a proposta. Podemos marcar um próximo encontro para {{data}} às {{hora}}?',
  (SELECT id FROM admin_users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Pós-Reunião');

INSERT INTO message_templates (name, message, created_by) 
SELECT
  'Fechamento',
  'Olá {{nome}}, só para confirmar: você quer prosseguir com o plano {{plano}}? Preciso dessa confirmação para liberar seu acesso. 🚀',
  (SELECT id FROM admin_users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM message_templates WHERE name = 'Fechamento');

-- =====================================================
-- DADOS DE TESTE (opcional)
-- =====================================================

-- Inserir um usuário admin teste se não existir
INSERT INTO admin_users (email, nome, role) 
SELECT 'admin@baroncontrol.com', 'Admin Baron', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@baroncontrol.com');

-- Inserir um lead de exemplo
INSERT INTO leads (nome, email, telefone, empresa, tipo_estabelecimento, vendedor_id, origem, status)
SELECT
  'João da Silva',
  'joao@exemplo.com',
  '11987654321',
  'Bar do João',
  'bar',
  (SELECT id FROM admin_users LIMIT 1),
  'indicacao',
  'novo'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE email = 'joao@exemplo.com');

-- =====================================================
-- VERIFICAÇÕES
-- =====================================================

-- Ver todas as tabelas criadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Ver templates
SELECT name FROM message_templates;

-- Ver leads
SELECT nome, empresa FROM leads;

-- Ver admin users
SELECT email, nome, role FROM admin_users;
