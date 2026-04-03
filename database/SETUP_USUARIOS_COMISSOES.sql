-- =====================================================
-- SETUP: USUÁRIOS SDR/CLOSER E LÓGICA DE COMISSÕES
-- =====================================================

-- =====================================================
-- 1. CRIAR USUÁRIOS MIGUEL (SDR/CLOSER) E MURILO (SDR/CLOSER)
-- =====================================================

INSERT INTO admin_users (email, senha_hash, nome, role, ativo)
VALUES 
    ('miguel@baroncontrol.com', '$2a$10$example_hash_miguel', 'Miguel', 'closer', true),
    ('murilo@baroncontrol.com', '$2a$10$example_hash_murilo', 'Murilo', 'closer', true)
ON CONFLICT (email) DO NOTHING;

-- Obter IDs dos usuários (para uso posterior)
-- SELECT id, nome FROM admin_users WHERE email IN ('miguel@baroncontrol.com', 'murilo@baroncontrol.com');

-- =====================================================
-- 2. ATUALIZAR TRIGGER DE COMISSÕES COM NOVA LÓGICA
-- =====================================================

-- Função para calcular comissão baseado em SDR/Closer
DROP FUNCTION IF EXISTS calcular_comissao_lead() CASCADE;
CREATE OR REPLACE FUNCTION calcular_comissao_lead()
RETURNS TRIGGER AS $$
DECLARE
    v_plano_valor DECIMAL;
    v_sdr_id UUID;
    v_closer_id UUID;
    v_percentual DECIMAL;
    v_valor_comissao DECIMAL;
BEGIN
    -- Se o lead foi convertido, criar registros de comissão
    IF NEW.status = 'convertido' AND OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Buscar dados da primeira comissão associada ao lead
        -- Assumindo que há um vínculo indireto via meetings ou comissions
        -- Para simplificar, vamos atualizar o percentual baseado na lógica:
        
        -- LÓGICA DE COMISSÃO:
        -- 1. Se há um SDR e um Closer DIFERENTES: 70% dividido (35% cada)
        -- 2. Se o mesmo usuário é SDR E Closer: 65% completo para esse usuário
        
        -- Por enquanto, deixar a aplicação lidar com isso
        -- Este trigger apenas marca a conversão
        NEW.data_conversao = NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para quando lead é convertido
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON leads;
CREATE TRIGGER trigger_calcular_comissao
    BEFORE UPDATE ON leads
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION calcular_comissao_lead();

-- =====================================================
-- 3. CRIAR VIEW PARA RANKING COM COMISSÕES
-- =====================================================

DROP VIEW IF EXISTS vw_ranking_comissoes CASCADE;
CREATE VIEW vw_ranking_comissoes AS
SELECT 
    au.id,
    au.nome,
    au.email,
    au.role,
    -- COMISSÕES COMO SDR
    COUNT(CASE WHEN m.sdr_id = au.id AND l.status = 'convertido' THEN 1 END) as leads_convertidos_como_sdr,
    COALESCE(SUM(CASE WHEN m.sdr_id = au.id AND l.status = 'convertido' AND m.closer_id IS NULL THEN c.valor_comissao * 0.65 END), 0) as comissao_sdr_100,
    COALESCE(SUM(CASE WHEN m.sdr_id = au.id AND l.status = 'convertido' AND m.closer_id IS NOT NULL THEN c.valor_comissao * 0.35 END), 0) as comissao_sdr_compartilhada,
    -- COMISSÕES COMO CLOSER
    COUNT(CASE WHEN m.closer_id = au.id AND l.status = 'convertido' THEN 1 END) as leads_convertidos_como_closer,
    COALESCE(SUM(CASE WHEN m.closer_id = au.id AND l.status = 'convertido' AND m.sdr_id IS NULL THEN c.valor_comissao * 0.65 END), 0) as comissao_closer_100,
    COALESCE(SUM(CASE WHEN m.closer_id = au.id AND l.status = 'convertido' AND m.sdr_id IS NOT NULL THEN c.valor_comissao * 0.35 END), 0) as comissao_closer_compartilhada,
    -- TOTAIS
    (
        COALESCE(SUM(CASE WHEN m.sdr_id = au.id AND l.status = 'convertido' AND m.closer_id IS NULL THEN c.valor_comissao * 0.65 END), 0) +
        COALESCE(SUM(CASE WHEN m.sdr_id = au.id AND l.status = 'convertido' AND m.closer_id IS NOT NULL THEN c.valor_comissao * 0.35 END), 0) +
        COALESCE(SUM(CASE WHEN m.closer_id = au.id AND l.status = 'convertido' AND m.sdr_id IS NULL THEN c.valor_comissao * 0.65 END), 0) +
        COALESCE(SUM(CASE WHEN m.closer_id = au.id AND l.status = 'convertido' AND m.sdr_id IS NOT NULL THEN c.valor_comissao * 0.35 END), 0)
    ) as comissao_total
