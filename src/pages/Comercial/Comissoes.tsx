import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Filter, Download, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface CommissionData {
  comissao_id: string;
  sdr_nome: string;
  closer_nome: string;
  estabelecimento_nome: string;
  plano_valor: number;
  percentual_comissao: number;
  valor_comissao: number;
  tipo_comissao: string;
  status: 'pendente' | 'paga' | 'cancelada';
  mes_referencia: string;
  ranking_por_status: number;
  ranking_geral: number;
}

export default function Comissoes() {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [sortBy, setSortBy] = useState('valor');

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_ranking_comissoes')
        .select('*')
        .order('valor_comissao', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      paga: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredCommissions =
    filterStatus === 'todos'
      ? commissions
      : commissions.filter((c) => c.status === filterStatus);

  const sortedCommissions = [...filteredCommissions].sort((a, b) => {
    if (sortBy === 'valor') return b.valor_comissao - a.valor_comissao;
    if (sortBy === 'sdr') return a.sdr_nome.localeCompare(b.sdr_nome);
    return 0;
  });

  const stats = {
    total: sortedCommissions.reduce((sum, c) => sum + c.valor_comissao, 0),
    paga: sortedCommissions
      .filter((c) => c.status === 'paga')
      .reduce((sum, c) => sum + c.valor_comissao, 0),
    pendente: sortedCommissions
      .filter((c) => c.status === 'pendente')
      .reduce((sum, c) => sum + c.valor_comissao, 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/comercial')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comissões de Vendas</h1>
            <p className="text-gray-600 mt-1">Acompanhe e gerencie todas as comissões do módulo comercial</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total em Comissões</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {stats.total.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comissões Pagas</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  R$ {stats.paga.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Award className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Comissões Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  R$ {stats.pendente.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <TrendingUp className="text-yellow-600" size={40} />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4 items-center flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:border-gray-300"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer hover:border-gray-300"
          >
            <option value="valor">Ordenar por Valor</option>
            <option value="sdr">Ordenar por SDR</option>
          </select>

          <button className="flex items-center gap-2 ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} /> Exportar
          </button>
        </div>

        {/* Tabela de Comissões */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Carregando comissões...</p>
          </div>
        ) : sortedCommissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <DollarSign size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-600">Nenhuma comissão encontrada</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estabelecimento</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SDR</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Closer</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Valor Plano</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Comissão</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCommissions.map((commission, idx) => (
                  <tr key={commission.comissao_id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-medium">{commission.estabelecimento_nome}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{commission.sdr_nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{commission.closer_nome}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                      R$ {commission.plano_valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold text-green-600">
                      R$ {commission.valor_comissao.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
