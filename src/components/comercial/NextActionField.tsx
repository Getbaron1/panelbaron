// src/components/comercial/NextActionField.tsx
import React, { useState } from 'react';

interface NextActionFieldProps {
  currentAction?: string;
  currentDate?: string;
  leadId: string;
  onUpdate: (action: string, date: string) => Promise<void>;
  loading?: boolean;
}

export default function NextActionField({
  currentAction,
  currentDate,
  leadId,
  onUpdate,
  loading,
}: NextActionFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAction, setSelectedAction] = useState(currentAction || 'whatsapp');
  const [selectedDate, setSelectedDate] = useState(currentDate || '');
  const [saving, setSaving] = useState(false);

  const actions = [
    { value: 'whatsapp', label: '💬 WhatsApp', color: 'bg-green-100 text-green-700' },
    { value: 'call', label: '📞 Ligar', color: 'bg-blue-100 text-blue-700' },
    { value: 'meeting', label: '📅 Reunião', color: 'bg-purple-100 text-purple-700' },
    { value: 'follow_up', label: '🔄 Follow-up', color: 'bg-orange-100 text-orange-700' },
    { value: 'send_proposal', label: '📄 Enviar Proposta', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'wait', label: '⏰ Aguardar', color: 'bg-gray-100 text-gray-700' },
  ];

  const handleSave = async () => {
    if (!selectedDate) {
      alert('Selecione uma data');
      return;
    }

    setSaving(true);
    try {
      await onUpdate(selectedAction, selectedDate);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar próxima ação:', error);
      alert('Erro ao atualizar próxima ação');
    } finally {
      setSaving(false);
    }
  };

  const currentActionLabel = actions.find((a) => a.value === currentAction)?.label || 'Não definido';
  const actionColor = actions.find((a) => a.value === currentAction)?.color;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-sm mb-3">🎯 Próxima Ação</h3>

      {!isEditing ? (
        <div
          className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-gray-100"
          onClick={() => setIsEditing(true)}
        >
          <div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${actionColor}`}>
              {currentActionLabel}
            </div>
            {currentDate && (
              <div className="text-xs text-gray-600 mt-1">
                📅 {new Date(currentDate).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          <div className="text-gray-400">✏️</div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Seleção de ação */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Ação:</label>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => setSelectedAction(action.value)}
                  className={`p-2 rounded text-sm font-medium transition-all ${
                    selectedAction === action.value
                      ? `${action.color} ring-2 ring-offset-1`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de data */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Data:</label>
            <input
              type="datetime-local"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !selectedDate}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Salvando...' : '✅ Salvar'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedAction(currentAction || 'whatsapp');
                setSelectedDate(currentDate || '');
              }}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
