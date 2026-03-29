import { getEstablishments } from "@/lib/supabase";

export type AnalyticsFilters = {
  start: string;
  end: string;
  establishmentId?: string | null;
};

export type HeatmapCell = {
  bucket_hour: string;
  hour_label: string;
  bucket_label: string;
  amount: number;
};

export type MenuEngineeringRow = {
  product_id: string | null;
  product_name: string;
  category_name: string;
  quantity_sold: number;
  gross_revenue: number;
  avg_sale_price: number;
  cost_price: number | null;
  gross_margin_percent: number | null;
  classification: "star" | "workhorse" | "puzzle" | "dog";
};

export type TicketSeriesRow = {
  bucket_hour: string;
  hour_label: string;
  avg_ticket: number;
  total_orders: number;
};

export type OverviewData = {
  avg_kds_minutes: number;
  avg_order_to_delivery_minutes: number;
  cancellation_refund_rate: number;
  cancelled_paid_orders: number;
  total_paid_orders: number;
  total_paid_revenue: number;
  qr_orders_count: number;
  qr_orders_rate: number;
  stalled_products_count: number;
  avg_orders_per_user_night: number;
  stalled_products: Array<{
    product_id: string;
    product_name: string;
    category_name: string;
  }>;
  payment_mix: Array<{
    payment_method: string;
    orders_count: number;
    revenue: number;
  }>;
};

type HeatmapOptions = {
  dimension: "category" | "product";
  metric: "revenue" | "quantity";
};

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const ANALYTICS_BASE = `${SUPABASE_URL}/functions/v1/analytics`;

function buildQuery(filters: AnalyticsFilters, extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    start: filters.start,
    end: filters.end,
  });

  if (filters.establishmentId) {
    params.set("establishmentId", filters.establishmentId);
  }

  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, value));

  return params.toString();
}

async function getJson<T>(path: string, query: string): Promise<T> {
  const endpoint = path.replace(/^\//, "");
  const url = `${ANALYTICS_BASE}?endpoint=${encodeURIComponent(endpoint)}&${query}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erro na API analytics (${response.status})`);
  }

  const payload = await response.json();
  if (!payload?.ok) {
    throw new Error(payload?.message || "Erro ao consultar analytics.");
  }

  return payload.data as T;
}

export async function getAnalyticsOverview(filters: AnalyticsFilters): Promise<OverviewData> {
  return getJson<OverviewData>("/overview", buildQuery(filters));
}

export async function getAnalyticsHeatmap(
  filters: AnalyticsFilters,
  options: HeatmapOptions,
): Promise<HeatmapCell[]> {
  return getJson<HeatmapCell[]>(
    "/heatmap",
    buildQuery(filters, {
      dimension: options.dimension,
      metric: options.metric,
    }),
  );
}

export async function getAnalyticsMenuEngineering(filters: AnalyticsFilters): Promise<MenuEngineeringRow[]> {
  return getJson<MenuEngineeringRow[]>("/menu-engineering", buildQuery(filters));
}

export async function getAnalyticsTicketSeries(filters: AnalyticsFilters): Promise<TicketSeriesRow[]> {
  return getJson<TicketSeriesRow[]>("/ticket-recorrencia", buildQuery(filters));
}

export async function exportAnalyticsCsv(filters: AnalyticsFilters): Promise<void> {
  const query = buildQuery(filters);
  const url = `${ANALYTICS_BASE}?endpoint=export.csv&${query}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao exportar CSV (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `getbaron-analytics-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function getAnalyticsEstablishments() {
  return getEstablishments();
}
