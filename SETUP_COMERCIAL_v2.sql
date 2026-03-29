-- =====================================================
-- BARON CONTROL - MÓDULO COMERCIAL v2
-- Script de Setup Completo para Supabase
-- =====================================================

-- =====================================================
-- TABELA: leads (Pipeline comercial com TODOS os campos)
-- =====================================================
DROP TABLE IF EXISTS leads CASCADE;
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
    
    -- Informações do contato
    nome_estabelecimento VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('bar', 'balada', 'restaurante', 'cafe', 'pizzaria', 'hamburgueria', 'outro')),
    responsavel_nome VARCHAR(255) NOT NULL,
    responsavel_telefone VARCHAR(20) NOT NULL,
    responsavel_whatsapp VARCHAR(20),
    responsavel_email VARCHAR(255),
    instagram VARCHAR(100),
    
    -- Localização
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    
    -- Comercial
    faturamento_estimado DECIMAL(12, 2),
    origem_lead VARCHAR(100) NOT NULL CHECK (origem_lead IN ('indicacao', 'prospeccao', 'evento', 'rede-social', 'referencia', 'outro')),
    sdr_responsavel_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'novo' CHECK (status IN ('novo', 'contato_realizado', 'interessado', 'reuniao_marcada', 'reuniao_realizada', 'perdido', 'convertido')),
    
    -- Próxima ação (CAMPO CENTRAL)
    proxima_acao VARCHAR(50) CHECK (proxima_acao IN ('whatsapp', 'telefone', 'reuniao', 'follow_up', 'proposta', 'esperar', NULL)),
    data_proxima_acao TIMESTAMP WITH TIME ZONE,
    
    -- Motivos de perda e conversão
    motivo_perda TEXT,
    data_conversao TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_sdr ON leads(sdr_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_leads_establishment ON leads(establishment_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_proxima_acao ON leads(data_proxima_acao);
CREATE INDEX IF NOT EXISTS idx_leads_data ON leads(created_at DESC);

-- =====================================================
-- TABELA: lead_contacts (Histórico de contatos/interações)
-- =====================================================
DROP TABLE IF EXISTS lead_contacts CASCADE;
CREATE TABLE lead_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
    tipo_contato VARCHAR(50) NOT NULL CHECK (tipo_contato IN ('whatsapp', 'telefone', 'email', 'pessoalmente', 'mensagem')),
    resultado VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_user ON lead_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_data ON lead_contacts(created_at DESC);

-- =====================================================
-- TABELA: lead_objections (Objeções registradas)
-- =====================================================
DROP TABLE IF EXISTS lead_objections CASCADE;
CREATE TABLE lead_objections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tipo_objecao VARCHAR(100) NOT NULL CHECK (tipo_objecao IN ('preco', 'concorrencia', 'timing', 'necessidade', 'confianca', 'tecnica', 'outro')),
    descricao TEXT,
    fase_objecao VARCHAR(20) NOT NULL CHECK (fase_objecao IN ('sdr', 'closer')),
    resolvida BOOLEAN DEFAULT false,
    solucao TEXT,
    registrado_por UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_objections_lead ON lead_objections(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_objections_resolvida ON lead_objections(resolvida);

-- =====================================================
-- TABELA: meetings (Reuniões agendadas)
-- =====================================================
DROP TABLE IF EXISTS meetings CASCADE;
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sdr_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    closer_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_reuniao VARCHAR(20) DEFAULT 'presencial' CHECK (tipo_reuniao IN ('presencial', 'online')),
    local VARCHAR(255),
    status VARCHAR(20) DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada', 'nao_compareceu')),
    resultado VARCHAR(100),
    observacoes TEXT,
    criada_por UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_sdr ON meetings(sdr_id);
CREATE INDEX IF NOT EXISTS idx_meetings_closer ON meetings(closer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_data ON meetings(data_reuniao DESC);

-- =====================================================
-- TABELA: commissions (Comissões de vendas)
-- =====================================================
DROP TABLE IF EXISTS commissions CASCADE;
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    sdr_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    closer_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    plano_valor DECIMAL(12, 2) NOT NULL,
    percentual_comissao DECIMAL(5, 2) DEFAULT 65.00,
    valor_comissao DECIMAL(12, 2) NOT NULL,
    tipo_comissao VARCHAR(50) DEFAULT 'primeira_venda' CHECK (tipo_comissao IN ('primeira_venda', 'renovacao', 'upsell')),
    mes_referencia DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
    data_pagamento TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_establishment ON commissions(establishment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_sdr ON commissions(sdr_id);
CREATE INDEX IF NOT EXISTS idx_commissions_closer ON commissions(closer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_mes ON commissions(mes_referencia DESC);

-- =====================================================
-- TABELA: message_templates (Templates de mensagem)
-- =====================================================
DROP TABLE IF EXISTS message_templates CASCADE;
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    variaves_disponiveis TEXT,
    criada_por UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_tipo ON message_templates(tipo);

-- =====================================================
-- FUNCTIONS E TRIGGERS
-- =====================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar comissão automática
DROP FUNCTION IF EXISTS gerar_comissao_conversao() CASCADE;
CREATE FUNCTION gerar_comissao_conversao() RETURNS TRIGGER AS $$
DECLARE
    v_valor_plano DECIMAL(12, 2);
    v_sdr_id UUID;
BEGIN
    IF NEW.status = 'convertido' AND OLD.status != 'convertido' THEN
        v_sdr_id := NEW.sdr_responsavel_id;
        v_valor_plano := COALESCE(NEW.faturamento_estimado, 160.00);
        
        IF v_sdr_id IS NOT NULL AND NEW.establishment_id IS NOT NULL THEN
            INSERT INTO commissions (
                establishment_id, sdr_id, plano_valor, percentual_comissao,
                valor_comissao, tipo_comissao, mes_referencia
            ) VALUES (
                NEW.establishment_id, v_sdr_id, v_valor_plano, 65.00,
                v_valor_plano * 0.65, 'primeira_venda',
                CURRENT_DATE - (EXTRACT(DAY FROM CURRENT_DATE) - 1)::INTEGER * INTERVAL '1 day'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gerar_comissao_conversao ON leads;
CREATE TRIGGER trigger_gerar_comissao_conversao
    AFTER UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION gerar_comissao_conversao();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (admin vê tudo)
DROP POLICY IF EXISTS admin_all_leads ON leads;
CREATE POLICY admin_all_leads ON leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_lead_contacts ON lead_contacts;
CREATE POLICY admin_all_lead_contacts ON lead_contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_lead_objections ON lead_objections;
CREATE POLICY admin_all_lead_objections ON lead_objections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_meetings ON meetings;
CREATE POLICY admin_all_meetings ON meetings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_commissions ON commissions;
CREATE POLICY admin_all_commissions ON commissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_message_templates ON message_templates;
CREATE POLICY admin_all_message_templates ON message_templates FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Templates padrão
INSERT INTO message_templates (nome, tipo, conteudo, variaves_disponiveis) VALUES
('Primeiro Contato', 'primeiro_contato', 'Fala {{nome}}, aqui é {{vendedor}} do GetBaron! 👋 Te chamei pra falar rapidinho sobre o sistema de pagamentos e gestão para seu {{tipo_estabelecimento}}. Tá disponível pra uma rápida conversa?', '["nome", "vendedor", "tipo_estabelecimento"]'),
('Follow-up 1', 'follow_up_1', 'E aí {{nome}}, tudo bem? 😊 Seguindo nosso papo de {{data}}, gostaria de conhecer melhor como funciona seu faturamento atual. Quando teria um tempo?', '["nome", "data"]'),
('Follow-up 2', 'follow_up_2', '{{nome}}, só checando se recebeu minha última mensagem! Acho que o GetBaron pode fazer uma grande diferença no seu {{tipo_estabelecimento}}. Que tal agendarmos uma rápida demonstração?', '["nome", "tipo_estabelecimento"]'),
('Pós-Reunião', 'pos_reuniao', 'Valeu pela reunião {{data}} às {{hora}}, {{nome}}! 🙏 Ficou claro que o GetBaron é ideal para seu {{tipo_estabelecimento}}. Quando podemos confirmar a ativação?', '["nome", "data", "hora", "tipo_estabelecimento"]'),
('Fechamento', 'fechamento', 'Tudo certo, {{nome}}! 🎉 Sua conta no GetBaron está ativa! Você vai receber o login em breve. Qualquer dúvida, é só chamar. Bem-vindo!', '["nome"]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VIEWS COMERCIAIS - RANKING E DASHBOARDS
-- =====================================================

-- VIEW 1: Performance SDR (RANKING)
DROP VIEW IF EXISTS vw_performance_sdr CASCADE;
CREATE VIEW vw_performance_sdr AS
SELECT 
    u.id as user_id,
    u.nome as sdr_nome,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'convertido' THEN l.id END) as leads_convertidos,
    COUNT(DISTINCT CASE WHEN l.status = 'contato_realizado' THEN l.id END) as contatos_realizados,
    COUNT(DISTINCT m.id) as reunioes_marcadas,
    ROUND(
        COUNT(DISTINCT CASE WHEN l.status = 'convertido' THEN l.id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT l.id), 0) * 100, 
        2
    ) as taxa_conversao,
    COALESCE(SUM(c.valor_comissao), 0)::NUMERIC(12,2) as total_comissao,
    COALESCE(SUM(CASE WHEN c.status = 'paga' THEN c.valor_comissao ELSE 0 END), 0)::NUMERIC(12,2) as comissao_paga,
    COALESCE(SUM(CASE WHEN c.status = 'pendente' THEN c.valor_comissao ELSE 0 END), 0)::NUMERIC(12,2) as comissao_pendente,
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT CASE WHEN l.status = 'convertido' THEN l.id END) DESC) as ranking_conversoes,
    ROW_NUMBER() OVER (ORDER BY SUM(c.valor_comissao) DESC) as ranking_comissoes,
    NOW() as atualizado_em
FROM admin_users u
LEFT JOIN leads l ON u.id = l.sdr_responsavel_id
LEFT JOIN meetings m ON u.id = m.sdr_id
LEFT JOIN commissions c ON u.id = c.sdr_id
WHERE u.role = 'sdr'
GROUP BY u.id, u.nome
ORDER BY total_leads DESC;

-- VIEW 2: Performance Closer (RANKING)
DROP VIEW IF EXISTS vw_performance_closer CASCADE;
CREATE VIEW vw_performance_closer AS
SELECT 
    u.id as user_id,
    u.nome as closer_nome,
    COUNT(DISTINCT m.id) as reunioes_realizadas,
    COUNT(DISTINCT CASE WHEN m.status = 'realizada' THEN m.id END) as reunioes_concluidas,
    ROUND(
        COUNT(DISTINCT CASE WHEN m.status = 'realizada' THEN m.id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT m.id), 0) * 100, 
        2
    ) as taxa_sucesso_reunioes,
    COUNT(DISTINCT CASE WHEN l.status = 'convertido' THEN l.id END) as vendas_fechadas,
    COALESCE(SUM(c.valor_comissao), 0)::NUMERIC(12,2) as total_comissao,
    COALESCE(SUM(CASE WHEN c.status = 'paga' THEN c.valor_comissao ELSE 0 END), 0)::NUMERIC(12,2) as comissao_paga,
    COALESCE(SUM(CASE WHEN c.status = 'pendente' THEN c.valor_comissao ELSE 0 END), 0)::NUMERIC(12,2) as comissao_pendente,
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT CASE WHEN l.status = 'convertido' THEN l.id END) DESC) as ranking_vendas,
    ROW_NUMBER() OVER (ORDER BY SUM(c.valor_comissao) DESC) as ranking_comissoes,
    NOW() as atualizado_em
FROM admin_users u
LEFT JOIN meetings m ON u.id = m.closer_id
LEFT JOIN leads l ON l.id = m.lead_id
LEFT JOIN commissions c ON u.id = c.closer_id
WHERE u.role = 'closer'
GROUP BY u.id, u.nome
ORDER BY vendas_fechadas DESC;

-- VIEW 3: Pipeline Comercial Completo
DROP VIEW IF EXISTS vw_pipeline_comercial CASCADE;
CREATE VIEW vw_pipeline_comercial AS
SELECT 
    l.id as lead_id,
    l.nome_estabelecimento,
    l.tipo,
    l.status,
    l.responsavel_nome,
    l.responsavel_telefone,
    l.responsavel_whatsapp,
    l.responsavel_email,
    l.cidade,
    l.estado,
    l.faturamento_estimado,
    l.proxima_acao,
    l.data_proxima_acao,
    u.nome as sdr_responsavel_nome,
    u.email as sdr_email,
    COUNT(DISTINCT lc.id) as total_contatos,
    COUNT(DISTINCT CASE WHEN lc.tipo_contato = 'whatsapp' THEN lc.id END) as contatos_whatsapp,
    COUNT(DISTINCT CASE WHEN lc.tipo_contato = 'telefone' THEN lc.id END) as contatos_telefone,
    COUNT(DISTINCT CASE WHEN lc.tipo_contato = 'email' THEN lc.id END) as contatos_email,
    COUNT(DISTINCT lo.id) as total_objecoes,
    COUNT(DISTINCT CASE WHEN lo.resolvida = false THEN lo.id END) as objecoes_pendentes,
    COUNT(DISTINCT m.id) as total_reunioes,
    COUNT(DISTINCT CASE WHEN m.status = 'realizada' THEN m.id END) as reunioes_realizadas,
    MAX(lc.created_at) as ultimo_contato,
    l.created_at,
    l.updated_at
FROM leads l
LEFT JOIN admin_users u ON l.sdr_responsavel_id = u.id
LEFT JOIN lead_contacts lc ON l.id = lc.lead_id
LEFT JOIN lead_objections lo ON l.id = lo.lead_id
LEFT JOIN meetings m ON l.id = m.lead_id
GROUP BY 
    l.id, l.nome_estabelecimento, l.tipo, l.status, l.responsavel_nome, 
    l.responsavel_telefone, l.responsavel_whatsapp, l.responsavel_email, 
    l.cidade, l.estado, l.faturamento_estimado, l.proxima_acao, 
    l.data_proxima_acao, u.nome, u.email, l.created_at, l.updated_at;

-- VIEW 4: Resumo de Leads por Status
DROP VIEW IF EXISTS vw_resumo_leads_status CASCADE;
CREATE VIEW vw_resumo_leads_status AS
SELECT 
    l.status,
    COUNT(DISTINCT l.id) as total_leads,
    COUNT(DISTINCT l.sdr_responsavel_id) as sdrs_envolvidos,
    COUNT(DISTINCT l.establishment_id) as estabelecimentos_vinculados,
    COALESCE(AVG(l.faturamento_estimado), 0)::NUMERIC(12,2) as faturamento_medio_estimado,
    COALESCE(SUM(l.faturamento_estimado), 0)::NUMERIC(12,2) as faturamento_total_estimado,
    MAX(l.updated_at) as ultima_atualizacao,
    MAX(CASE WHEN l.status = 'novo' THEN l.created_at END) as primeiro_lead_novo,
    ROUND(
        COUNT(DISTINCT l.id)::NUMERIC / 
        (SELECT COUNT(*) FROM leads)::NUMERIC * 100, 
        2
    ) as percentual_total
FROM leads l
GROUP BY l.status
ORDER BY COUNT(DISTINCT l.id) DESC;

-- VIEW 5: Ranking Geral de Comissões (SDR + Closer)
DROP VIEW IF EXISTS vw_ranking_comissoes CASCADE;
CREATE VIEW vw_ranking_comissoes AS
SELECT 
    c.id as comissao_id,
    COALESCE(sdr.nome, 'Não Atribuído') as sdr_nome,
    COALESCE(closer.nome, 'Não Atribuído') as closer_nome,
    e.nome as estabelecimento_nome,
    c.plano_valor,
    c.percentual_comissao,
    c.valor_comissao,
    c.tipo_comissao,
    c.status,
    c.mes_referencia,
    ROW_NUMBER() OVER (PARTITION BY c.status ORDER BY c.valor_comissao DESC) as ranking_por_status,
    ROW_NUMBER() OVER (ORDER BY c.valor_comissao DESC) as ranking_geral,
    c.created_at
FROM commissions c
LEFT JOIN admin_users sdr ON c.sdr_id = sdr.id
LEFT JOIN admin_users closer ON c.closer_id = closer.id
LEFT JOIN establishments e ON c.establishment_id = e.id
ORDER BY c.valor_comissao DESC;

-- VIEW 6: Dashboard Executivo (KPIs)
DROP VIEW IF EXISTS vw_dashboard_kpis CASCADE;
CREATE VIEW vw_dashboard_kpis AS
SELECT 
    'total_leads_ativos' as kpi_nome,
    COUNT(DISTINCT CASE WHEN status != 'convertido' AND status != 'perdido' THEN id END)::TEXT as valor
FROM leads
UNION ALL
SELECT 
    'leads_convertidos',
    COUNT(DISTINCT CASE WHEN status = 'convertido' THEN id END)::TEXT
FROM leads
UNION ALL
SELECT 
    'taxa_conversao_geral',
    ROUND(
        COUNT(DISTINCT CASE WHEN status = 'convertido' THEN id END)::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    )::TEXT
FROM leads
UNION ALL
SELECT 
    'comissoes_pendentes',
    COALESCE(SUM(valor_comissao)::NUMERIC(12,2), 0)::TEXT
FROM commissions
WHERE status = 'pendente'
UNION ALL
SELECT 
    'comissoes_pagas',
    COALESCE(SUM(valor_comissao)::NUMERIC(12,2), 0)::TEXT
FROM commissions
WHERE status = 'paga'
UNION ALL
SELECT 
    'reunioes_agendadas',
    COUNT(*)::TEXT
FROM meetings
WHERE status = 'agendada'
UNION ALL
SELECT 
    'reunioes_realizadas',
    COUNT(*)::TEXT
FROM meetings
WHERE status = 'realizada'
UNION ALL
SELECT 
    'objecoes_nao_resolvidas',
    COUNT(*)::TEXT
FROM lead_objections
WHERE resolvida = false;

-- VIEW 7: Leads com Próxima Ação (para notificações)
DROP VIEW IF EXISTS vw_leads_proxima_acao CASCADE;
CREATE VIEW vw_leads_proxima_acao AS
SELECT 
    l.id,
    l.nome_estabelecimento,
    l.responsavel_nome,
    l.responsavel_telefone,
    l.responsavel_whatsapp,
    l.proxima_acao,
    l.data_proxima_acao,
    u.nome as sdr_nome,
    u.email as sdr_email,
    CASE 
        WHEN l.data_proxima_acao IS NULL THEN 'SEM DATA'
        WHEN l.data_proxima_acao < NOW() THEN 'ATRASADO'
        WHEN l.data_proxima_acao < NOW() + INTERVAL '24 hours' THEN 'PRÓXIMAS 24H'
        WHEN l.data_proxima_acao < NOW() + INTERVAL '7 days' THEN 'PRÓXIMA SEMANA'
        ELSE 'FUTURO'
    END as urgencia,
    EXTRACT(DAY FROM l.data_proxima_acao - NOW())::INT as dias_restantes,
    NOW() as consultado_em
FROM leads l
LEFT JOIN admin_users u ON l.sdr_responsavel_id = u.id
WHERE l.status NOT IN ('convertido', 'perdido') 
AND l.proxima_acao IS NOT NULL
ORDER BY l.data_proxima_acao ASC;

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_proxima_acao_data ON leads(proxima_acao, data_proxima_acao);
CREATE INDEX IF NOT EXISTS idx_leads_status_sdr ON leads(status, sdr_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_commissions_sdr_status ON commissions(sdr_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_closer_status ON commissions(closer_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_tipo ON lead_contacts(tipo_contato);
CREATE INDEX IF NOT EXISTS idx_lead_objections_tipo ON lead_objections(tipo_objecao);
CREATE INDEX IF NOT EXISTS idx_meetings_status_data ON meetings(status, data_reuniao);

-- =====================================================
-- FIM DO SETUP COMERCIAL v2 - COMPLETO COM TODAS AS FUNCIONALIDADES
-- =====================================================
