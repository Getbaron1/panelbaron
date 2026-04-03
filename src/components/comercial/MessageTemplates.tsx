// src/components/comercial/MessageTemplates.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

// Função para obter usuário do localStorage
function getLoggedUser() {
  try {
    const userData = localStorage.getItem('baron_admin_user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (e) {
    console.error('Erro ao ler dados do usuário');
  }
  return null;
}

interface Template {
  id: string;
  name: string;
  message: string;
  variables: string[];
  created_at: string;
}

interface MessageTemplatesProps {
  onSelectTemplate: (message: string) => void;
  leadData?: {
    nome: string;
    vendedor: string;
    tipo_estabelecimento: string;
  };
}

export default function MessageTemplates({
  onSelectTemplate,
  leadData,
}: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '' });

  // Templates padrão
  const defaultTemplates = [
    {
      name: 'Primeiro Contato',
      message: 'Fala {{nome}}, aqui é {{vendedor}} do GetBaron. Te chamei pra falar rapidamente sobre o sistema de pagamentos e gestão do seu {{tipo_estabelecimento}}.',
    },
    {
      name: 'Follow-up 1',
      message: 'Opa {{nome}}, tudo bem? Só voltei aqui pra confirmar se conseguiu analisar a proposta. Qualquer dúvida é só falar!',
    },
    {
      name: 'Follow-up 2',
      message: 'Oi {{nome}}, beleza? Tava aqui pensando no seu {{tipo_estabelecimento}} e como a gente consegue aumentar suas vendas. Posso te mandar uma proposta customizada?',
    },
    {
      name: 'Pós-Reunião',
      message: 'Reunião confirmada dia {{data}} às {{hora}}. Qualquer coisa me chama no WhatsApp.',
    },
    {
      name: 'Fechamento',
      message: 'Ó {{nome}}, só pra finalizar aqui... você aprova o plano {{plano}} para começar semana que vem? Posso já liberar o sistema.',
    },
  ];

  // Renderizar template com variáveis
  const renderTemplate = (template: string, data?: any) => {
    let rendered = template;
    
    if (data?.nome) rendered = rendered.replace(/{{nome}}/g, data.nome);
    if (data?.vendedor) rendered = rendered.replace(/{{vendedor}}/g, data.vendedor);
    if (data?.tipo_estabelecimento) rendered = rendered.replace(/{{tipo_estabelecimento}}/g, data.tipo_estabelecimento);
    if (data?.data) rendered = rendered.replace(/{{data}}/g, data.data);
    if (data?.hora) rendered = rendered.replace(/{{hora}}/g, data.hora);
    if (data?.plano) rendered = rendered.replace(/{{plano}}/g, data.plano);

    return rendered;
  };

  const handleSelectTemplate = (templateMessage: string) => {
    const rendered = renderTemplate(templateMessage, leadData);
    onSelectTemplate(rendered);
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message) return;

    const user = getLoggedUser();
    
    // Salvar no Supabase
    await supabase
      .from('message_templates')
      .insert([{
        name: newTemplate.name,
        message: newTemplate.message,
        created_by: user?.id || null,
      }]);

    setNewTemplate({ name: '', message: '' });
    setShowForm(false);
    // Recarregar templates
    loadTemplates();
  };

  const loadTemplates = async () => {
    // TODO: Buscar templates do DB
    // Por enquanto usando padrão
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">📋 Templates de Mensagem</h3>

      {/* Templates Padrão */}
      <div className="grid gap-2">
        {defaultTemplates.map((template, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectTemplate(template.message)}
            className="text-left p-3 bg-gray-50 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition"
          >
            <div className="font-semibold text-sm text-gray-900">{template.name}</div>
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {renderTemplate(template.message, leadData)}
            </div>
          </button>
        ))}
      </div>

      {/* Adicionar Template */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition"
        >
          + Adicionar Template
        </button>
      ) : (
        <Card className="p-3 bg-blue-50 border-blue-300">
          <input
            type="text"
            placeholder="Nome do template"
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            className="w-full p-2 mb-2 text-sm border rounded"
          />
          <textarea
            placeholder="Mensagem (use {{nome}}, {{vendedor}}, {{tipo_estabelecimento}})"
            value={newTemplate.message}
            onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
            className="w-full p-2 mb-2 text-sm border rounded"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTemplate}
              className="flex-1 py-2 text-sm font-semibold bg-green-600 text-white rounded hover:bg-green-700"
            >
              Salvar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 text-sm font-semibold bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
