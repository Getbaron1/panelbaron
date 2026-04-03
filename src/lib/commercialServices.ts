// src/lib/commercialServices.ts

import { supabase } from './supabase';
import {
  Lead,
  LeadContact,
  LeadObjection,
  Meeting,
  Commission,
  SDRPerformance,
  CloserPerformance,
  LeadFilters,
  CommissionFilters,
  MeetingFilters,
  CreateLeadInput,
  CreateLeadContactInput,
  CreateLeadObjectionInput,
  CreateMeetingInput,
  UpdateMeetingInput,
  PipelineComercial,
} from '../types/commercial';

/**
 * Serviços para o módulo comercial
 */

// =====================================================
// LEADS
// =====================================================

/**
 * Criar novo lead
 */
export const createLead = async (
  leadData: CreateLeadInput,
  sdrUserId: string
): Promise<{ data: Lead | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...leadData,
          sdr_responsavel_id: sdrUserId,
          status: 'novo',
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar leads com filtros
 */
export const getLeads = async (filters?: LeadFilters): Promise<{ data: Lead[] | null; error: any }> => {
  try {
    let query = supabase.from('leads').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sdr_id) {
      query = query.eq('sdr_responsavel_id', filters.sdr_id);
    }
    if (filters?.city) {
      query = query.eq('cidade', filters.city);
    }
    if (filters?.state) {
      query = query.eq('estado', filters.state);
    }
    if (filters?.origem) {
      query = query.eq('origem_lead', filters.origem);
    }
    if (filters?.searchText) {
      query = query.or(
        `nome_estabelecimento.ilike.%${filters.searchText}%,responsavel_nome.ilike.%${filters.searchText}%`
      );
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar lead por ID
 */
export const getLeadById = async (leadId: string): Promise<{ data: Lead | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Atualizar status do lead
 */
export const updateLeadStatus = async (
  leadId: string,
  status: string,
  motivo_perda?: string
): Promise<{ data: Lead | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        status,
        motivo_perda,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Converter lead para estabelecimento
 */
export const convertLeadToEstablishment = async (
  leadId: string,
  establishmentId?: string
): Promise<{ data: string | null; error: any }> => {
  try {
    const { data, error } = await supabase.rpc('converter_lead_para_estabelecimento', {
      p_lead_id: leadId,
      p_establishment_id: establishmentId || null,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// CONTATOS / INTERAÇÕES
// =====================================================

/**
 * Registrar novo contato com lead
 */
export const createLeadContact = async (
  contactData: CreateLeadContactInput,
  userId: string
): Promise<{ data: LeadContact | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('lead_contacts')
      .insert([
        {
          ...contactData,
          user_id: userId,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar contatos de um lead
 */
export const getLeadContacts = async (leadId: string): Promise<{ data: LeadContact[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('lead_contacts')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// OBJEÇÕES
// =====================================================

/**
 * Registrar objeção
 */
export const createLeadObjection = async (
  objectionData: CreateLeadObjectionInput,
  userId: string
): Promise<{ data: LeadObjection | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('lead_objections')
      .insert([
        {
          ...objectionData,
          registrado_por: userId,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar objeções de um lead
 */
export const getLeadObjections = async (leadId: string): Promise<{ data: LeadObjection[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('lead_objections')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Resolver objeção
 */
export const resolveObjection = async (
  objectionId: string,
  solucao: string
): Promise<{ data: LeadObjection | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('lead_objections')
      .update({
        resolvida: true,
        solucao,
      })
      .eq('id', objectionId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// REUNIÕES
// =====================================================

/**
 * Agendar reunião
 */
export const scheduleMeeting = async (
  meetingData: CreateMeetingInput,
  sdrUserId: string
): Promise<{ data: Meeting | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .insert([
        {
          ...meetingData,
          sdr_id: sdrUserId,
          status: 'agendada',
          criada_por: sdrUserId,
        },
      ])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar reuniões com filtros
 */
export const getMeetings = async (filters?: MeetingFilters): Promise<{ data: Meeting[] | null; error: any }> => {
  try {
    let query = supabase.from('meetings').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sdr_id) {
      query = query.eq('sdr_id', filters.sdr_id);
    }
    if (filters?.closer_id) {
      query = query.eq('closer_id', filters.closer_id);
    }
    if (filters?.dateFrom) {
      query = query.gte('data_reuniao', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('data_reuniao', filters.dateTo);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('data_reuniao', { ascending: true });

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Atualizar reunião
 */
export const updateMeeting = async (
  meetingId: string,
  updates: UpdateMeetingInput
): Promise<{ data: Meeting | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// COMISSÕES
// =====================================================

/**
 * Buscar comissões com filtros
 */
export const getCommissions = async (
  filters?: CommissionFilters
): Promise<{ data: Commission[] | null; error: any }> => {
  try {
    let query = supabase.from('commissions').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.sdr_id) {
      query = query.eq('sdr_id', filters.sdr_id);
    }
    if (filters?.closer_id) {
      query = query.eq('closer_id', filters.closer_id);
    }
    if (filters?.mes_referencia) {
      query = query.eq('mes_referencia', filters.mes_referencia);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }


    query = query.order('mes_referencia', { ascending: false });

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Marcar comissão como paga
 */
export const payCommission = async (commissionId: string): Promise<{ data: Commission | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .update({
        status: 'paga',
        data_pagamento: new Date().toISOString(),
      })
      .eq('id', commissionId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// =====================================================
// PERFORMANCE E DASHBOARDS
// =====================================================

/**
 * Buscar performance de SDR
 */
export const getSDRPerformance = async (): Promise<{ data: SDRPerformance[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.from('vw_performance_sdr').select('*');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar performance de Closer
 */
export const getCloserPerformance = async (): Promise<{ data: CloserPerformance[] | null; error: any }> => {
  try {
    const { data, error } = await supabase.from('vw_performance_closer').select('*');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar pipeline comercial completo
 */
export const getPipelineComercial = async (): Promise<{ data: PipelineComercial[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('vw_pipeline_comercial')
      .select('*')
      .order('lead_id', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Obter estatísticas rápidas
 */
export const getCommercialStats = async () => {
  try {
    const [leads, meetings, commissions] = await Promise.all([
      supabase.from('leads').select('id, status'),
      supabase.from('meetings').select('id, status'),
      supabase.from('commissions').select('valor_comissao, status'),
    ]);

    const leadsList = leads.data || [];
    const meetingsList = meetings.data || [];
    const commissionsList = commissions.data || [];

    return {
      total_leads: leadsList.length,
      leads_convertidos: leadsList.filter((l: any) => l.status === 'convertido').length,
      taxa_conversao: leadsList.length > 0 
        ? (leadsList.filter((l: any) => l.status === 'convertido').length / leadsList.length) * 100 
        : 0,
      reunioes_agendadas: meetingsList.filter((m: any) => m.status === 'agendada').length,
      reunioes_realizadas: meetingsList.filter((m: any) => m.status === 'realizada').length,
      total_comissao: commissionsList.reduce((sum: number, c: any) => sum + (c.valor_comissao || 0), 0),
      comissao_paga: commissionsList
        .filter((c: any) => c.status === 'paga')
        .reduce((sum: number, c: any) => sum + (c.valor_comissao || 0), 0),
    };
  } catch (error) {
    return null;
  }
};
