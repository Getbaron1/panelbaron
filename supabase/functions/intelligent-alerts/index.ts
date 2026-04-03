import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleSmartAlert } from "./controller.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown_error";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Metodo nao permitido. Use POST." }, 405);
  }

  try {
    const response = await handleSmartAlert(req);
    return new Response(response.body, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = normalizeError(error);
    const status = message === "Webhook nao autorizado" ? 401 : 500;
    return jsonResponse(
      {
        ok: false,
        message: "Falha ao processar alerta inteligente",
        error: message,
      },
      status,
    );
  }
});
