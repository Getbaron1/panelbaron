import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Params = {
  start: string;
  end: string;
  establishmentId: string | null;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatError(error: unknown): string {
  if (!error) return "unknown_error";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    const anyErr = error as Record<string, unknown>;
    const fields = ["message", "details", "hint", "code"]
      .map((key) => anyErr[key])
      .filter(Boolean)
      .map(String);
    if (fields.length > 0) return fields.join(" | ");
    return JSON.stringify(error);
  } catch {
    return "unknown_error";
  }
}

function parseParams(url: URL): Params {
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  const establishmentId = url.searchParams.get("establishmentId");

  if (!start || !end) {
    throw new Error("Parametros obrigatorios: start e end");
  }

  return {
    start,
    end,
    establishmentId: establishmentId || null,
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) {
    return "order_id,created_at,total\n";
  }

  const headers = Object.keys(rows[0]);
  const csvHeader = headers.join(",");
  const csvRows = rows.map((row) =>
    headers
      .map((key) => {
        const raw = row[key];
        const cell = raw === null || raw === undefined ? "" : String(raw);
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );

  return [csvHeader, ...csvRows].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse(
      { ok: false, message: "Somente GET e permitido neste modulo (read-only)." },
      405,
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurado");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const rawPath = url.pathname.replace(/^\/functions\/v1\/analytics/, "");
    const queryEndpoint = (url.searchParams.get("endpoint") || "").replace(/^\/+/, "");
    const route = queryEndpoint
      ? `/api/v1/analytics/${queryEndpoint}`
      : (rawPath.startsWith("/api/v1/analytics/") ? rawPath : `/api/v1/analytics${rawPath}`);

    if (!route.startsWith("/api/v1/analytics/")) {
      return jsonResponse({ ok: false, message: "Rota invalida para analytics." }, 404);
    }

    const { start, end, establishmentId } = parseParams(url);

    if (route.endsWith("/overview")) {
      const [{ data: alerts, error: alertsError }, { data: recurrence, error: recurrenceError }] =
        await Promise.all([
          supabase.rpc("analytics_operational_alerts", {
            p_start: start,
            p_end: end,
            p_establishment_id: establishmentId,
          }),
          supabase.rpc("analytics_recurrence", {
            p_start: start,
            p_end: end,
            p_establishment_id: establishmentId,
          }),
        ]);

      if (alertsError) throw alertsError;
      if (recurrenceError) throw recurrenceError;

      const [alertsRow] = alerts || [];
      const [recurrenceRow] = recurrence || [];

      const { data: stalledProducts, error: stalledError } = await supabase.rpc("analytics_stalled_products", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
        p_limit: 20,
      });

      if (stalledError) throw stalledError;

      const { data: paymentMix, error: paymentMixError } = await supabase.rpc("analytics_payment_mix", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
      });

      if (paymentMixError) throw paymentMixError;

      return jsonResponse({
        ok: true,
        data: {
          avg_kds_minutes: Number(alertsRow?.avg_kds_minutes || 0),
          avg_order_to_delivery_minutes: Number(alertsRow?.avg_order_to_delivery_minutes || 0),
          cancellation_refund_rate: Number(alertsRow?.cancellation_refund_rate || 0),
          cancelled_paid_orders: Number(alertsRow?.cancelled_paid_orders || 0),
          total_paid_orders: Number(alertsRow?.total_paid_orders || 0),
          total_paid_revenue: Number(alertsRow?.total_paid_revenue || 0),
          qr_orders_count: Number(alertsRow?.qr_orders_count || 0),
          qr_orders_rate: Number(alertsRow?.qr_orders_rate || 0),
          stalled_products_count: Number(alertsRow?.stalled_products_count || 0),
          avg_orders_per_user_night: Number(recurrenceRow?.avg_orders_per_user_night || 0),
          stalled_products: stalledProducts || [],
          payment_mix: paymentMix || [],
        },
      });
    }

    if (route.endsWith("/heatmap")) {
      const dimension = (url.searchParams.get("dimension") || "category").toLowerCase();
      const metric = (url.searchParams.get("metric") || "revenue").toLowerCase();
      const limitProducts = Number(url.searchParams.get("limitProducts") || "10");

      const { data, error } = await supabase.rpc("analytics_heatmap", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
        p_dimension: dimension === "product" ? "product" : "category",
        p_metric: metric === "quantity" ? "quantity" : "revenue",
        p_limit_products: Number.isFinite(limitProducts) ? limitProducts : 10,
      });

      if (error) throw error;

      return jsonResponse({ ok: true, data: data || [] });
    }

    if (route.endsWith("/menu-engineering")) {
      const { data, error } = await supabase.rpc("analytics_menu_engineering", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
      });

      if (error) throw error;

      return jsonResponse({ ok: true, data: data || [] });
    }

    if (route.endsWith("/ticket-recorrencia")) {
      const { data, error } = await supabase.rpc("analytics_ticket_timeseries", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
      });

      if (error) throw error;

      return jsonResponse({ ok: true, data: data || [] });
    }

    if (route.endsWith("/export.csv")) {
      const { data, error } = await supabase.rpc("analytics_export_dataset", {
        p_start: start,
        p_end: end,
        p_establishment_id: establishmentId,
      });

      if (error) throw error;

      const csv = toCsv((data as Record<string, unknown>[]) || []);
      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analytics_${Date.now()}.csv"`,
        },
      });
    }

    return jsonResponse({ ok: false, message: "Endpoint analytics nao encontrado." }, 404);
  } catch (error) {
    console.error("Erro no analytics:", error);
    return jsonResponse(
      {
        ok: false,
        message: "Falha ao consultar analytics",
        error: formatError(error),
      },
      500,
    );
  }
});
