// src/components/comercial/QuickObjectionModal.tsx
import React, { useState } from 'react';
import { useCommercialActions } from '@/hooks/useCommercialActions';

interface QuickObjectionModalProps {
  isOpen: boolean;
  leadId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickObjectionModal({
  isOpen,
  leadId,
  onClose,
  onSuccess,
}: QuickObjectionModalProps) {
  const [selectedObjection, setSelectedObjection] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { quickObjection } = useCommercialActions();

  const objections = [
    { value: 'price', label: '💰 Muito caro', icon: '💰' },
    { value: 'has_system', label: '🖥️ Já tenho sistema', icon: '🖥️' },
    { value: 'later', label: '⏰ Falar outro mês', icon: '⏰' },
    { value: 'partner', label: '👔 Falar com sócio', icon: '👔' },
    { value: 'no_interest', label: '❌ Sem interesse', icon: '❌' },
    { value: 'other', label: '❓ Outro', icon: '❓' },
  ];

  const handleSelect = async (objectionValue: string) => {
    if (objectionValue === 'other' && !customReason) {
      alert('Digite o motivo da objeção');
      return;
    }

    setLoading(true);
    try {
      const finalObjection = objectionValue === 'other' ? customReason : objectionValue;
      await quickObjection(leadId, finalObjection);

      // Feedback visual
      alert('✅ Objeção registrada!');
      setSelectedObjection('');
      setCustomReason('');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao registrar objeção:', error);
      alert('❌ Erro ao registrar objeção');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">🚫 Registrar Objeção</h2>

        <div className="space-y-2 mb-4">
          {objections.map((obj) => (
            <div key={obj.value}>
              {obj.value === 'other' && selectedObjection === 'other' ? (
                <input
                  type="text"
                  placeholder="Descreva a objeção..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => handleSelect(obj.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-red-100 text-gray-700 rounded transition-colors font-medium text-sm"
                >
                  {obj.label}
                </button>
              )}
            </div>
          ))}
        </div>

        {selectedObjection === 'other' && customReason && (
          <button
            onClick={() => handleSelect('other')}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
          >
            {loading ? '⏳ Salvando...' : '✅ Confirmar'}
          </button>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium text-sm hover:bg-gray-300"
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );
}
