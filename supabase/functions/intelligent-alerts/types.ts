export type AlertStatus = "info" | "warning" | "critical";

export type AlertPayload = {
  bar_id: string | number;
  kpi: string;
  value: string | number;
  status: AlertStatus | string;
  establishment_id?: string | null;
  observed_at?: string;
  window_hours?: number;
  context?: Record<string, unknown>;
};

export type LlmProvider = "openai" | "gemini";

export type OperationalOverview = {
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
  stalled_products: Array<Record<string, unknown>>;
  payment_mix: Array<Record<string, unknown>>;
};

export type AlertInsight = {
  establishmentId: string | null;
  windowStartIso: string;
  windowEndIso: string;
  previousWindowStartIso: string;
  previousWindowEndIso: string;
  yesterdayWindowStartIso: string;
  yesterdayWindowEndIso: string;
  current: OperationalOverview | null;
  previous: OperationalOverview | null;
  yesterday: OperationalOverview | null;
  ticketCurrent: number | null;
  ticketPrevious: number | null;
  ticketYesterday: number | null;
  ticketDeltaPercent: number | null;
  ticketDeltaVsYesterdayPercent: number | null;
  kdsDeltaVsPreviousPercent: number | null;
  kdsDeltaVsYesterdayPercent: number | null;
  revenueDeltaVsYesterdayPercent: number | null;
  ordersDeltaVsYesterdayPercent: number | null;
  kpiDeltaPercent: number | null;
  confidence: "low" | "medium" | "high";
  strategicAction: string;
  evidence: string[];
};
