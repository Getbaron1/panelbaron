// src/components/comercial/LeadTimeline.tsx
import React from 'react';
import { LeadContact, Meeting } from '@/types/commercial';

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'contact' | 'meeting' | 'status_change' | 'objection' | 'conversion';
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface LeadTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

export default function LeadTimeline({ events, loading }: LeadTimelineProps) {
  if (loading) {
    return <div className="p-4 text-center text-gray-500">Carregando histórico...</div>;
  }

  if (!events.length) {
    return <div className="p-4 text-center text-gray-500">Nenhuma ação registrada</div>;
  }

  // Ordenar por data descrescente
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">📅 Histórico de Ações</h3>

      {/* Timeline */}
      <div className="border-l-2 border-gray-300 pl-4 space-y-4">
        {sortedEvents.map((event) => (
          <div key={event.id} className="relative">
            {/* Timeline dot */}
            <div
              className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white ${event.color}`}
            />

            {/* Event card */}
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{event.icon}</span>
                  <div>
                    <div className="font-semibold text-sm">{event.title}</div>
                    <div className="text-xs text-gray-600">{event.description}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Converter ações em eventos para timeline
 */
export const buildTimelineEvents = (
  contacts: LeadContact[],
  meetings: Meeting[],
  statusChanges: any[]
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Contatos
  contacts.forEach((contact) => {
    const iconMap: Record<string, string> = {
      whatsapp: '💬',
      telefone: '📞',
      email: '📧',
      pessoalmente: '👤',
      mensagem: '📨',
    };

    events.push({
      id: `contact-${contact.id}`,
      timestamp: contact.created_at,
      type: 'contact',
      title: `${iconMap[contact.tipo_contato] || '📌'} ${contact.tipo_contato.toUpperCase()}`,
      description: contact.observacoes || contact.resultado || 'Contato realizado',
      icon: iconMap[contact.tipo_contato] || '📌',
      color: 'bg-blue-500',
    });
  });

  // Reuniões
  meetings.forEach((meeting) => {
    events.push({
      id: `meeting-${meeting.id}`,
      timestamp: meeting.created_at,
      type: 'meeting',
      title: `📅 Reunião ${meeting.status}`,
      description: `${new Date(meeting.data_reuniao).toLocaleDateString('pt-BR')} - ${meeting.local || 'Online'}`,
      icon: '📅',
      color: 'bg-purple-500',
    });
  });

  // Mudanças de status
  statusChanges.forEach((change) => {
    events.push({
      id: `status-${change.id}`,
      timestamp: change.timestamp,
      type: 'status_change',
      title: `🔄 Status alterado`,
      description: `→ ${change.novo_status}`,
      icon: '🔄',
      color: 'bg-yellow-500',
    });
  });

  return events;
};
