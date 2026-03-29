// src/components/comercial/LeadsList.tsx
import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/commercial';
import * as commercialServices from '@/lib/commercialServices';
import LeadCard from './LeadCard';
import LeadDetailModal from './LeadDetailModal';

interface LeadsListProps {
  vendedorId?: string;
}

export default function LeadsList({ vendedorId }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, [vendedorId]);

  const loadLeads = async () => {
    try {
      setLoading(true);

      // Buscar leads do banco
      let filters: any = {};

      // Filtro por vendedor
      if (vendedorId) {
        filters.sdr_id = vendedorId;
      }

      const { data, error: err } = await commercialServices.getLeads(filters);

      if (err) {
        setLeads([]);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadUpdate = () => {
    loadLeads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin mb-2">⏳</div>
          <p>Carregando leads...</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-2">📭</div>
        <p>Nenhum lead encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de leads em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onLeadUpdate={handleLeadUpdate}
            onClick={() => setSelectedLead(lead)}
          />
        ))}
      </div>

      {/* Modal de detalhes */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
}
