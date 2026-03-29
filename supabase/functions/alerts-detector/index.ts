import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import axios from "npm:axios@1.8.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-detector-secret",
};

type DetectorCandidate = {
  establishment_id: string;
  kpi: string;
  metric_value: number;
  alert_status: "critical" | "warning";
  reason: string;
  evidence: Record<string, unknown>;
};

type PaidAgg = {
  orders: number;
  revenue: number;
  avgTicket: number;
};

function toNumber(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "unknown_error";
  }
}

function verifyDetectorSecret(req: Request): void {
  const expected = Deno.env.get("DETECTOR_WEBHOOK_SECRET");
  if (!expected) return;
  const got = req.headers.get("x-detector-secret");
  if (!got || got !== expected) {
    throw new Error("Detector nao autorizado");
  }
}

function inRange(dateIso: string, start: Date, end: Date): boolean {
  const value = new Date(dateIso).getTime();
  return value >= start.getTime() && value < end.getTime();
}

function percentDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function aggregatePaidRows(
  rows: Array<{ establishment_id: string; total: number; created_at: string }>,
  start: Date,
  end: Date,
): Map<string, PaidAgg> {
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const row of rows) {
    if (!row.establishment_id) continue;
    if (!inRange(row.created_at, start, end)) continue;
    const current = map.get(row.establishment_id) || { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += Number(row.total || 0);
    map.set(row.establishment_id, current);
  }

  const out = new Map<string, PaidAgg>();
  for (const [establishmentId, agg] of map.entries()) {
    out.set(establishmentId, {
      orders: agg.orders,
      revenue: agg.revenue,
      avgTicket: agg.orders > 0 ? agg.revenue / agg.orders : 0,
    });
  }
  return out;
}

function buildCandidates(params: {
  now: Date;
  stuckRows: Array<{ establishment_id: string; created_at: string; updated_at: string | null }>;
  paidRows: Array<{ establishment_id: string; total: number; created_at: string }>;
  windowMinutes: number;
  stuckMinutes: number;
  minPaidOrders: number;
  ticketDropPercent: number;
}): DetectorCandidate[] {
  const {
    now,
    stuckRows,
    paidRows,
    windowMinutes,
    stuckMinutes,
    minPaidOrders,
    ticketDropPercent,
  } = params;

  const currentStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const yesterdayEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStart = new Date(yesterdayEnd.getTime() - windowMinutes * 60 * 1000);

  const currentPaid = aggregatePaidRows(paidRows, currentStart, now);
  const ydayPaid = aggregatePaidRows(paidRows, yesterdayStart, yesterdayEnd);

  const candidates: DetectorCandidate[] = [];

  const stuckAgg = new Map<string, { count: number; maxMinutes: number; avgMinutesAccum: number }>();
  for (const row of stuckRows) {
    if (!row.establishment_id) continue;
    const referenceIso = row.updated_at || row.created_at;
    const minutes = (now.getTime() - new Date(referenceIso).getTime()) / (60 * 1000);
    const current = stuckAgg.get(row.establishment_id) || { count: 0, maxMinutes: 0, avgMinutesAccum: 0 };
    current.count += 1;
    current.maxMinutes = Math.max(current.maxMinutes, minutes);
    current.avgMinutesAccum += minutes;
    stuckAgg.set(row.establishment_id, current);
  }

  for (const [establishmentId, agg] of stuckAgg.entries()) {
    if (agg.maxMinutes < stuckMinutes) continue;
    const avgMinutes = agg.count > 0 ? agg.avgMinutesAccum / agg.count : 0;
    candidates.push({
      establishment_id: establishmentId,
      kpi: "kds_time",
      metric_value: Number(agg.maxMinutes.toFixed(2)),
      alert_status: agg.maxMinutes >= stuckMinutes * 1.5 ? "critical" : "warning",
      reason: "Pedidos presos em preparo acima do SLA",
      evidence: {
        preparing_orders: agg.count,
        max_stuck_minutes: Number(agg.maxMinutes.toFixed(2)),
        avg_stuck_minutes: Number(avgMinutes.toFixed(2)),
        threshold_minutes: stuckMinutes,
      },
    });
  }

  for (const [establishmentId, curr] of currentPaid.entries()) {
    const yday = ydayPaid.get(establishmentId);
    if (!yday) continue;
    if (curr.orders < minPaidOrders || yday.orders < minPaidOrders) continue;

    const deltaTicket = percentDelta(curr.avgTicket, yday.avgTicket);
    if (deltaTicket !== null && deltaTicket <= -ticketDropPercent) {
      candidates.push({
        establishment_id: establishmentId,
        kpi: "ticket_drop",
        metric_value: Number(curr.avgTicket.toFixed(2)),
        alert_status: deltaTicket <= -ticketDropPercent * 1.5 ? "critical" : "warning",
        reason: "Ticket medio caiu vs mesma janela de ontem",
        evidence: {
          current_avg_ticket: Number(curr.avgTicket.toFixed(2)),
          yesterday_avg_ticket: Number(yday.avgTicket.toFixed(2)),
          delta_ticket_percent: Number(deltaTicket.toFixed(2)),
          current_paid_orders: curr.orders,
          yesterday_paid_orders: yday.orders,
        },
      });
    }

    const deltaOrders = percentDelta(curr.orders, yday.orders);
    if (deltaOrders !== null && deltaOrders <= -25) {
      candidates.push({
        establishment_id: establishmentId,
        kpi: "orders_drop",
        metric_value: curr.orders,
        alert_status: deltaOrders <= -40 ? "critical" : "warning",
        reason: "Volume de pedidos caiu vs mesma janela de ontem",
        evidence: {
          current_paid_orders: curr.orders,
          yesterday_paid_orders: yday.orders,
          delta_orders_percent: Number(deltaOrders.toFixed(2)),
          current_revenue: Number(curr.revenue.toFixed(2)),
          yesterday_revenue: Number(yday.revenue.toFixed(2)),
        },
      });
    }
  }

  return candidates.sort((a, b) => {
    const score = (row: DetectorCandidate) => row.alert_status === "critical" ? 2 : 1;
    return score(b) - score(a);
  });
}

