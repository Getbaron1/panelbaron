// src/hooks/useCommercialActions.ts
import { supabase } from '@/lib/supabase';

interface QuickAction {
  type: 'whatsapp' | 'call' | 'meeting' | 'follow_up';
  lead_id: string;
  timestamp: string;
  notes?: string;
  result?: 'attended' | 'not_attended' | 'voicemail' | 'callback_requested';
}

/**
 * Hook para ações comerciais rápidas
 * Reduz cliques e elimina retrabalho
 */
export const useCommercialActions = () => {
  // Registrar ação de WhatsApp
  const logWhatsAppClick = async (leadId: string) => {
    const { error } = await supabase
      .from('lead_contacts')
      .insert([{
        lead_id: leadId,
        tipo_contato: 'whatsapp',
        resultado: 'click_enviado',
        created_at: new Date().toISOString(),
      }]);

    return { error };
  };

  // Enviar mensagem WhatsApp (abre link)
  const sendWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Registrar ligação
  const logCall = async (leadId: string, result: string, notes?: string) => {
    const { error } = await supabase
      .from('lead_contacts')
      .insert([{
        lead_id: leadId,
        tipo_contato: 'telefone',
        resultado: result,
        observacoes: notes,
        created_at: new Date().toISOString(),
      }]);

    return { error };
  };

  // Abrir discador
  const makeCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Registrar reunião
  const scheduleQuickMeeting = async (leadId: string, date: string, time: string, type: 'online' | 'presencial') => {
    const { error } = await supabase
      .from('meetings')
      .insert([{
        lead_id: leadId,
        data_reuniao: `${date}T${time}`,
        status: 'agendada',
        tipo: type,
        created_at: new Date().toISOString(),
      }]);

    return { error };
  };

  // Registrar objeção (1 clique)
  const quickObjection = async (leadId: string, objection: string) => {
    const { error } = await supabase
      .from('lead_objections')
      .insert([{
        lead_id: leadId,
        tipo_objecao: objection,
        fase_objecao: 'comercial',
        resolvida: false,
        created_at: new Date().toISOString(),
      }]);

    return { error };
  };

  // Atualizar próxima ação
  const updateNextAction = async (leadId: string, action: string, actionDate: string) => {
    const { error } = await supabase
      .from('leads')
      .update({
        proxima_acao: action,
        data_proxima_acao: actionDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    return { error };
  };

  return {
    logWhatsAppClick,
    sendWhatsApp,
    logCall,
    makeCall,
    scheduleQuickMeeting,
    quickObjection,
    updateNextAction,
  };
};
