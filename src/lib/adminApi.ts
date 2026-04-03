export interface AdminSector {
  id: string;
  name: string;
  slug?: string;
}

const ADMIN_API_BASE_URL = (import.meta.env.VITE_ADMIN_API_BASE_URL || 'https://api.getbaron.com.br/v1').replace(/\/+$/, '');
const API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || '';
const DEFAULT_ESTABLISHMENT_ID =
  import.meta.env.VITE_ADMIN_ESTABLISHMENT_ID || '133d9a94-0ad4-49d3-a058-5467e4fe7f94';

function normalizeSector(raw: any): AdminSector | null {
  const id = String(raw?.id ?? raw?.uuid ?? raw?.sector_id ?? '').trim();
  const name = String(raw?.name ?? raw?.nome ?? raw?.title ?? '').trim();

  if (!id || !name) return null;

  return {
    id,
    name,
    slug: raw?.slug ? String(raw.slug) : undefined,
  };
}

export async function getAdminSectors(establishmentId: string = DEFAULT_ESTABLISHMENT_ID): Promise<AdminSector[]> {
  const url = new URL(`${ADMIN_API_BASE_URL}/admin/sectors`);
  url.searchParams.set('establishment_id', establishmentId);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {}

  const response = await fetch(url.toString(), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar setores: ${response.status}`);
  }

  const payload = await response.json();
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  return rawItems
    .map(normalizeSector)
    .filter((item: AdminSector | null): item is AdminSector => item !== null);
}
