-- =====================================================
-- BARON CONTROL - PAINEL ADMINISTRATIVO MASTER
-- Script SQL para Supabase
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- TABELA: establishments (Clientes do Baron Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_painel_hash TEXT, -- Senha para acesso ao painel financeiro
    telefone VARCHAR(20),
    documento VARCHAR(20) NOT NULL, -- CNPJ ou CPF
    tipo_documento VARCHAR(10) DEFAULT 'cnpj' CHECK (tipo_documento IN ('cpf', 'cnpj')),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url TEXT,
    plano VARCHAR(20) DEFAULT 'basico' CHECK (plano IN ('basico', 'profissional', 'enterprise')),
    data_plano_inicio TIMESTAMP WITH TIME ZONE,
    data_plano_fim TIMESTAMP WITH TIME ZONE,
    num_funcionarios INTEGER DEFAULT 0,
    media_faturamento DECIMAL(12, 2) DEFAULT 0,
    faturamento_total DECIMAL(14, 2) DEFAULT 0,
    total_pedidos INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('ativo', 'inativo', 'pendente', 'cancelado')),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_ultimo_acesso TIMESTAMP WITH TIME ZONE,
    responsavel_nome VARCHAR(255),
    responsavel_telefone VARCHAR(20),
    responsavel_email VARCHAR(255),
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para establishments
CREATE INDEX IF NOT EXISTS idx_establishments_status ON establishments(status);
CREATE INDEX IF NOT EXISTS idx_establishments_plano ON establishments(plano);
CREATE INDEX IF NOT EXISTS idx_establishments_cidade ON establishments(cidade);
CREATE INDEX IF NOT EXISTS idx_establishments_estado ON establishments(estado);

-- =====================================================
-- TABELA: categorias (Categorias de produtos)
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorias_establishment ON categorias(establishment_id);

-- =====================================================
-- TABELA: produtos
-- =====================================================
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    preco_promocional DECIMAL(10, 2),
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    total_vendas INTEGER DEFAULT 0,
    estoque INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_establishment ON produtos(establishment_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_total_vendas ON produtos(total_vendas DESC);

-- =====================================================
-- TABELA: clientes (Clientes finais dos estabelecimentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    endereco TEXT,
    complemento TEXT,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_pedidos INTEGER DEFAULT 0,
    total_gasto DECIMAL(12, 2) DEFAULT 0,
    ultimo_pedido TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_establishment ON clientes(establishment_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

-- =====================================================
-- TABELA: pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    numero_pedido SERIAL,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    cliente_endereco TEXT,
    valor_subtotal DECIMAL(10, 2) NOT NULL,
    valor_entrega DECIMAL(10, 2) DEFAULT 0,
    valor_desconto DECIMAL(10, 2) DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL,
    forma_pagamento VARCHAR(50),
    troco_para DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'pronto', 'saiu_entrega', 'entregue', 'cancelado')),
    tipo_entrega VARCHAR(20) DEFAULT 'delivery' CHECK (tipo_entrega IN ('delivery', 'retirada', 'mesa')),
    numero_mesa INTEGER,
    observacoes TEXT,
    tempo_estimado INTEGER, -- em minutos
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_confirmacao TIMESTAMP WITH TIME ZONE,
    data_preparo TIMESTAMP WITH TIME ZONE,
    data_pronto TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    data_cancelamento TIMESTAMP WITH TIME ZONE,
    motivo_cancelamento TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_establishment ON pedidos(establishment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido DESC);

-- =====================================================
-- TABELA: pedido_itens
-- =====================================================
CREATE TABLE IF NOT EXISTS pedido_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    nome_produto VARCHAR(255) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    preco_total DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    adicionais JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto ON pedido_itens(produto_id);

-- =====================================================
-- TABELA: faturamento_diario (Agregado para relatórios)
-- =====================================================
CREATE TABLE IF NOT EXISTS faturamento_diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    quantidade_pedidos INTEGER DEFAULT 0,
    valor_total DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(establishment_id, data)
);

