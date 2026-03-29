// src/components/comercial/EditLeadModal.tsx
import React, { useState, useEffect } from 'react'
import { X, Save, Phone, Mail, Building, MapPin, DollarSign, User, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { getAdminSectors, type AdminSector } from '@/lib/adminApi'

interface EditLeadModalProps {
  lead: any
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function EditLeadModal({ lead, isOpen, onClose, onSave }: EditLeadModalProps) {
  const [formData, setFormData] = useState({
    nome_estabelecimento: '',
    tipo: '',
    responsavel_nome: '',
    responsavel_telefone: '',
    responsavel_email: '',
    responsavel_whatsapp: '',
    instagram: '',
    cidade: '',
    estado: '',
    faturamento_estimado: '',
    origem_lead: '',
    status: '',
    proxima_acao: '',
    data_proxima_acao: '',
    observacoes: '',
  })
  const [loading, setLoading] = useState(false)
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [sectors, setSectors] = useState<AdminSector[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadSectors = async () => {
      setSectorsLoading(true)
      try {
        const data = await getAdminSectors()
        setSectors(data)
      } catch (err) {
        console.error('Erro ao carregar setores:', err)
        setSectors([])
      } finally {
        setSectorsLoading(false)
      }
    }

    void loadSectors()
  }, [isOpen])

  useEffect(() => {
    if (lead) {
      setFormData({
        nome_estabelecimento: lead.nome_estabelecimento || '',
        tipo: lead.tipo || 'outro',
        responsavel_nome: lead.responsavel_nome || '',
        responsavel_telefone: lead.responsavel_telefone || '',
        responsavel_email: lead.responsavel_email || '',
        responsavel_whatsapp: lead.responsavel_whatsapp || '',
        instagram: lead.instagram || '',
        cidade: lead.cidade || '',
        estado: lead.estado || 'SP',
        faturamento_estimado: lead.faturamento_estimado?.toString() || '',
        origem_lead: lead.origem_lead || 'prospeccao',
        status: lead.status || 'novo',
        proxima_acao: lead.proxima_acao || '',
        data_proxima_acao: lead.data_proxima_acao?.split('T')[0] || '',
        observacoes: lead.observacoes || '',
      })
    }
  }, [lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updateData = {
        ...formData,
        faturamento_estimado: formData.faturamento_estimado ? Number(formData.faturamento_estimado) : null,
        data_proxima_acao: formData.data_proxima_acao || null,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id)

      if (updateError) throw updateError

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-xl font-bold">Editar Lead</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Estabelecimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Estabelecimento *</label>
                <input
                  type="text"
                  value={formData.nome_estabelecimento}
                  onChange={(e) => setFormData({ ...formData, nome_estabelecimento: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  disabled={sectorsLoading}
                >
                  {sectors.length === 0 ? (
                    <option value={formData.tipo || 'outro'}>{formData.tipo || 'Outro'}</option>
                  ) : (
                    sectors.map((sector) => (
                      <option key={sector.id} value={sector.name}>
                        {sector.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Contato do Responsavel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Responsavel</label>
                <input
                  type="text"
                  value={formData.responsavel_nome}
                  onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone *</label>
                <input
                  type="tel"
                  value={formData.responsavel_telefone}
                  onChange={(e) => setFormData({ ...formData, responsavel_telefone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={formData.responsavel_whatsapp}
                  onChange={(e) => setFormData({ ...formData, responsavel_whatsapp: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.responsavel_email}
                  onChange={(e) => setFormData({ ...formData, responsavel_email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instagram</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="@"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Localizacao
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapa</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceara</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espirito Santo</option>
                  <option value="GO">Goias</option>
                  <option value="MA">Maranhao</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Para</option>
                  <option value="PB">Paraiba</option>
                  <option value="PR">Parana</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piaui</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondonia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">Sao Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Status e Proxima Acao
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="novo">Novo</option>
                  <option value="contato_realizado">Contato Realizado</option>
                  <option value="interessado">Interessado</option>
                  <option value="reuniao_marcada">Reuniao Marcada</option>
                  <option value="reuniao_realizada">Reuniao Realizada</option>
                  <option value="convertido">Convertido</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Origem do Lead</label>
                <select
                  value={formData.origem_lead}
                  onChange={(e) => setFormData({ ...formData, origem_lead: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="prospeccao">Prospeccao</option>
                  <option value="indicacao">Indicacao</option>
                  <option value="site">Site</option>
                  <option value="redes_sociais">Redes Sociais</option>
                  <option value="evento">Evento</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Proxima Acao</label>
                <input
                  type="text"
                  value={formData.proxima_acao}
                  onChange={(e) => setFormData({ ...formData, proxima_acao: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  placeholder="Ex: Ligar para follow-up"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data da Proxima Acao</label>
                <input
                  type="date"
                  value={formData.data_proxima_acao}
                  onChange={(e) => setFormData({ ...formData, data_proxima_acao: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Informacoes Financeiras
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1">Faturamento Estimado (R$)</label>
              <input
                type="number"
                value={formData.faturamento_estimado}
                onChange={(e) => setFormData({ ...formData, faturamento_estimado: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium mb-1">Observacoes</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background min-h-[100px]"
              placeholder="Adicione observacoes sobre o lead..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alteracoes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
