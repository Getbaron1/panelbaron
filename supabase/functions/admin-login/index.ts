import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ ok: false, message: "email e password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, nome, role, senha_hash, ativo")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("DB Error:", error);
      return new Response(
        JSON.stringify({ ok: false, message: "Erro de banco de dados", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuário não encontrado com este email" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isAtivo = data.ativo === true || String(data.ativo).toLowerCase() === "true" || data.ativo === 1;
    if (!isAtivo) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuário inativo", debugAtivo: data.ativo }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!data.senha_hash) {
      return new Response(
        JSON.stringify({ ok: false, message: "Usuário não possui senha configurada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let validHash = false;
    try {
      validHash = await bcrypt.compare(String(password), String(data.senha_hash));
    } catch (bcError) {
      console.warn("Bcrypt compare fail (probably plaintext format):", bcError);
    }

    const validLegacy = String(data.senha_hash).trim() === String(password).trim();
    if (!validHash && !validLegacy) {
      return new Response(
        JSON.stringify({ ok: false, message: "Senha incorreta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: data.id,
          email: data.email,
          nome: data.nome,
          role: data.role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro no admin-login:", error);
    return new Response(
      JSON.stringify({ ok: false, message: "Erro ao autenticar" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
