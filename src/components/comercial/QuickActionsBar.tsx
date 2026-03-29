// src/components/comercial/QuickActionsBar.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCommercialActions } from '@/hooks/useCommercialActions';

interface QuickActionsBarProps {
  leadId: string;
  leadName: string;
  phone: string;
  vendedorName?: string;
  estabelecimentoType?: string;
  onActionComplete?: () => void;
}

export default function QuickActionsBar({
  leadId,
  leadName,
  phone,
  vendedorName = 'GetBaron',
  estabelecimentoType = 'negócio',
  onActionComplete,
}: QuickActionsBarProps) {
  const { sendWhatsApp, logWhatsAppClick, makeCall, logCall } = useCommercialActions();
  const [showCallFollowup, setShowCallFollowup] = useState(false);
  const [callResult, setCallResult] = useState<'attended' | 'not_attended' | 'voicemail' | 'callback_requested' | null>(null);

  // Mensagem WhatsApp dinamizada
  const defaultWhatsAppMessage = `Fala ${leadName}, aqui é ${vendedorName} do GetBaron. Te chamei pra falar rapidamente sobre o sistema de pagamentos e gestão do seu ${estabelecimentoType}.`;

  const handleWhatsApp = async (message = defaultWhatsAppMessage) => {
    await logWhatsAppClick(leadId);
    sendWhatsApp(phone, message);
    onActionComplete?.();
  };

  const handleCallClick = () => {
    makeCall(phone);
    setShowCallFollowup(true);
  };

  const handleCallResult = async (result: typeof callResult) => {
    await logCall(leadId, result || 'unknown', '');
    setCallResult(result);
    setShowCallFollowup(false);
    onActionComplete?.();
  };

  return (
    <div className="flex gap-2 items-center flex-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
      {/* WhatsApp Button */}
      <button
        onClick={() => handleWhatsApp()}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600 transition"
        title="Enviar WhatsApp automático"
      >
        💬 WhatsApp
      </button>

      {/* Call Button */}
      {!showCallFollowup ? (
        <button
          onClick={handleCallClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition"
          title="Discar para o lead"
        >
          📞 Ligar
        </button>
      ) : (
        /* Call Followup Popup */
        <div className="flex gap-2 items-center bg-white border border-blue-300 rounded p-2">
          <span className="text-sm font-semibold">Resultado:</span>
          <button
            onClick={() => handleCallResult('attended')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            ✓ Atendeu
          </button>
          <button
            onClick={() => handleCallResult('not_attended')}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            ✗ Não atendeu
          </button>
          <button
            onClick={() => handleCallResult('voicemail')}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            🔊 Caixa postal
          </button>
          <button
            onClick={() => handleCallResult('callback_requested')}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            ⏱️ Retorno
          </button>
        </div>
      )}

      {/* Custom Message Button */}
      <button
        onClick={() => {
          const msg = prompt('Mensagem personalizada:', defaultWhatsAppMessage);
          if (msg) handleWhatsApp(msg);
        }}
        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
        title="Enviar mensagem personalizada"
      >
        ✏️ Personalizar
      </button>
    </div>
  );
}
