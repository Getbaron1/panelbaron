import React, { useState, useEffect } from 'react';
import { Trophy, Flame, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface RankingData {
  nome: string;
  pontos: number;
  conversoes: number;
  comissao: number;
  emoji: string;
  cor: string;
}

export default function Rankings() {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadRankings();
    const interval = setInterval(loadRankings, 3000); // Atualiza a cada 3s
    return () => clearInterval(interval);
  }, []);

  const loadRankings = async () => {
    try {
      const { data: sdrData } = await supabase
        .from('vw_performance_sdr')
        .select('sdr_nome, leads_convertidos, total_comissao')
        .order('leads_convertidos', { ascending: false });

      if (sdrData) {
        const rankingList: RankingData[] = (sdrData || []).map((item: any, idx: number) => ({
          nome: item.sdr_nome,
          pontos: item.leads_convertidos,
          conversoes: item.leads_convertidos,
          comissao: item.total_comissao,
          emoji: idx === 0 ? '🔥' : idx === 1 ? '⭐' : idx === 2 ? '🎯' : '👤',
          cor: idx === 0 ? 'from-red-500 to-orange-500' : idx === 1 ? 'from-yellow-500 to-orange-500' : idx === 2 ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-pink-500',
        }));

        setRankings(rankingList);
        setAnimatingIndex(0);
        setTimeout(() => setAnimatingIndex(null), 500);
      }
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Carregando ranking em tempo real...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text text-transparent mb-2">
            🏆 RANKING COMERCIAL 🏆
          </h1>
          <p className="text-gray-600">Atualizando em tempo real a cada 3 segundos</p>
        </div>

        {/* Placar Principal */}
        <div className="space-y-4">
          {rankings.map((rank, idx) => {
            const maxPontos = Math.max(...rankings.map((r) => r.pontos), 1);
            const percentual = (rank.pontos / maxPontos) * 100;
            const medalhas = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={rank.nome}
                className={`transform transition-all duration-500 ${
                  animatingIndex === idx ? 'scale-105 animate-pulse' : 'scale-100'
                }`}
              >
                <div className={`bg-gradient-to-r ${rank.cor} p-0.5 rounded-xl shadow-lg hover:shadow-2xl transition`}>
                  <div className="bg-white rounded-lg p-6">
                    {/* Linha Superior: Nome + Emoji + Número */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{medalhas[idx] || rank.emoji}</span>
                        <div>
                          <p className="text-3xl font-black text-gray-900">{rank.nome}</p>
                          <p className="text-sm text-gray-500">Posição {idx + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-transparent bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text">
                          {rank.pontos}
                        </p>
                        <p className="text-xs text-gray-500">conversões</p>
                      </div>
                    </div>

                    {/* Barra de Progresso Animada */}
                    <div className="mb-4">
                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        {/* Barra de fundo com gradiente */}
                        <div
                          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${rank.cor} rounded-full transition-all duration-1000 flex items-center justify-end pr-3`}
                          style={{ width: `${percentual}%` }}
                        >
                          {percentual > 20 && (
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          )}
                        </div>

                        {/* Texto no meio da barra */}
                        <div className="absolute inset-0 flex items-center justify-between px-4">
                          <span className="text-xs font-bold text-gray-700">
                            {Math.round(percentual)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp size={16} className="text-blue-600" />
                          <p className="text-xs text-gray-600">Conversões</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{rank.conversoes}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={16} className="text-green-600" />
                          <p className="text-xs text-gray-600">Comissão</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {rank.comissao.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Motivacional */}
        <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <p className="text-gray-700 text-lg">
            <span className="font-black">Atualização em tempo real</span> - Dados recalculados a cada 3 segundos
          </p>
          <p className="text-sm text-gray-500 mt-2">🚀 Quanto mais leads você converter, mais sobe no ranking!</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