CREATE INDEX IF NOT EXISTS idx_faturamento_establishment ON faturamento_diario(establishment_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_data ON faturamento_diario(data DESC);

-- =====================================================
-- TABELA: admin_users (Usuários do painel master)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer', 'sdr', 'closer')),
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: logs_sistema (Auditoria)
-- =====================================================
CREATE TABLE IF NOT EXISTS logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_admin ON logs_sistema(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_sistema(created_at DESC);

-- =====================================================
-- MÓDULO COMERCIAL - NOVOS TIPOS DE USUÁRIO E GESTÃO
-- =====================================================

-- =====================================================
-- TABELA: leads (Pipeline comercial)
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
    nome_estabelecimento VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('bar', 'balada', 'restaurante', 'cafe', 'pizzaria', 'hamburgueria', 'outro')),
    responsavel_nome VARCHAR(255) NOT NULL,
    responsavel_telefone VARCHAR(20) NOT NULL,
    responsavel_whatsapp VARCHAR(20),
    responsavel_email VARCHAR(255),
    instagram VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    faturamento_estimado DECIMAL(12, 2),
    origem_lead VARCHAR(100) NOT NULL CHECK (origem_lead IN ('indicacao', 'prospeccao', 'evento', 'rede-social', 'referencia', 'outro')),
    sdr_responsavel_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'novo' CHECK (status IN ('novo', 'contato_realizado', 'interessado', 'reuniao_marcada', 'reuniao_realizada', 'perdido', 'convertido')),
    motivo_perda TEXT,
    data_conversao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_sdr ON leads(sdr_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_leads_establishment ON leads(establishment_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);
CREATE INDEX IF NOT EXISTS idx_leads_data ON leads(created_at DESC);

-- Trigger para atualizar updated_at em leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: lead_contacts (Histórico de contatos/interações)
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_contacts (
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
CREATE TABLE IF NOT EXISTS lead_objections (
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
-- TABELA: meetings (Reuniões)
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sdr_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    closer_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
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

-- Trigger para atualizar updated_at em meetings
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: commissions (Comissões de vendas)
-- =====================================================
CREATE TABLE IF NOT EXISTS commissions (
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

-- Trigger para atualizar updated_at em commissions
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_leads_sdr_status ON leads(sdr_responsavel_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_periodo ON commissions(mes_referencia, status);
CREATE INDEX IF NOT EXISTS idx_meetings_realizado ON meetings(status, data_reuniao);

-- =====================================================
-- FIM DO MÓDULO COMERCIAL
-- =====================================================

-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_establishment ON withdrawal_requests(establishment_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_data ON withdrawal_requests(requested_at DESC);

-- Trigger para atualizar updated_at em withdrawal_requests
DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABELA: audit_logs (Log de Auditoria de Saques)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    withdrawal_request_id UUID NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_withdrawal_request ON audit_logs(withdrawal_request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data ON audit_logs(created_at DESC);


-- =====================================================
-- FUNCTIONS E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at

DROP TRIGGER IF EXISTS update_produtos_updated_at ON produtos;
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas do cliente após pedido
CREATE OR REPLACE FUNCTION atualizar_estatisticas_cliente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cliente_id IS NOT NULL THEN
        UPDATE clientes
        SET 
            total_pedidos = total_pedidos + 1,
            total_gasto = total_gasto + NEW.valor_total,
            ultimo_pedido = NEW.data_pedido
        WHERE id = NEW.cliente_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_atualizar_estatisticas_cliente ON pedidos;
CREATE TRIGGER trigger_atualizar_estatisticas_cliente
    AFTER INSERT ON pedidos
    FOR EACH ROW EXECUTE FUNCTION atualizar_estatisticas_cliente();

-- Função para atualizar total de vendas do produto
CREATE OR REPLACE FUNCTION atualizar_vendas_produto()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.produto_id IS NOT NULL THEN
        UPDATE produtos
        SET total_vendas = total_vendas + NEW.quantidade
        WHERE id = NEW.produto_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_atualizar_vendas_produto ON pedido_itens;
CREATE TRIGGER trigger_atualizar_vendas_produto
    AFTER INSERT ON pedido_itens
    FOR EACH ROW EXECUTE FUNCTION atualizar_vendas_produto();

-- =====================================================
-- FUNÇÕES DO MÓDULO COMERCIAL
-- =====================================================

-- Função para converter lead em estabelecimento
CREATE OR REPLACE FUNCTION converter_lead_para_estabelecimento(
    p_lead_id UUID,
    p_establishment_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_novo_establishment_id UUID;
    v_lead leads%ROWTYPE;
BEGIN
    -- Buscar dados do lead
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
    
    IF v_lead IS NULL THEN
        RAISE EXCEPTION 'Lead não encontrado';
    END IF;
    
    -- Se não informou establishment_id, criar novo
    IF p_establishment_id IS NULL THEN
        INSERT INTO establishments (
            nome, email, telefone, documento, tipo_documento,
            endereco, cidade, estado, responsavel_nome, responsavel_email,
            responsavel_telefone, plano, status, data_cadastro
        ) VALUES (
            v_lead.nome_estabelecimento,
            v_lead.responsavel_email,
            v_lead.responsavel_telefone,
            '00.000.000/0000-00', -- placeholder
            'cnpj',
            NULL,
            v_lead.cidade,
            v_lead.estado,
            v_lead.responsavel_nome,
            v_lead.responsavel_email,
            v_lead.responsavel_telefone,
            'basico',
            'ativo',
            NOW()
        )
        RETURNING id INTO v_novo_establishment_id;
    ELSE
        v_novo_establishment_id := p_establishment_id;
    END IF;
    
    -- Atualizar lead como convertido
    UPDATE leads 
    SET 
        establishment_id = v_novo_establishment_id,
        status = 'convertido',
        data_conversao = NOW(),
        updated_at = NOW()
    WHERE id = p_lead_id;
    
    RETURN v_novo_establishment_id;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar comissão automática na conversão
CREATE OR REPLACE FUNCTION gerar_comissao_conversao()
RETURNS TRIGGER AS $$
DECLARE
    v_valor_plano DECIMAL(12, 2);
    v_sdr_id UUID;
BEGIN
    -- Apenas se status mudou para convertido
    IF NEW.status = 'convertido' AND OLD.status != 'convertido' THEN
        v_sdr_id := NEW.sdr_responsavel_id;
        v_valor_plano := COALESCE(NEW.faturamento_estimado, 160.00);
        
        -- Criar comissão para SDR se existir
        IF v_sdr_id IS NOT NULL THEN
            INSERT INTO commissions (
                establishment_id,
                sdr_id,
                plano_valor,
                percentual_comissao,
                valor_comissao,
                tipo_comissao,
                mes_referencia
            ) VALUES (
                NEW.establishment_id,
                v_sdr_id,
                v_valor_plano,
                65.00,
                v_valor_plano * 0.65,
                'primeira_venda',
                CURRENT_DATE - (EXTRACT(DAY FROM CURRENT_DATE) - 1)::INTEGER * INTERVAL '1 day'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar comissão ao converter lead
DROP TRIGGER IF EXISTS trigger_gerar_comissao_conversao ON leads;
CREATE TRIGGER trigger_gerar_comissao_conversao
    AFTER UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION gerar_comissao_conversao();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View: Resumo de estabelecimentos
CREATE OR REPLACE VIEW vw_resumo_estabelecimentos AS
SELECT 
    e.id,
    e.nome,
    e.cidade,
    e.estado,
    e.plano,
    e.status,
    e.data_cadastro,
    COUNT(DISTINCT p.id) as total_pedidos,
    COALESCE(SUM(p.valor_total), 0) as faturamento_total,
    COALESCE(AVG(p.valor_total), 0) as ticket_medio,
    MAX(p.data_pedido) as ultimo_pedido
FROM establishments e
LEFT JOIN pedidos p ON e.id = p.establishment_id AND p.status = 'entregue'
GROUP BY e.id;

-- View: Faturamento por período
CREATE OR REPLACE VIEW vw_faturamento_mensal AS
SELECT 
    e.id as establishment_id,
    e.nome as establishment_nome,
    DATE_TRUNC('month', p.data_pedido) as mes,
    COUNT(p.id) as quantidade_pedidos,
    SUM(p.valor_total) as faturamento,
    AVG(p.valor_total) as ticket_medio
FROM establishments e
LEFT JOIN pedidos p ON e.id = p.establishment_id AND p.status = 'entregue'
WHERE p.data_pedido IS NOT NULL
GROUP BY e.id, e.nome, DATE_TRUNC('month', p.data_pedido)
ORDER BY mes DESC;

-- View: Produtos mais vendidos
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
    pr.id,
    pr.nome,
    pr.preco,
    pr.total_vendas,
    e.id as establishment_id,
    e.nome as establishment_nome,
    c.nome as categoria_nome
FROM produtos pr
JOIN establishments e ON pr.establishment_id = e.id
LEFT JOIN categorias c ON pr.categoria_id = c.id
WHERE pr.ativo = true
ORDER BY pr.total_vendas DESC;

-- =====================================================
-- VIEWS DO MÓDULO COMERCIAL
-- =====================================================

-- View: Performance de SDRs
CREATE OR REPLACE VIEW vw_performance_sdr AS
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
    COALESCE(SUM(c.valor_comissao), 0) as total_comissao,
    COALESCE(SUM(CASE WHEN c.status = 'paga' THEN c.valor_comissao ELSE 0 END), 0) as comissao_paga
FROM admin_users u
LEFT JOIN leads l ON u.id = l.sdr_responsavel_id
LEFT JOIN meetings m ON u.id = m.sdr_id
LEFT JOIN commissions c ON u.id = c.sdr_id
WHERE u.role = 'sdr'
GROUP BY u.id, u.nome;

-- View: Performance de Closers
CREATE OR REPLACE VIEW vw_performance_closer AS
SELECT 
    u.id as user_id,
    u.nome as closer_nome,
    COUNT(DISTINCT m.id) as reunioes_realizadas,
    COUNT(DISTINCT CASE WHEN m.status = 'realizada' THEN m.id END) as reunioes_concluidas,
    COUNT(DISTINCT e.id) as vendas_fechadas,
    COALESCE(SUM(c.valor_comissao), 0) as total_comissao,
    COALESCE(SUM(CASE WHEN c.status = 'paga' THEN c.valor_comissao ELSE 0 END), 0) as comissao_paga,
    COALESCE(SUM(CASE WHEN c.status = 'pendente' THEN c.valor_comissao ELSE 0 END), 0) as comissao_pendente
FROM admin_users u
LEFT JOIN meetings m ON u.id = m.closer_id
LEFT JOIN leads l ON l.id = m.lead_id AND l.status = 'convertido'
LEFT JOIN establishments e ON l.establishment_id = e.id
LEFT JOIN commissions c ON u.id = c.closer_id
WHERE u.role = 'closer'
GROUP BY u.id, u.nome;

-- View: Resumo de Leads por Status
CREATE OR REPLACE VIEW vw_resumo_leads_status AS
SELECT 
    status,
    COUNT(*) as total_leads,
    COUNT(DISTINCT sdr_responsavel_id) as sdrs_envolvidos,
    COUNT(DISTINCT establishment_id) as estabelecimentos_vinculados,
    COALESCE(AVG(faturamento_estimado), 0) as faturamento_medio_estimado,
    MAX(updated_at) as ultima_atualizacao
FROM leads
GROUP BY status;

-- View: Pipeline Comercial Completo
CREATE OR REPLACE VIEW vw_pipeline_comercial AS
SELECT 
    l.id as lead_id,
    l.nome_estabelecimento,
    l.tipo,
    l.status,
    l.sdr_responsavel_id,
    u_sdr.nome as sdr_nome,
    COUNT(DISTINCT lc.id) as total_contatos,
    COUNT(DISTINCT lo.id) as total_objecoes,
    COUNT(DISTINCT m.id) as total_reunioes,
    MAX(lc.created_at) as ultimo_contato,
    l.faturamento_estimado,
    CASE WHEN c.id IS NOT NULL THEN c.valor_comissao ELSE 0 END as comissao_esperada,
    l.created_at
FROM leads l
LEFT JOIN admin_users u_sdr ON l.sdr_responsavel_id = u_sdr.id
LEFT JOIN lead_contacts lc ON l.id = lc.lead_id
LEFT JOIN lead_objections lo ON l.id = lo.lead_id
LEFT JOIN meetings m ON l.id = m.lead_id
LEFT JOIN commissions c ON l.establishment_id = c.establishment_id AND l.status = 'convertido'
GROUP BY l.id, u_sdr.id, u_sdr.nome, c.id, c.valor_comissao;

-- =====================================================
-- FIM DAS VIEWS COMERCIAIS
-- =====================================================

-- =====================================================

-- Função para obter estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_estabelecimentos', (SELECT COUNT(*) FROM establishments),
        'estabelecimentos_ativos', (SELECT COUNT(*) FROM establishments WHERE status = 'ativo'),
        'estabelecimentos_novos_mes', (SELECT COUNT(*) FROM establishments WHERE data_cadastro >= DATE_TRUNC('month', CURRENT_DATE)),
        'total_pedidos', (SELECT COUNT(*) FROM pedidos),
        'pedidos_hoje', (SELECT COUNT(*) FROM pedidos WHERE DATE(data_pedido) = CURRENT_DATE),
        'faturamento_total', (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status = 'entregue'),
        'faturamento_mes', (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status = 'entregue' AND data_pedido >= DATE_TRUNC('month', CURRENT_DATE)),
        'ticket_medio', (SELECT COALESCE(AVG(valor_total), 0) FROM pedidos WHERE status = 'entregue')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para obter faturamento por período
CREATE OR REPLACE FUNCTION get_faturamento_periodo(
    data_inicio DATE,
    data_fim DATE,
    p_establishment_id UUID DEFAULT NULL
)
RETURNS TABLE (
    data DATE,
    quantidade_pedidos BIGINT,
    valor_total NUMERIC,
    ticket_medio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(p.data_pedido) as data,
        COUNT(p.id) as quantidade_pedidos,
        SUM(p.valor_total) as valor_total,
        AVG(p.valor_total) as ticket_medio
    FROM pedidos p
    WHERE p.status = 'entregue'
        AND DATE(p.data_pedido) BETWEEN data_inicio AND data_fim
        AND (p_establishment_id IS NULL OR p.establishment_id = p_establishment_id)
    GROUP BY DATE(p.data_pedido)
    ORDER BY DATE(p.data_pedido);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Políticas para admin (acesso total)
DROP POLICY IF EXISTS admin_all_establishments ON establishments;
CREATE POLICY admin_all_establishments ON establishments
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_produtos ON produtos;
CREATE POLICY admin_all_produtos ON produtos
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_pedidos ON pedidos;
CREATE POLICY admin_all_pedidos ON pedidos
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_clientes ON clientes;
CREATE POLICY admin_all_clientes ON clientes
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_leads ON leads;
CREATE POLICY admin_all_leads ON leads
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_lead_contacts ON lead_contacts;
CREATE POLICY admin_all_lead_contacts ON lead_contacts
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_lead_objections ON lead_objections;
CREATE POLICY admin_all_lead_objections ON lead_objections
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_meetings ON meetings;
CREATE POLICY admin_all_meetings ON meetings
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_commissions ON commissions;
CREATE POLICY admin_all_commissions ON commissions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- POLÍTICAS RLS PARA SDR
-- =====================================================

-- SDR pode ver apenas seus próprios leads
DROP POLICY IF EXISTS sdr_own_leads ON leads;
CREATE POLICY sdr_own_leads ON leads
    FOR SELECT
    USING (sdr_responsavel_id = auth.uid());

-- SDR pode criar leads
DROP POLICY IF EXISTS sdr_create_leads ON leads;
CREATE POLICY sdr_create_leads ON leads
    FOR INSERT
    WITH CHECK (sdr_responsavel_id = auth.uid());

-- SDR pode atualizar seus próprios leads
DROP POLICY IF EXISTS sdr_update_leads ON leads;
CREATE POLICY sdr_update_leads ON leads
    FOR UPDATE
    USING (sdr_responsavel_id = auth.uid())
    WITH CHECK (sdr_responsavel_id = auth.uid());

-- SDR pode ver contatos dos seus leads
DROP POLICY IF EXISTS sdr_own_lead_contacts ON lead_contacts;
CREATE POLICY sdr_own_lead_contacts ON lead_contacts
    FOR ALL
    USING (
        lead_id IN (
            SELECT id FROM leads WHERE sdr_responsavel_id = auth.uid()
        )
    );

-- SDR pode ver objeções dos seus leads
DROP POLICY IF EXISTS sdr_own_lead_objections ON lead_objections;
CREATE POLICY sdr_own_lead_objections ON lead_objections
    FOR ALL
    USING (
        lead_id IN (
            SELECT id FROM leads WHERE sdr_responsavel_id = auth.uid()
        )
    );

-- SDR pode ver reuniões atribuídas a ele ou dos seus leads
DROP POLICY IF EXISTS sdr_own_meetings ON meetings;
CREATE POLICY sdr_own_meetings ON meetings
    FOR ALL
    USING (
        sdr_id = auth.uid() OR 
        lead_id IN (SELECT id FROM leads WHERE sdr_responsavel_id = auth.uid())
    );

-- SDR NÃO pode ver comissões (exclusivo para Closer)
DROP POLICY IF EXISTS sdr_no_commissions ON commissions;
CREATE POLICY sdr_no_commissions ON commissions
    FOR SELECT
    USING (false);

-- =====================================================
-- POLÍTICAS RLS PARA CLOSER
-- =====================================================

-- Closer pode ver leads que têm reunião atribuída a ele
DROP POLICY IF EXISTS closer_visible_leads ON leads;
CREATE POLICY closer_visible_leads ON leads
    FOR SELECT
    USING (
        id IN (
            SELECT lead_id FROM meetings WHERE closer_id = auth.uid()
        )
    );

-- Closer pode ver reuniões atribuídas a ele
DROP POLICY IF EXISTS closer_own_meetings ON meetings;
CREATE POLICY closer_own_meetings ON meetings
    FOR ALL
    USING (closer_id = auth.uid());

-- Closer pode atualizar reuniões atribuídas a ele
DROP POLICY IF EXISTS closer_update_meetings ON meetings;
CREATE POLICY closer_update_meetings ON meetings
    FOR UPDATE
    USING (closer_id = auth.uid())
    WITH CHECK (closer_id = auth.uid());

-- Closer pode ver suas próprias comissões
DROP POLICY IF EXISTS closer_own_commissions ON commissions;
CREATE POLICY closer_own_commissions ON commissions
    FOR SELECT
    USING (closer_id = auth.uid());

-- Closer pode ver contatos dos leads em suas reuniões
DROP POLICY IF EXISTS closer_lead_contacts ON lead_contacts;
CREATE POLICY closer_lead_contacts ON lead_contacts
    FOR SELECT
    USING (
        lead_id IN (
            SELECT lead_id FROM meetings WHERE closer_id = auth.uid()
        )
    );

-- Closer pode criar objeções para leads em suas reuniões
DROP POLICY IF EXISTS closer_create_objections ON lead_objections;
CREATE POLICY closer_create_objections ON lead_objections
    FOR INSERT
    WITH CHECK (
        lead_id IN (
            SELECT lead_id FROM meetings WHERE closer_id = auth.uid()
        )
    );

-- Closer pode ver objeções dos leads em suas reuniões
DROP POLICY IF EXISTS closer_view_objections ON lead_objections;
CREATE POLICY closer_view_objections ON lead_objections
    FOR SELECT
    USING (
        lead_id IN (
            SELECT lead_id FROM meetings WHERE closer_id = auth.uid()
        )
    );

-- =====================================================
-- DADOS DE EXEMPLO (SEED)
-- =====================================================

-- Inserir admin master
INSERT INTO admin_users (email, senha_hash, nome, role) VALUES
('admin@baroncontrol.com', '$2a$10$example_hash', 'Admin Master', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Inserir estabelecimentos de exemplo
INSERT INTO establishments (nome, email, telefone, documento, endereco, cidade, estado, cep, plano, status, latitude, longitude) VALUES
('Pizzaria Bella Napoli', 'contato@bellanapoli.com', '11999998888', '12.345.678/0001-90', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'profissional', 'ativo', -23.550520, -46.633308),
('Hamburgueria The Burger', 'contato@theburger.com', '11988887777', '98.765.432/0001-10', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 'enterprise', 'ativo', -23.561684, -46.655981),
('Sushi Nakamura', 'contato@sushinakamura.com', '11977776666', '11.222.333/0001-44', 'Rua Liberdade, 500', 'São Paulo', 'SP', '01503-000', 'basico', 'ativo', -23.558345, -46.632410),
('Cantina Italiana Mamma Mia', 'contato@mammamia.com', '21966665555', '55.666.777/0001-88', 'Rua Copacabana, 200', 'Rio de Janeiro', 'RJ', '22020-001', 'profissional', 'ativo', -22.971177, -43.182543),
('Açaí Point', 'contato@acaipoint.com', '31955554444', '22.333.444/0001-55', 'Av. Amazonas, 1500', 'Belo Horizonte', 'MG', '30180-001', 'basico', 'pendente', -19.919052, -43.938573)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
