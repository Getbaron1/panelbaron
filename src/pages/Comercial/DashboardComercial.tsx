// src/pages/Comercial/DashboardComercial.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

// Função para obter usuário do localStorage
function getLoggedUser() {
  try {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (e) {
    console.error('Erro ao ler dados do usuário');
  }
  return null;
}

interface KPIData {
  total_leads: number;
  leads_convertidos: number;
  taxa_conversao: number;
  total_comissao: number;
  comissao_paga: number;
  comissao_pendente: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
}

export default function DashboardComercial() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    getCurrentUserRole();
  }, []);

  const getCurrentUserRole = async () => {
    const user = getLoggedUser();
    if (user) {
      setUserRole(user.role);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Para Admin - dados totais
      if (userRole === 'admin' || userRole === 'super_admin') {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, status');

        const { data: commissions } = await supabase
          .from('commissions')
          .select('valor_comissao, status');

        const { data: meetings } = await supabase
          .from('meetings')
          .select('id, status');

        const totalLeads = leads?.length || 0;
        const leadsConvertidos = leads?.filter(l => l.status === 'convertido').length || 0;
        const totalComissao = commissions?.reduce((sum, c) => sum + (c.valor_comissao || 0), 0) || 0;
        const comissaoPaga = commissions
          ?.filter(c => c.status === 'paga')
          .reduce((sum, c) => sum + (c.valor_comissao || 0), 0) || 0;
        const reunioesMarcadas = meetings?.filter(m => m.status === 'agendada').length || 0;
        const reunioesRealizadas = meetings?.filter(m => m.status === 'realizada').length || 0;

        setKpis({
          total_leads: totalLeads,
          leads_convertidos: leadsConvertidos,
          taxa_conversao: totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0,
          total_comissao: totalComissao,
          comissao_paga: comissaoPaga,
          comissao_pendente: totalComissao - comissaoPaga,
          reunioes_marcadas: reunioesMarcadas,
          reunioes_realizadas: reunioesRealizadas,
        });
      }

      // Para SDR - seus dados
      if (userRole === 'sdr') {
        const user = getLoggedUser();
        
        const { data: leads } = await supabase
          .from('leads')
          .select('id, status')
          .eq('sdr_responsavel_id', user?.id);

        const { data: meetings } = await supabase
          .from('meetings')
          .select('id, status')
          .eq('sdr_id', user?.id);

        const totalLeads = leads?.length || 0;
        const leadsConvertidos = leads?.filter(l => l.status === 'convertido').length || 0;
        const reunioesMarcadas = meetings?.filter(m => m.status === 'agendada').length || 0;
        const reunioesRealizadas = meetings?.filter(m => m.status === 'realizada').length || 0;

        setKpis({
          total_leads: totalLeads,
          leads_convertidos: leadsConvertidos,
          taxa_conversao: totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0,
          total_comissao: 0,
          comissao_paga: 0,
          comissao_pendente: 0,
          reunioes_marcadas: reunioesMarcadas,
          reunioes_realizadas: reunioesRealizadas,
        });
      }

      // Para Closer - dados de reuniões e comissões
      if (userRole === 'closer') {
        const user = getLoggedUser();
        
        const { data: meetings } = await supabase
          .from('meetings')
          .select('id, status')
          .eq('closer_id', user?.id);

        const { data: commissions } = await supabase
          .from('commissions')
          .select('valor_comissao, status')
          .eq('closer_id', user?.id);

        const reunioesMarcadas = meetings?.filter(m => m.status === 'agendada').length || 0;
        const reunioesRealizadas = meetings?.filter(m => m.status === 'realizada').length || 0;
        const totalComissao = commissions?.reduce((sum, c) => sum + (c.valor_comissao || 0), 0) || 0;
        const comissaoPaga = commissions
          ?.filter(c => c.status === 'paga')
          .reduce((sum, c) => sum + (c.valor_comissao || 0), 0) || 0;

        setKpis({
          total_leads: 0,
          leads_convertidos: 0,
          taxa_conversao: 0,
          total_comissao: totalComissao,
          comissao_paga: comissaoPaga,
          comissao_pendente: totalComissao - comissaoPaga,
          reunioes_marcadas: reunioesMarcadas,
          reunioes_realizadas: reunioesRealizadas,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="p-4">Carregando...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard Comercial</h1>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Leads */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-2">Total de Leads</p>
                <h3 className="text-3xl font-bold">{kpis?.total_leads || 0}</h3>
              </div>
              <Badge variant="primary">📊</Badge>
            </div>
          </Card>

          {/* Taxa de Conversão */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-2">Taxa Conversão</p>
                <h3 className="text-3xl font-bold">{kpis?.taxa_conversao.toFixed(1)}%</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {kpis?.leads_convertidos}/{kpis?.total_leads}
                </p>
              </div>
              <Badge variant="success">✓</Badge>
            </div>
          </Card>

          {/* Reuniões */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-2">Reuniões</p>
                <h3 className="text-3xl font-bold">{kpis?.reunioes_marcadas || 0}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {kpis?.reunioes_realizadas} realizadas
                </p>
              </div>
              <Badge variant="purple">📅</Badge>
            </div>
          </Card>

          {/* Comissão */}
          <Card className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-2">Comissão</p>
                <h3 className="text-3xl font-bold">
                  R$ {(kpis?.total_comissao || 0).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2 
                  })}
                </h3>
                <p className="text-xs text-green-600 mt-1">
                  Paga: R$ {(kpis?.comissao_paga || 0).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2 
                  })}
                </p>
              </div>
              <Badge variant="warning">💰</Badge>
            </div>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="flex gap-4 flex-wrap">
            {(userRole === 'sdr' || userRole === 'admin') && (
              <a 
                href="/comercial/leads?new=true" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Novo Lead
              </a>
            )}
            {(userRole === 'sdr' || userRole === 'admin') && (
              <a 
                href="/comercial/reunioes?new=true" 
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                + Agendar Reunião
              </a>
            )}
            {(userRole === 'admin' || userRole === 'closer') && (
              <a 
                href="/comercial/comissoes" 
                className="px-4 py-2 bg-gold-600 text-white rounded hover:bg-gold-700"
              >
                Ver Comissões
              </a>
            )}
            {userRole === 'admin' && (
              <a 
                href="/performance/sdrs" 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Performance SDRs
              </a>
            )}
          </div>
        </Card>

        {/* Próximos Passos */}
        <Card className="p-6 bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Próximos Passos</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Implementar gráficos de pipeline e conversão</li>
            <li>• Adicionar tabela de leads/reuniões recentes</li>
            <li>• Implementar filtros por período e usuário</li>
            <li>• Integrar notificações de reuniões próximas</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