async function hasRecentAlert(
  supabase: ReturnType<typeof createClient>,
  establishmentId: string,
  kpi: string,
  cooldownMinutes: number,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();
  const query = await supabase
    .from("alert_dispatch_log")
    .select("id")
    .eq("establishment_id", establishmentId)
    .eq("kpi", kpi)
    .eq("success", true)
    .gte("sent_at", cutoff)
    .limit(1);

  if (query.error) {
    if (String(query.error.message || "").toLowerCase().includes("does not exist")) {
      return false;
    }
    throw query.error;
  }

  return (query.data || []).length > 0;
}

async function safeInsertDispatchLog(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("alert_dispatch_log").insert(row);
  if (!error) return;
  if (String(error.message || "").toLowerCase().includes("does not exist")) return;
  console.error("Falha ao gravar alert_dispatch_log:", error);
}

async function sendToIntelligentAlerts(
  candidate: DetectorCandidate,
  alertsUrl: string,
  serviceRoleKey: string,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  };

  const alertWebhookSecret = Deno.env.get("ALERT_WEBHOOK_SECRET");
  if (alertWebhookSecret) {
    headers["x-webhook-secret"] = alertWebhookSecret;
  }

  const windowMinutes = toNumber(Deno.env.get("DETECTOR_WINDOW_MINUTES"), 60);
  const payload = {
    bar_id: candidate.establishment_id,
    establishment_id: candidate.establishment_id,
    kpi: candidate.kpi,
    value: candidate.metric_value,
    status: candidate.alert_status,
    observed_at: new Date().toISOString(),
    window_hours: Math.max(1, Math.ceil(windowMinutes / 60)),
    context: {
      source: "alerts-detector",
      reason: candidate.reason,
      evidence: candidate.evidence,
    },
  };

  const response = await axios.post(alertsUrl, payload, {
    timeout: toNumber(Deno.env.get("DETECTOR_ALERT_TIMEOUT_MS"), 10000),
    headers,
  });

  return response.data as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Use POST para executar o detector." }, 405);
  }

  try {
    verifyDetectorSecret(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurado");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;

    const lookbackMinutes = toNumber(Deno.env.get("DETECTOR_LOOKBACK_MINUTES"), 180);
    const windowMinutes = toNumber(Deno.env.get("DETECTOR_WINDOW_MINUTES"), 60);
    const stuckMinutes = toNumber(Deno.env.get("DETECTOR_STUCK_MINUTES"), 20);
    const minPaidOrders = toNumber(Deno.env.get("DETECTOR_MIN_PAID_ORDERS"), 8);
    const ticketDropPercent = toNumber(Deno.env.get("DETECTOR_TICKET_DROP_PERCENT"), 15);
    const cooldownMinutes = toNumber(Deno.env.get("DETECTOR_COOLDOWN_MINUTES"), 30);
    const maxAlertsPerRun = toNumber(Deno.env.get("DETECTOR_MAX_ALERTS_PER_RUN"), 25);
    const maxOrdersScan = toNumber(Deno.env.get("DETECTOR_MAX_ORDERS_SCAN"), 10000);

    const now = new Date();
    const lookbackStartIso = new Date(now.getTime() - lookbackMinutes * 60 * 1000).toISOString();
    const paidScanStartIso = new Date(now.getTime() - (24 * 60 + windowMinutes) * 60 * 1000).toISOString();

    const [stuckRes, paidRes] = await Promise.all([
      supabase
        .from("orders")
        .select("establishment_id,created_at,updated_at,status,payment_status")
        .in("status", ["preparing", "preparando", "em_preparo"])
        .gte("created_at", lookbackStartIso)
        .range(0, Math.max(1, maxOrdersScan) - 1),
      supabase
        .from("orders")
        .select("establishment_id,total,created_at,payment_status")
        .in("payment_status", ["paid", "approved"])
        .gte("created_at", paidScanStartIso)
        .range(0, Math.max(1, maxOrdersScan) - 1),
    ]);

    if (stuckRes.error) throw stuckRes.error;
    if (paidRes.error) throw paidRes.error;

    const candidates = buildCandidates({
      now,
      stuckRows: (stuckRes.data || []) as Array<{ establishment_id: string; created_at: string; updated_at: string | null }>,
      paidRows: (paidRes.data || []) as Array<{ establishment_id: string; total: number; created_at: string }>,
      windowMinutes,
      stuckMinutes,
      minPaidOrders,
      ticketDropPercent,
    }).slice(0, maxAlertsPerRun);

    const intelligentAlertsUrl = Deno.env.get("INTELLIGENT_ALERTS_URL")
      || `${supabaseUrl}/functions/v1/intelligent-alerts`;

    const sent: Array<Record<string, unknown>> = [];
    const skipped: Array<Record<string, unknown>> = [];
    const failed: Array<Record<string, unknown>> = [];

    for (const candidate of candidates) {
      const inCooldown = await hasRecentAlert(
        supabase,
        candidate.establishment_id,
        candidate.kpi,
        cooldownMinutes,
      );
      if (inCooldown) {
        skipped.push({
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          reason: "cooldown",
        });
        continue;
      }

      if (dryRun) {
        sent.push({
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          dry_run: true,
        });
        continue;
      }

      try {
        const response = await sendToIntelligentAlerts(candidate, intelligentAlertsUrl, serviceRoleKey);
        sent.push({
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          response,
        });

        await safeInsertDispatchLog(supabase, {
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          alert_status: candidate.alert_status,
          metric_value: candidate.metric_value,
          reason: candidate.reason,
          payload: candidate.evidence || {},
          response,
          success: true,
        });
      } catch (error) {
        const errorMessage = normalizeError(error);
        failed.push({
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          error: errorMessage,
        });

        await safeInsertDispatchLog(supabase, {
          establishment_id: candidate.establishment_id,
          kpi: candidate.kpi,
          alert_status: candidate.alert_status,
          metric_value: candidate.metric_value,
          reason: candidate.reason,
          payload: candidate.evidence || {},
          success: false,
          error: errorMessage,
        });
      }
    }

    return jsonResponse({
      ok: true,
      dry_run: dryRun,
      candidates_found: candidates.length,
      sent_count: sent.length,
      skipped_count: skipped.length,
      failed_count: failed.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    const message = normalizeError(error);
    const status = message === "Detector nao autorizado" ? 401 : 500;
    return jsonResponse({
      ok: false,
      message: "Falha ao executar detector automatico",
      error: message,
    }, status);
  }
});
