import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AlertInsight, AlertPayload, OperationalOverview } from "../types.ts";

type TicketPoint = {
  avg_ticket: number | null;
  total_orders: number | null;
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function percentDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function parseTimestamp(raw?: string): Date {
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

function detectEstablishmentId(payload: AlertPayload): string | null {
  if (payload.establishment_id) return payload.establishment_id;

  const ctx = payload.context || {};
  const fromContext = ctx["establishment_id"];
  if (typeof fromContext === "string" && fromContext.trim()) return fromContext;

  if (typeof payload.bar_id === "string" && /^[0-9a-fA-F-]{36}$/.test(payload.bar_id)) {
    return payload.bar_id;
  }

  return null;
}

function weightedAverageTicket(rows: TicketPoint[] | null): number | null {
  if (!rows || rows.length === 0) return null;
  let numerator = 0;
  let denominator = 0;
  for (const row of rows) {
    const avg = toNumber(row.avg_ticket);
    const count = toNumber(row.total_orders);
    if (count > 0) {
      numerator += avg * count;
      denominator += count;
    }
  }
  if (denominator <= 0) return null;
  return numerator / denominator;
}

function normalizeOverview(row: Record<string, unknown> | null | undefined): OperationalOverview | null {
  if (!row) return null;
  return {
    avg_kds_minutes: toNumber(row.avg_kds_minutes),
    avg_order_to_delivery_minutes: toNumber(row.avg_order_to_delivery_minutes),
    cancellation_refund_rate: toNumber(row.cancellation_refund_rate),
    cancelled_paid_orders: toNumber(row.cancelled_paid_orders),
    total_paid_orders: toNumber(row.total_paid_orders),
    total_paid_revenue: toNumber(row.total_paid_revenue),
    qr_orders_count: toNumber(row.qr_orders_count),
    qr_orders_rate: toNumber(row.qr_orders_rate),
    stalled_products_count: toNumber(row.stalled_products_count),
    avg_orders_per_user_night: toNumber(row.avg_orders_per_user_night),
    stalled_products: Array.isArray(row.stalled_products) ? row.stalled_products as Array<Record<string, unknown>> : [],
    payment_mix: Array.isArray(row.payment_mix) ? row.payment_mix as Array<Record<string, unknown>> : [],
  };
}

function buildRuleBasedAction(payload: AlertPayload, insight: Omit<AlertInsight, "strategicAction" | "evidence">): {
  strategicAction: string;
  evidence: string[];
} {
  const minOrders = Math.max(1, toNumber(Deno.env.get("ALERT_MIN_ORDERS_FOR_ACTION") || 8));
  const kpi = payload.kpi.toLowerCase();
  const ev: string[] = [];

  if (insight.current) {
    ev.push(`kds_atual=${insight.current.avg_kds_minutes.toFixed(1)}min`);
    ev.push(`cancelamento=${insight.current.cancellation_refund_rate.toFixed(1)}%`);
    ev.push(`pedidos_pagos=${insight.current.total_paid_orders}`);
    ev.push(`receita_atual=${insight.current.total_paid_revenue.toFixed(2)}`);
  }
  if (insight.yesterday) {
    ev.push(`kds_ontem=${insight.yesterday.avg_kds_minutes.toFixed(1)}min`);
    ev.push(`pedidos_ontem=${insight.yesterday.total_paid_orders}`);
  }
  if (insight.ticketDeltaPercent !== null) {
    ev.push(`delta_ticket=${insight.ticketDeltaPercent.toFixed(1)}%`);
  }
  if (insight.ticketDeltaVsYesterdayPercent !== null) {
    ev.push(`delta_ticket_vs_ontem=${insight.ticketDeltaVsYesterdayPercent.toFixed(1)}%`);
  }
  if (insight.kpiDeltaPercent !== null) {
    ev.push(`delta_kpi=${insight.kpiDeltaPercent.toFixed(1)}%`);
  }
  if (insight.revenueDeltaVsYesterdayPercent !== null) {
    ev.push(`delta_receita_vs_ontem=${insight.revenueDeltaVsYesterdayPercent.toFixed(1)}%`);
  }
  if (insight.ordersDeltaVsYesterdayPercent !== null) {
    ev.push(`delta_pedidos_vs_ontem=${insight.ordersDeltaVsYesterdayPercent.toFixed(1)}%`);
  }

  const orders = insight.current?.total_paid_orders || 0;
  if (orders < minOrders) {
    return {
      strategicAction:
        `Acao: volume baixo (${orders} pedidos). Validar tracking de pedidos/pagamentos no periodo e reprocessar alerta com janela maior (12h) antes de mudar vitrine/KDS.`,
      evidence: ev,
    };
  }

  if (kpi.includes("kds")) {
    const kds = insight.current?.avg_kds_minutes || 0;
    const kdsVsYesterday = insight.kdsDeltaVsYesterdayPercent ?? 0;
    const ticketVsYesterday = insight.ticketDeltaVsYesterdayPercent ?? 0;
    return {
      strategicAction:
        `Acao: Gabigol, ligar para o dono e aplicar por 30 min o modo pico no app: esconder itens >8 min, subir combos rapidos no topo e liberar fila do KDS em lotes de 5; revisar em 10 min (KDS ${kds.toFixed(1)}min, vs ontem ${kdsVsYesterday.toFixed(1)}%, ticket vs ontem ${ticketVsYesterday.toFixed(1)}%).`,
      evidence: ev,
    };
  }

  if (kpi.includes("ticket")) {
    return {
      strategicAction:
        "Acao: ativar upsell obrigatorio no caixa por 45 min (1 adicional premium + 1 bebida margem alta), com script unico para toda equipe e meta de +12% no ticket por pedido.",
      evidence: ev,
    };
  }

  if (kpi.includes("cancel")) {
    return {
      strategicAction:
        "Acao: bloquear temporariamente itens com maior ruptura por 30 min, confirmar prazo antes de fechar pedido e acionar gerente para contato imediato em pedidos em risco.",
      evidence: ev,
    };
  }

  return {
    strategicAction:
      "Acao: Gabigol aciona dono para ajuste imediato de vitrine no app (topo com alta margem e preparo curto) por 30 min e follow-up em 10 min com novo snapshot.",
    evidence: ev,
  };
}

export async function buildAlertInsight(payload: AlertPayload): Promise<AlertInsight> {
  const minOrders = Math.max(1, toNumber(Deno.env.get("ALERT_MIN_ORDERS_FOR_ACTION") || 8));
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurado");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const establishmentId = detectEstablishmentId(payload);

  const end = parseTimestamp(payload.observed_at);
  const defaultWindowHours = toNumber(Deno.env.get("ALERT_DEFAULT_WINDOW_HOURS") || 6);
  const windowHours = Math.max(1, Math.min(24, toNumber(payload.window_hours) || defaultWindowHours || 6));
  const start = subHours(end, windowHours);
  const previousEnd = start;
  const previousStart = subHours(previousEnd, windowHours);
  const yesterdayEnd = subHours(end, 24);
  const yesterdayStart = subHours(yesterdayEnd, windowHours);

  const [
    currentOverviewRes,
    previousOverviewRes,
    yesterdayOverviewRes,
    ticketCurrentRes,
    ticketPreviousRes,
    ticketYesterdayRes,
  ] = await Promise.all([
    supabase.rpc("analytics_operational_alerts", {
      p_start: start.toISOString(),
      p_end: end.toISOString(),
      p_establishment_id: establishmentId,
    }),
    supabase.rpc("analytics_operational_alerts", {
      p_start: previousStart.toISOString(),
      p_end: previousEnd.toISOString(),
      p_establishment_id: establishmentId,
    }),
    supabase.rpc("analytics_operational_alerts", {
      p_start: yesterdayStart.toISOString(),
      p_end: yesterdayEnd.toISOString(),
      p_establishment_id: establishmentId,
    }),
    supabase.rpc("analytics_ticket_timeseries", {
      p_start: start.toISOString(),
      p_end: end.toISOString(),
      p_establishment_id: establishmentId,
    }),
    supabase.rpc("analytics_ticket_timeseries", {
      p_start: previousStart.toISOString(),
      p_end: previousEnd.toISOString(),
      p_establishment_id: establishmentId,
    }),
    supabase.rpc("analytics_ticket_timeseries", {
      p_start: yesterdayStart.toISOString(),
      p_end: yesterdayEnd.toISOString(),
      p_establishment_id: establishmentId,
    }),
  ]);

  if (currentOverviewRes.error) throw currentOverviewRes.error;
  if (previousOverviewRes.error) throw previousOverviewRes.error;
  if (yesterdayOverviewRes.error) throw yesterdayOverviewRes.error;
  if (ticketCurrentRes.error) throw ticketCurrentRes.error;
  if (ticketPreviousRes.error) throw ticketPreviousRes.error;
  if (ticketYesterdayRes.error) throw ticketYesterdayRes.error;

  const current = normalizeOverview(currentOverviewRes.data?.[0] || null);
  const previous = normalizeOverview(previousOverviewRes.data?.[0] || null);
  const yesterday = normalizeOverview(yesterdayOverviewRes.data?.[0] || null);
  const ticketCurrent = weightedAverageTicket((ticketCurrentRes.data || []) as TicketPoint[]);
  const ticketPrevious = weightedAverageTicket((ticketPreviousRes.data || []) as TicketPoint[]);
  const ticketYesterday = weightedAverageTicket((ticketYesterdayRes.data || []) as TicketPoint[]);
  const ticketDeltaPercent = (ticketCurrent !== null && ticketPrevious !== null)
    ? percentDelta(ticketCurrent, ticketPrevious)
    : null;
  const ticketDeltaVsYesterdayPercent = (ticketCurrent !== null && ticketYesterday !== null)
    ? percentDelta(ticketCurrent, ticketYesterday)
    : null;
  const kdsDeltaVsPreviousPercent = (current && previous)
    ? percentDelta(current.avg_kds_minutes, previous.avg_kds_minutes)
    : null;
  const kdsDeltaVsYesterdayPercent = (current && yesterday)
    ? percentDelta(current.avg_kds_minutes, yesterday.avg_kds_minutes)
    : null;
  const revenueDeltaVsYesterdayPercent = (current && yesterday)
    ? percentDelta(current.total_paid_revenue, yesterday.total_paid_revenue)
    : null;
  const ordersDeltaVsYesterdayPercent = (current && yesterday)
    ? percentDelta(current.total_paid_orders, yesterday.total_paid_orders)
    : null;

  const kpiRaw = toNumber(payload.value);
  let kpiDeltaPercent: number | null = null;
  if (payload.kpi.toLowerCase().includes("kds") && current && previous) {
    kpiDeltaPercent = kdsDeltaVsPreviousPercent;
  } else if (payload.kpi.toLowerCase().includes("ticket") && ticketDeltaPercent !== null) {
    kpiDeltaPercent = ticketDeltaPercent;
  } else if (kpiRaw > 0 && previous?.total_paid_orders && current?.total_paid_orders) {
    kpiDeltaPercent = percentDelta(current.total_paid_orders, previous.total_paid_orders);
  }

  const base = {
    establishmentId,
    windowStartIso: start.toISOString(),
    windowEndIso: end.toISOString(),
    previousWindowStartIso: previousStart.toISOString(),
    previousWindowEndIso: previousEnd.toISOString(),
    yesterdayWindowStartIso: yesterdayStart.toISOString(),
    yesterdayWindowEndIso: yesterdayEnd.toISOString(),
    current,
    previous,
    yesterday,
    ticketCurrent,
    ticketPrevious,
    ticketYesterday,
    ticketDeltaPercent,
    ticketDeltaVsYesterdayPercent,
    kdsDeltaVsPreviousPercent,
    kdsDeltaVsYesterdayPercent,
    revenueDeltaVsYesterdayPercent,
    ordersDeltaVsYesterdayPercent,
    kpiDeltaPercent,
    confidence: current && (current.total_paid_orders || 0) >= minOrders ? "high" : "low",
  };

  const rule = buildRuleBasedAction(payload, base);
  return {
    ...base,
    strategicAction: rule.strategicAction,
    evidence: rule.evidence,
  };
}
