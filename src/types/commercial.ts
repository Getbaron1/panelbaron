// src/types/commercial.ts

/**
 * Tipos para o modulo comercial do Baron Control
 */

export type LeadStatus =
  | 'novo'
  | 'contato_realizado'
  | 'interessado'
  | 'reuniao_marcada'
  | 'reuniao_realizada'
  | 'em_teste'
  | 'perdido'
  | 'convertido';

export type EstablishmentType = string;

export type LeadOrigin =
  | 'indicacao'
  | 'prospeccao'
  | 'evento'
  | 'rede-social'
  | 'referencia'
  | 'outro';

export interface Lead {
  id: string;
  establishment_id: string | null;
  nome: string;
  nome_estabelecimento: string;
  empresa: string;
  tipo: EstablishmentType;
  tipo_estabelecimento: EstablishmentType;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_whatsapp?: string;
  responsavel_email?: string;
  vendedor_nome?: string;
  email?: string;
  telefone?: string;
  instagram?: string;
  cidade: string;
  estado: string;
  faturamento_estimado: number;
  origem_lead: LeadOrigin;
  origem?: LeadOrigin;
  sdr_responsavel_id: string;
  status: LeadStatus;
  motivo_perda?: string;
  data_conversao?: string;
  proxima_acao?: string;
  data_proxima_acao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  nome_estabelecimento: string;
  tipo: EstablishmentType;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_whatsapp?: string;
  responsavel_email?: string;
  instagram?: string;
  cidade: string;
  estado: string;
  faturamento_estimado?: number;
  origem_lead: LeadOrigin;
}

export type ContactType = 'whatsapp' | 'telefone' | 'email' | 'pessoalmente' | 'mensagem';

export interface LeadContact {
  id: string;
  lead_id: string;
  user_id: string;
  tipo_contato: ContactType;
  resultado?: string;
  observacoes?: string;
  created_at: string;
}

export interface CreateLeadContactInput {
  lead_id: string;
  tipo_contato: ContactType;
  resultado?: string;
  observacoes?: string;
}

export type ObjectionType = 'preco' | 'concorrencia' | 'timing' | 'necessidade' | 'confianca' | 'tecnica' | 'outro';
export type ObjectionPhase = 'sdr' | 'closer';

export interface LeadObjection {
  id: string;
  lead_id: string;
  tipo_objecao: ObjectionType;
  descricao?: string;
  fase_objecao: ObjectionPhase;
  resolvida: boolean;
  solucao?: string;
  registrado_por: string;
  created_at: string;
}

export interface CreateLeadObjectionInput {
  lead_id: string;
  tipo_objecao: ObjectionType;
  descricao?: string;
  fase_objecao: ObjectionPhase;
}

export type MeetingStatus = 'agendada' | 'realizada' | 'cancelada' | 'nao_compareceu';

export interface Meeting {
  id: string;
  lead_id: string;
  sdr_id?: string;
  closer_id?: string;
  data_reuniao: string;
  local?: string;
  status: MeetingStatus;
  resultado?: string;
  observacoes?: string;
  criada_por?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingInput {
  lead_id: string;
  closer_id?: string;
  data_reuniao: string;
  local?: string;
}

export interface UpdateMeetingInput {
  status?: MeetingStatus;
  resultado?: string;
  observacoes?: string;
  local?: string;
}

export type CommissionType = 'primeira_venda' | 'renovacao' | 'upsell';
export type CommissionStatus = 'pendente' | 'paga' | 'cancelada';

export interface Commission {
  id: string;
  establishment_id: string;
  sdr_id?: string;
  closer_id?: string;
  plano_valor: number;
  percentual_comissao: number;
  valor_comissao: number;
  tipo_comissao: CommissionType;
  mes_referencia: string;
  status: CommissionStatus;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface SDRPerformance {
  user_id: string;
  sdr_nome: string;
  total_leads: number;
  leads_convertidos: number;
  contatos_realizados: number;
  reunioes_marcadas: number;
  taxa_conversao: number;
  total_comissao: number;
  comissao_paga: number;
}

export interface CloserPerformance {
  user_id: string;
  closer_nome: string;
  reunioes_realizadas: number;
  reunioes_concluidas: number;
  vendas_fechadas: number;
  total_comissao: number;
  comissao_paga: number;
  comissao_pendente: number;
}

export interface LeadStatusStats {
  status: LeadStatus;
  total_leads: number;
  sdrs_envolvidos: number;
  estabelecimentos_vinculados: number;
  faturamento_medio_estimado: number;
  ultima_atualizacao: string;
}

export interface PipelineComercial {
  lead_id: string;
  nome_estabelecimento: string;
  tipo: EstablishmentType;
  status: LeadStatus;
  sdr_nome: string;
  total_contatos: number;
  total_objecoes: number;
  total_reunioes: number;
  ultimo_contato?: string;
  faturamento_estimado: number;
  comissao_esperada: number;
  created_at: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  sdr_id?: string;
  city?: string;
  state?: string;
  origem?: LeadOrigin;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface CommissionFilters {
  status?: CommissionStatus;
  mes_referencia?: string;
  sdr_id?: string;
  closer_id?: string;
  limit?: number;
  offset?: number;
}

export interface MeetingFilters {
  status?: MeetingStatus;
  sdr_id?: string;
  closer_id?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  contato_realizado: 'Contato Realizado',
  interessado: 'Interessado',
  reuniao_marcada: 'Reuniao Marcada',
  reuniao_realizada: 'Reuniao Realizada',
  em_teste: 'Em Teste',
  perdido: 'Perdido',
  convertido: 'Convertido',
};

export const ESTABLISHMENT_TYPE_LABELS: Record<string, string> = {
  bar: 'Bar',
  balada: 'Balada',
  restaurante: 'Restaurante',
  cafe: 'Cafe',
  pizzaria: 'Pizzaria',
  hamburgueria: 'Hamburgueria',
  outro: 'Outro',
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  email: 'Email',
  pessoalmente: 'Pessoalmente',
  mensagem: 'Mensagem',
};

export const OBJECTION_TYPE_LABELS: Record<ObjectionType, string> = {
  preco: 'Preco',
  concorrencia: 'Concorrencia',
  timing: 'Timing',
  necessidade: 'Necessidade',
  confianca: 'Confianca',
  tecnica: 'Tecnica',
  outro: 'Outro',
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  nao_compareceu: 'Nao Compareceu',
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  primeira_venda: 'Primeira Venda',
  renovacao: 'Renovacao',
  upsell: 'Upsell',
};

export const DEFAULT_COMMISSION_PERCENTAGE = 65.0;
export const DEFAULT_PLAN_VALUE = 160.0;
export const DEFAULT_PLAN_TYPES = {
  basico: 160.0,
  profissional: 400.0,
  enterprise: 800.0,
} as const;
