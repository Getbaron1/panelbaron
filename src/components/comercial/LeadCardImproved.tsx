// src/components/comercial/LeadCardImproved.tsx
import React, { useState } from 'react'
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Edit, 
  MapPin, 
  Building, 
  Instagram,
  DollarSign,
  Clock,
  User,
  ChevronDown,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import EditLeadModal from './EditLeadModal'
import WhatsAppModal from './WhatsAppModal'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/commercial'

interface LeadCardImprovedProps {
  lead: Lead
  onUpdate: () => void
  userRole?: string
}

// Status válidos conforme constraint do banco
const STATUS_OPTIONS = [
  { value: 'novo', label: '🆕 Novo', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'contato_realizado', label: '📞 Contato Realizado', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { value: 'interessado', label: '🎯 Interessado', color: 'text-cyan-700', bg: 'bg-cyan-100', border: 'border-cyan-300' },
  { value: 'reuniao_marcada', label: '📅 Reunião Marcada', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
  { value: 'reuniao_realizada', label: '✅ Reunião Realizada', color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  { value: 'convertido', label: '🎉 Convertido', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
  { value: 'perdido', label: '❌ Perdido', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' },
]

export default function LeadCardImproved({ lead, onUpdate, userRole = 'admin' }: LeadCardImprovedProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Encontrar config do status atual
  const currentStatus = STATUS_OPTIONS.find(s => s.value === lead.status) || STATUS_OPTIONS[0]

  // Formatação do WhatsApp
  const whatsappNumber = (lead.responsavel_whatsapp || lead.responsavel_telefone || '')
    .replace(/\D/g, '')
  
  // Verificar se próxima ação está atrasada
  const isOverdue = lead.data_proxima_acao && new Date(lead.data_proxima_acao) < new Date()
  const isToday = lead.data_proxima_acao && new Date(lead.data_proxima_acao).toDateString() === new Date().toDateString()

  // Formatar data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  // Pode editar: super_admin, admin, sdr ou comercial
  const canEdit = userRole === 'super_admin' || userRole === 'admin' || userRole === 'sdr' || userRole === 'comercial'

  // Atualizar status rapidamente
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === lead.status) {
      setShowStatusDropdown(false)
      return
    }

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (error) throw error
      
      onUpdate()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao atualizar status')
    } finally {
      setUpdatingStatus(false)
      setShowStatusDropdown(false)
    }
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden">
        {/* Header com status clicável */}
        <div className={`px-4 py-2 ${currentStatus.bg} ${currentStatus.border} border-b relative`}>
          <div className="flex items-center justify-between">
            {/* Dropdown de status */}
            <div className="relative">
              <button
                onClick={() => canEdit && setShowStatusDropdown(!showStatusDropdown)}
                disabled={updatingStatus || !canEdit}
                className={`flex items-center gap-1 text-sm font-semibold ${currentStatus.color} ${canEdit ? 'hover:opacity-80 cursor-pointer' : ''}`}
              >
                {updatingStatus ? 'Salvando...' : currentStatus.label}
                {canEdit && <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Dropdown menu */}
              {showStatusDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowStatusDropdown(false)} 
                  />
                  <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between ${
                          option.value === lead.status ? 'bg-muted' : ''
                        }`}
                      >
                        <span className={option.color}>{option.label}</span>
                        {option.value === lead.status && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              {formatDate(lead.created_at)}
            </span>
          </div>
        </div>

        {/* Conteúdo principal - Compacto em Mobile */}
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {/* Nome e tipo */}
          <div>
            <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 leading-tight">
              <Building className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
              <span className="line-clamp-1">{lead.nome_estabelecimento}</span>
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground capitalize ml-6 md:ml-7">
              {lead.tipo?.replace(/_/g, ' ') || 'Estabelecimento'}
            </p>
          </div>

          {/* Responsável */}
          {lead.responsavel_nome && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{lead.responsavel_nome}</span>
            </div>
          )}

          {/* Localização */}
          {(lead.cidade || lead.estado) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{lead.cidade}{lead.cidade && lead.estado ? ', ' : ''}{lead.estado}</span>
            </div>
          )}

          {/* Faturamento (apenas super_admin) */}
          {userRole === 'super_admin' && lead.faturamento_estimado && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-600">
                R$ {lead.faturamento_estimado.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Próxima Ação */}
          {lead.proxima_acao && (
            <div className={`p-3 rounded-lg ${
              isOverdue ? 'bg-red-100 border border-red-300' : 
              isToday ? 'bg-orange-100 border border-orange-300' : 
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-blue-600'}`} />
                <span className={isOverdue ? 'text-red-700' : isToday ? 'text-orange-700' : 'text-blue-700'}>
                  {lead.proxima_acao}
                </span>
              </div>
              {lead.data_proxima_acao && (
                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-blue-600'}`}>
                  📅 {isOverdue ? 'ATRASADO - ' : isToday ? 'HOJE - ' : ''}{formatDate(lead.data_proxima_acao)}
                </p>
              )}
            </div>
          )}

          {/* Observações */}
          {lead.observacoes && (
            <p className="text-xs text-muted-foreground italic line-clamp-2">
              "{lead.observacoes}"
            </p>
          )}
        </div>

        {/* Botões de ação - Otimizados para Mobile */}
        <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-2">
          {/* Linha 1: Contato rápido */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-2">
            {/* WhatsApp com modal */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-3 md:py-2.5 bg-green-500 active:bg-green-600 hover:bg-green-600 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            
            {/* Telefone */}
            <a
              href={`tel:${lead.responsavel_telefone}`}
              className="flex items-center justify-center gap-1 px-2 py-3 md:py-2.5 bg-blue-500 active:bg-blue-600 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors touch-manipulation"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Ligar</span>
            </a>

            {/* Email ou Instagram */}
            {lead.responsavel_email ? (
              <a
                href={`mailto:${lead.responsavel_email}`}
                className="flex items-center justify-center gap-1 px-2 py-3 md:py-2.5 bg-gray-500 active:bg-gray-600 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition-colors touch-manipulation"
              >
                <Mail className="w-4 h-4" />
              </a>
            ) : lead.instagram ? (
              <a
                href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-2 py-3 md:py-2.5 bg-pink-500 active:bg-pink-600 hover:bg-pink-600 text-white rounded-lg text-xs font-semibold transition-colors touch-manipulation"
              >
                <Instagram className="w-4 h-4" />
              </a>
            ) : (
              <div className="bg-muted rounded-lg" />
            )}
          </div>

          {/* Linha 2: Editar - Botão maior para toque */}
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 md:py-2 bg-primary active:bg-primary/80 hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors touch-manipulation"
            >
              <Edit className="w-4 h-4" />
              Editar Lead
            </button>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      <EditLeadModal
        lead={lead}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onUpdate}
      />

      {/* Modal de WhatsApp */}
      <WhatsAppModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        leadNome={lead.nome_estabelecimento}
        telefone={lead.responsavel_whatsapp || lead.responsavel_telefone || ''}
      />
    </>
  )
}
