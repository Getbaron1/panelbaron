import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurado");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Query minima para validar conectividade com o banco.
    const { error } = await supabase
      .from("leads")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        db_check: 1,
        server_timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro no health check:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        message: "Health check falhou",
        error: error instanceof Error ? error.message : "unknown_error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});