// src/components/comercial/WhatsAppModal.tsx
import React, { useState, useEffect } from 'react'
import { X, MessageCircle, Plus, Edit2, Trash2, Send, ExternalLink, Save, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

interface MessageTemplate {
  id: string
  titulo: string
  mensagem: string
  ordem: number
  ativo: boolean
  created_by: string | null
}

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  leadNome: string
  telefone: string
  showTemplateManager?: boolean
}

// Função para pegar o ID do usuário logado
const getCurrentUserId = (): string | null => {
  try {
    const userData = localStorage.getItem('baron_admin_user')
    if (userData) {
      const user = JSON.parse(userData)
      return user.id || null
    }
  } catch {
    return null
  }
  return null
}

// Função para pegar o nome do usuário logado
const getCurrentUserName = (): string => {
  try {
    const userData = localStorage.getItem('baron_admin_user')
    if (userData) {
      const user = JSON.parse(userData)
      return user.nome || 'Equipe Baron'
    }
  } catch {
    return 'Equipe Baron'
  }
  return 'Equipe Baron'
}

export default function WhatsAppModal({ 
  isOpen, 
  onClose, 
  leadNome, 
  telefone,
  showTemplateManager = false
}: WhatsAppModalProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showManager, setShowManager] = useState(showTemplateManager)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({ titulo: '', mensagem: '' })
  const [saving, setSaving] = useState(false)
  const [currentUserId] = useState(getCurrentUserId())
  const [currentUserName] = useState(getCurrentUserName())

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const userId = getCurrentUserId()
      
      // Buscar mensagens do usuário atual
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      
      // Filtrar apenas mensagens do usuário logado
      if (userId) {
        query = query.eq('created_by', userId)
      }

      const { data, error } = await query

      if (error) {
        // Se tabela não existe ou está vazia, mostrar mensagem para criar
        console.warn('Erro ao carregar templates:', error.message)
        setTemplates([])
      } else if (data && data.length > 0) {
        setTemplates(data)
      } else {
        // Usuário não tem mensagens ainda, mostrar vazio
        setTemplates([])
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const formatMessage = (mensagem: string) => {
    return mensagem
      .replace(/{estabelecimento}/g, leadNome)
      .replace(/{vendedor}/g, currentUserName)
  }

  const openWhatsApp = (mensagem: string) => {
    const formattedMessage = formatMessage(mensagem)
    const phoneNumber = telefone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(formattedMessage)}`
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  const openDirectWhatsApp = () => {
    const phoneNumber = telefone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phoneNumber}`
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  const saveTemplate = async () => {
    if (!newTemplate.titulo || !newTemplate.mensagem) return
    
    setSaving(true)
    try {
      const userId = getCurrentUserId()
      
      const { error } = await supabase
        .from('message_templates')
        .insert({
          titulo: newTemplate.titulo,
          mensagem: newTemplate.mensagem,
          ordem: templates.length + 1,
          ativo: true,
          created_by: userId // Salvar ID do usuário que criou
        })

      if (error) throw error
      
      setNewTemplate({ titulo: '', mensagem: '' })
      loadTemplates()
    } catch (err) {
      console.error('Erro ao salvar template:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = async (template: MessageTemplate) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('message_templates')
        .update({
          titulo: template.titulo,
          mensagem: template.mensagem
        })
        .eq('id', template.id)

      if (error) throw error
      
      setEditingTemplate(null)
      loadTemplates()
    } catch (err) {
      console.error('Erro ao atualizar template:', err)
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Deseja excluir esta mensagem?')) return
    
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadTemplates()
    } catch (err) {
      console.error('Erro ao excluir template:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-green-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h2 className="font-bold text-lg">WhatsApp</h2>
              <p className="text-sm text-green-100">{leadNome}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-green-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Botão direto */}
          <button
            onClick={openDirectWhatsApp}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Abrir WhatsApp Direto
          </button>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                <User className="w-3 h-3" />
                Minhas Mensagens
              </h3>
              <button
                onClick={() => setShowManager(!showManager)}
                className="text-xs text-primary hover:underline"
              >
                {showManager ? 'Fechar Editor' : 'Gerenciar'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Carregando...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Você ainda não tem mensagens.</p>
                <button
                  onClick={() => setShowManager(true)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Clique em "Gerenciar" para criar suas mensagens
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="group relative">
                    {editingTemplate?.id === template.id ? (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <input
                          type="text"
                          value={editingTemplate.titulo}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, titulo: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                          placeholder="Título"
                        />
                        <textarea
                          value={editingTemplate.mensagem}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, mensagem: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Mensagem"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateTemplate(editingTemplate)} disabled={saving}>
                            <Save className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openWhatsApp(template.mensagem)}
                        className="w-full text-left p-3 bg-muted/50 hover:bg-green-50 border border-border hover:border-green-300 rounded-lg transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{template.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {formatMessage(template.mensagem)}
                            </p>
                          </div>
                          <Send className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                        </div>
                        
                        {/* Botões de edição (visíveis no hover) */}
                        {showManager && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-border">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingTemplate(template) }}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id) }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar nova mensagem */}
            {showManager && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-dashed border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Mensagem
                </h4>
                <input
                  type="text"
                  value={newTemplate.titulo}
                  onChange={(e) => setNewTemplate({ ...newTemplate, titulo: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2"
                  placeholder="Título da mensagem"
                />
                <textarea
                  value={newTemplate.mensagem}
                  onChange={(e) => setNewTemplate({ ...newTemplate, mensagem: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none mb-2"
                  rows={3}
                  placeholder="Texto da mensagem. Use {estabelecimento} para substituir pelo nome do lead."
                />
                <Button size="sm" onClick={saveTemplate} disabled={saving || !newTemplate.titulo || !newTemplate.mensagem}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
