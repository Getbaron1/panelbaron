import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdminSectors, type AdminSector } from '@/lib/adminApi';

interface CreateLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

export default function CreateLeadForm({ isOpen, onClose, onSuccess, userEmail }: CreateLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [sectorsLoading, setSectorsLoading] = useState(false);
  const [sectors, setSectors] = useState<AdminSector[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome_estabelecimento: '',
    tipo: '',
    responsavel_telefone: '',
    responsavel_email: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    const loadSectors = async () => {
      setSectorsLoading(true);
      try {
        const data = await getAdminSectors();
        setSectors(data);
        setFormData((prev) => ({
          ...prev,
          tipo: prev.tipo || data[0]?.name || 'outro',
        }));
      } catch (err) {
        console.error('Erro ao carregar setores:', err);
        setSectors([]);
        setFormData((prev) => ({
          ...prev,
          tipo: prev.tipo || 'outro',
        }));
      } finally {
        setSectorsLoading(false);
      }
    };

    void loadSectors();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.nome_estabelecimento.trim() || !formData.responsavel_telefone.trim()) {
        throw new Error('Nome e telefone sao obrigatorios');
      }

      let userId: string | null = null;
      try {
        const userData = localStorage.getItem('baron_admin_user');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id || null;
        }
      } catch (err) {
        console.warn('Nao conseguiu obter user_id do localStorage');
      }

      if (!userId) {
        throw new Error('Usuario nao autenticado. Faca login novamente.');
      }

      const leadData = {
        nome_estabelecimento: formData.nome_estabelecimento,
        tipo: formData.tipo || 'outro',
        responsavel_nome: formData.nome_estabelecimento,
        responsavel_telefone: formData.responsavel_telefone,
        responsavel_email: formData.responsavel_email || null,
        responsavel_whatsapp: formData.responsavel_telefone,
        instagram: null,
        cidade: 'A Definir',
        estado: 'SP',
        faturamento_estimado: null,
        origem_lead: 'prospeccao',
        sdr_responsavel_id: userId,
        status: 'novo',
      };

      const { error: insertError } = await supabase.from('leads').insert([leadData]);
      if (insertError) throw insertError;

      setFormData({
        nome_estabelecimento: '',
        tipo: sectors[0]?.name || '',
        responsavel_telefone: '',
        responsavel_email: '',
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Novo Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              name="nome_estabelecimento"
              value={formData.nome_estabelecimento}
              onChange={handleChange}
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              placeholder="Ex: Bar do Joao"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Setor *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              disabled={sectorsLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base bg-white disabled:bg-gray-100"
            >
              {!sectorsLoading && sectors.length === 0 && <option value="outro">Outro</option>}
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.name}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              name="responsavel_telefone"
              value={formData.responsavel_telefone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              placeholder="(11) 98765-4321"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="responsavel_email"
              value={formData.responsavel_email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-base"
              placeholder="joao@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional - pode editar depois</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-semibold transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
