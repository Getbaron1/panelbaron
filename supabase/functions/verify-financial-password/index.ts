import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { establishment_id, password } = await req.json();

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Validar inputs
    if (!establishment_id || !password) {
      return new Response(
        JSON.stringify({ valid: false, message: "establishment_id e password são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar hash da senha armazenado em establishments
    const { data, error } = await supabase
      .from("establishments")
      .select("senha_painel_hash")
      .eq("id", establishment_id)
      .single();

    if (error) {
      console.error("Erro na query:", error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: "Erro ao buscar estabelecimento",
          error: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, message: "Estabelecimento não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar senha (comparação simples - em produção usar bcrypt)
    // Para segurança, é recomendado usar bcrypt aqui
    const isValid = data.password_hash === password;

    return new Response(
      JSON.stringify({
        valid: isValid,
        message: isValid ? "Acesso concedido" : "Senha incorreta",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    return new Response(
      JSON.stringify({ valid: false, message: "Erro ao verificar acesso" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