FROM admin_users au
LEFT JOIN meetings m ON (m.sdr_id = au.id OR m.closer_id = au.id)
LEFT JOIN leads l ON m.lead_id = l.id
LEFT JOIN commissions c ON (c.sdr_id = au.id OR c.closer_id = au.id)
WHERE au.role IN ('sdr', 'closer')
GROUP BY au.id, au.nome, au.email, au.role
ORDER BY comissao_total DESC;

-- =====================================================
-- 4. VIEW SIMPLES PARA RANKING (LEADERBOARD)
-- =====================================================

DROP VIEW IF EXISTS vw_ranking_simples CASCADE;
CREATE VIEW vw_ranking_simples AS
SELECT 
    au.id,
    au.nome,
    COUNT(CASE WHEN l.status = 'convertido' THEN 1 END) as total_conversoes,
    COALESCE(
        SUM(
            CASE 
                -- SDR com Closer diferente: 35%
                WHEN m.sdr_id = au.id AND m.closer_id IS NOT NULL AND l.status = 'convertido' THEN c.valor_comissao * 0.35
                -- SDR sem Closer: 65%
                WHEN m.sdr_id = au.id AND m.closer_id IS NULL AND l.status = 'convertido' THEN c.valor_comissao * 0.65
                -- Closer com SDR diferente: 35%
                WHEN m.closer_id = au.id AND m.sdr_id IS NOT NULL AND l.status = 'convertido' THEN c.valor_comissao * 0.35
                -- Closer sem SDR: 65%
                WHEN m.closer_id = au.id AND m.sdr_id IS NULL AND l.status = 'convertido' THEN c.valor_comissao * 0.65
            END
        ),
        0
    ) as comissao_total,
    COUNT(CASE WHEN l.status = 'novo' THEN 1 END) as leads_novos,
    COUNT(CASE WHEN l.status = 'contato_realizado' THEN 1 END) as leads_contatados,
    COUNT(CASE WHEN l.status = 'interessado' THEN 1 END) as leads_interessados,
    COUNT(CASE WHEN l.status = 'reuniao_marcada' THEN 1 END) as leads_reuniao_marcada,
    COUNT(CASE WHEN l.status = 'reuniao_realizada' THEN 1 END) as leads_reuniao_realizada
FROM admin_users au
LEFT JOIN meetings m ON (m.sdr_id = au.id OR m.closer_id = au.id)
LEFT JOIN leads l ON m.lead_id = l.id
LEFT JOIN commissions c ON c.id = (
    SELECT id FROM commissions 
    WHERE (sdr_id = au.id OR closer_id = au.id) 
    AND establishment_id = l.establishment_id
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE au.role IN ('sdr', 'closer') AND au.ativo = true
GROUP BY au.id, au.nome
ORDER BY comissao_total DESC, total_conversoes DESC;

-- =====================================================
-- 5. ADICIONAR COLUNA PARA RASTREAR PERFORMANCE
-- =====================================================

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS total_leads_convertidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comissao_total_mes DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultimas_conversoes JSONB DEFAULT '[]';

-- =====================================================
-- 6. INSERIR DADOS DE EXEMPLO (LEADS E REUNIÕES)
-- =====================================================

-- Buscar IDs de Miguel e Murilo (comentado - descomentar depois de confirmar inserção)
/*
DO $$
DECLARE
    v_miguel_id UUID;
    v_murilo_id UUID;
    v_establishment_id UUID;
BEGIN
    SELECT id INTO v_miguel_id FROM admin_users WHERE email = 'miguel@baroncontrol.com';
    SELECT id INTO v_murilo_id FROM admin_users WHERE email = 'murilo@baroncontrol.com';
    SELECT id INTO v_establishment_id FROM establishments LIMIT 1;
    
    IF v_miguel_id IS NOT NULL AND v_murilo_id IS NOT NULL AND v_establishment_id IS NOT NULL THEN
        -- Inserir alguns leads de exemplo
        INSERT INTO leads (
            establishment_id, nome_estabelecimento, tipo, responsavel_nome, 
            responsavel_telefone, responsavel_email, cidade, estado, 
            origem_lead, sdr_responsavel_id, status
        ) VALUES 
            (v_establishment_id, 'Lead Teste 1', 'bar', 'João Silva', '11999999999', 'joao@example.com', 'São Paulo', 'SP', 'prospeccao', v_miguel_id, 'novo'),
            (v_establishment_id, 'Lead Teste 2', 'restaurante', 'Maria Santos', '11988888888', 'maria@example.com', 'São Paulo', 'SP', 'indicacao', v_murilo_id, 'novo')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
*/

-- =====================================================
-- FIM DO SETUP
-- =====================================================
