// src/components/comercial/LeadCard.tsx
import React, { useState } from 'react';
import { Lead } from '@/types/commercial';
import QuickActionsBar from './QuickActionsBar';
import NextActionField from './NextActionField';
import QuickObjectionModal from './QuickObjectionModal';
import { useCommercialActions } from '@/hooks/useCommercialActions';

interface LeadCardProps {
  lead: Lead;
  onLeadUpdate?: () => void;
  onClick?: () => void;
  showDetails?: boolean;
}

export default function LeadCard({
  lead,
  onLeadUpdate,
  onClick,
  showDetails = false,
}: LeadCardProps) {
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const { updateNextAction } = useCommercialActions();

  const handleNextActionUpdate = async (action: string, date: string) => {
    try {
      await updateNextAction(lead.id, action, date);
      onLeadUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar próxima ação:', error);
      throw error;
    }
  };

  // Determinar cor do badge de status
  const statusColors: Record<string, string> = {
    novo: 'bg-blue-100 text-blue-700',
    contato_realizado: 'bg-yellow-100 text-yellow-700',
    reuniao_agendada: 'bg-purple-100 text-purple-700',
    proposta_enviada: 'bg-indigo-100 text-indigo-700',
    conversao: 'bg-green-100 text-green-700',
    perdido: 'bg-red-100 text-red-700',
  };

  // Cores de prioridade da próxima ação
  const nextActionDueDate = lead.data_proxima_acao ? new Date(lead.data_proxima_acao) : null;
  const today = new Date();
  const isOverdue = nextActionDueDate && nextActionDueDate < today;
  const isToday = nextActionDueDate && nextActionDueDate.toDateString() === today.toDateString();

  return (
    <>
      <div
        className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
          isOverdue ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-blue-400'
        }`}
        onClick={onClick}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{lead.nome}</h3>
            <p className="text-sm text-gray-600">{lead.empresa}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusColors[lead.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {lead.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Informações de contato */}
        <div className="space-y-1 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span>📧</span>
            <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
              {lead.email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span>📱</span>
            <a href={`tel:${lead.telefone}`} className="text-blue-600 hover:underline">
              {lead.telefone}
            </a>
          </div>
        </div>

        {/* Próxima ação (resumida no card) */}
        {lead.proxima_acao && (
          <div
            className={`p-2 rounded text-sm font-medium mb-3 ${
              isOverdue
                ? 'bg-red-200 text-red-700'
                : isToday
                  ? 'bg-orange-200 text-orange-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            🎯 {lead.proxima_acao.toUpperCase()}
            {nextActionDueDate && (
              <>
                <br />
                📅{' '}
                {isOverdue
                  ? 'Atrasado!'
                  : isToday
                    ? 'Hoje'
                    : nextActionDueDate.toLocaleDateString('pt-BR')}
              </>
            )}
          </div>
        )}

        {/* Ações rápidas */}
        {!showDetails && (
          <QuickActionsBar
            leadId={lead.id}
            leadName={lead.nome}
            phone={lead.telefone || lead.responsavel_telefone || ''}
            vendedorName={lead.vendedor_nome || 'Vendedor'}
            estabelecimentoType={lead.tipo_estabelecimento || 'Estabelecimento'}
            onActionComplete={onLeadUpdate}
          />
        )}

        {/* Botão de objeção */}
        {!showDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowObjectionModal(true);
            }}
            className="w-full mt-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-sm"
          >
            🚫 Registrar Objeção
          </button>
        )}

        {/* Detalhes expandidos */}
        {showDetails && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
            <div>
              <label className="text-xs font-semibold text-gray-600">Tipo de Estabelecimento:</label>
              <p className="text-sm">{lead.tipo_estabelecimento}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Vendedor:</label>
              <p className="text-sm">{lead.vendedor_nome}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Origem:</label>
              <p className="text-sm">{lead.origem}</p>
            </div>

            <NextActionField
              currentAction={lead.proxima_acao}
              currentDate={lead.data_proxima_acao}
              leadId={lead.id}
              onUpdate={handleNextActionUpdate}
            />

            <QuickActionsBar
              leadId={lead.id}
              leadName={lead.nome}
                phone={lead.telefone || lead.responsavel_telefone || ''}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowObjectionModal(true);
              }}
              className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-sm"
            >
              🚫 Registrar Objeção
            </button>
          </div>
        )}
      </div>

      {/* Modal de objeção */}
      <QuickObjectionModal
        isOpen={showObjectionModal}
        leadId={lead.id}
        onClose={() => setShowObjectionModal(false)}
        onSuccess={onLeadUpdate}
      />
    </>
  );
}
