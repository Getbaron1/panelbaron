import React, { useState } from 'react';
import { X, Edit2, Check, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/types/commercial';

interface EditLeadFieldProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditLeadField({ lead, isOpen, onClose, onSuccess }: EditLeadFieldProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const fields = [
    { key: 'nome_estabelecimento', label: 'Nome do Estabelecimento', type: 'text' },
    { key: 'tipo', label: 'Tipo de Negócio', type: 'select', options: ['bar', 'balada', 'restaurante', 'cafe', 'pizzaria', 'hamburgueria', 'outro'] },
    { key: 'responsavel_nome', label: 'Nome do Responsável', type: 'text' },
    { key: 'responsavel_telefone', label: 'Telefone', type: 'tel' },
    { key: 'responsavel_whatsapp', label: 'WhatsApp', type: 'tel' },
    { key: 'responsavel_email', label: 'Email', type: 'email' },
    { key: 'instagram', label: 'Instagram', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
    { key: 'estado', label: 'Estado', type: 'text' },
    { key: 'faturamento_estimado', label: 'Faturamento Estimado', type: 'number' },
  ];

  const handleSaveField = async (key: string) => {
    const value = editValues[key] ?? (lead as any)[key];
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('leads')
        .update({ [key]: value })
        .eq('id', lead.id);

      if (error) throw error;

      setActiveField(null);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Lead</h2>
            <p className="text-sm text-gray-600 mt-1">{lead.nome_estabelecimento}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {fields.map((field) => {
            const currentValue = (lead as any)[field.key] || '';
            const isEditing = activeField === field.key;
            const editValue = editValues[field.key] ?? currentValue;

            return (
              <div key={field.key} className="group">
                <button
                  onClick={() => setActiveField(field.key)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-200 transition group-hover:border-blue-300"
                >
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{field.label}</p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {currentValue || <span className="text-gray-400">Não definido</span>}
                    </p>
                  </div>
                  <Edit2 size={18} className="text-gray-400 group-hover:text-blue-600 transition ml-2" />
                </button>

                {isEditing && (
                  <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {field.type === 'select' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={editValue}
                        onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                        autoFocus
                        placeholder={`Digite o ${field.label.toLowerCase()}`}
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveField(field.key)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
                      >
                        <Check size={18} /> Salvar
                      </button>
                      <button
                        onClick={() => {
                          setActiveField(null);
                          setEditValues({});
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t-2 border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
