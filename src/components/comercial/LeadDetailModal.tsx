// src/components/comercial/LeadDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { Lead, LeadContact, Meeting } from '@/types/commercial';
import * as commercialServices from '@/lib/commercialServices';
import LeadTimeline from './LeadTimeline';
import QuickActionsBar from './QuickActionsBar';
import NextActionField from './NextActionField';
import QuickObjectionModal from './QuickObjectionModal';
import { useCommercialActions } from '@/hooks/useCommercialActions';

interface LeadDetailModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdate,
}: LeadDetailModalProps) {
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'reunioes'>('timeline');
  const { updateNextAction } = useCommercialActions();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, lead.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar contatos
      const { data: contactsData } = await commercialServices.getLeadContacts(lead.id);
      setContacts(contactsData || []);

      // Carregar reuniões (passar objeto de filters)
      const { data: meetingsData } = await commercialServices.getMeetings({ limit: 100 });
      const leadMeetings = meetingsData?.filter((m: any) => m.lead_id === lead.id) || [];
      setMeetings(leadMeetings);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextActionUpdate = async (action: string, date: string) => {
    await updateNextAction(lead.id, action, date);
    onUpdate?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{lead.nome}</h2>
            <p className="text-sm text-gray-600">{lead.empresa}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          {/* Ações rápidas */}
          <div className="mb-4">
            <QuickActionsBar
              leadId={lead.id}
              leadName={lead.nome}
              phone={lead.telefone || lead.responsavel_telefone || ''}
              vendedorName={lead.vendedor_nome || 'Vendedor'}
              estabelecimentoType={lead.tipo_estabelecimento || 'Estabelecimento'}
              onActionComplete={() => {
                loadData();
                onUpdate?.();
              }}
            />
          </div>

          {/* Próxima ação */}
          <div className="mb-4">
            <NextActionField
              currentAction={lead.proxima_acao}
              currentDate={lead.data_proxima_acao}
              leadId={lead.id}
              onUpdate={handleNextActionUpdate}
            />
          </div>

          {/* Abas */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            {(['info', 'timeline', 'reunioes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'info' && '📋 Info'}
                {tab === 'timeline' && '📅 Timeline'}
                {tab === 'reunioes' && '📞 Reuniões'}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          {loading ? (
            <div className="text-center py-4">⏳ Carregando...</div>
          ) : (
            <>
              {/* Tab: Info */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email:</label>
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Telefone:</label>
                    <a href={`tel:${lead.telefone}`} className="text-blue-600 hover:underline">
                      {lead.telefone}
                    </a>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Tipo:</label>
                    <p>{lead.tipo_estabelecimento}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Origem:</label>
                    <p>{lead.origem}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Status:</label>
                    <p>{lead.status.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>

                  <button
                    onClick={() => setShowObjectionModal(true)}
                    className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-sm mt-4"
                  >
                    🚫 Registrar Objeção
                  </button>
                </div>
              )}

              {/* Tab: Timeline */}
              {activeTab === 'timeline' && (
                <LeadTimeline
                  events={[
                    ...contacts.map((c) => ({
                      id: c.id,
                      timestamp: c.created_at,
                      type: 'contact' as const,
                      title: c.tipo_contato.toUpperCase(),
                      description: c.observacoes || c.resultado || 'Contato realizado',
                      icon: '📌',
                      color: 'bg-blue-500',
                    })),
                    ...meetings.map((m) => ({
                      id: m.id,
                      timestamp: m.created_at,
                      type: 'meeting' as const,
                      title: `Reunião - ${m.status}`,
                      description: new Date(m.data_reuniao).toLocaleDateString('pt-BR'),
                      icon: '📅',
                      color: 'bg-purple-500',
                    })),
                  ]}
                />
              )}

              {/* Tab: Reuniões */}
              {activeTab === 'reunioes' && (
                <div className="space-y-2">
                  {meetings.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhuma reunião agendada</p>
                  ) : (
                    meetings.map((meeting) => (
                      <div key={meeting.id} className="border border-gray-200 rounded p-3">
                        <div className="font-semibold">{meeting.status}</div>
                        <div className="text-sm text-gray-600">
                          📅 {new Date(meeting.data_reuniao).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-600">
                          📍 {meeting.local || 'Online'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de objeção */}
      <QuickObjectionModal
        isOpen={showObjectionModal}
        leadId={lead.id}
        onClose={() => setShowObjectionModal(false)}
        onSuccess={() => {
          loadData();
          onUpdate?.();
        }}
      />
    </div>
  );
}
