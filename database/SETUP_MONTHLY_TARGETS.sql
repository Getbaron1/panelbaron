-- =====================================================
-- TABELA: monthly_targets (Metas Mensais)
-- =====================================================

CREATE TABLE IF NOT EXISTS monthly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes_ano DATE NOT NULL UNIQUE, -- Primeiro dia do mês (ex: 2025-02-01)
    meta_clientes INTEGER NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_monthly_targets_mes ON monthly_targets(mes_ano DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_targets_ativo ON monthly_targets(ativo);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_monthly_targets_updated_at ON monthly_targets;
CREATE TRIGGER update_monthly_targets_updated_at BEFORE UPDATE ON monthly_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEW: Progresso da Meta do Mês
-- =====================================================

DROP VIEW IF EXISTS vw_monthly_progress CASCADE;
CREATE VIEW vw_monthly_progress AS
SELECT 
    mt.id,
    mt.mes_ano,
    mt.meta_clientes,
    mt.descricao,
    EXTRACT(YEAR FROM mt.mes_ano) as ano,
    EXTRACT(MONTH FROM mt.mes_ano) as mes,
    COALESCE(
        SUM(c.valor_comissao),
        0
    ) as valor_realizado,
    mt.meta_clientes as meta_target,
    CASE 
        WHEN mt.meta_clientes > 0 THEN ROUND((COALESCE(SUM(c.valor_comissao), 0) / mt.meta_clientes * 100)::numeric, 2)
        ELSE 0
    END as percentual_atingido,
    CASE 
        WHEN mt.meta_clientes > 0 THEN mt.meta_clientes - COALESCE(SUM(c.valor_comissao), 0)
        ELSE mt.meta_clientes
    END as valor_faltante,
    COUNT(DISTINCT c.id) as total_comissoes,
    mt.ativo,
    mt.created_at,
    mt.updated_at
FROM monthly_targets mt
LEFT JOIN commissions c ON 
    DATE_TRUNC('month', c.created_at)::date = DATE_TRUNC('month', mt.mes_ano)::date
    AND c.status = 'paga'
GROUP BY mt.id, mt.mes_ano, mt.meta_clientes, mt.descricao, mt.ativo, mt.created_at, mt.updated_at;

-- =====================================================
-- INSERIR META DE EXEMPLO (Fevereiro 2025)
-- =====================================================

INSERT INTO monthly_targets (mes_ano, meta_clientes, descricao, ativo)
VALUES 
    (DATE_TRUNC('month', NOW())::date, 50, 'Meta de fevereiro de 2025', true)
ON CONFLICT (mes_ano) DO NOTHING;
