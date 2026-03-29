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

    if (error || !data || data.ativo !== true || !data.senha_hash) {
      return new Response(
        JSON.stringify({ ok: false, message: "Credenciais inválidas" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validHash = await bcrypt.compare(String(password), data.senha_hash);
    const validLegacy = data.senha_hash === String(password);
    if (!validHash && !validLegacy) {
      return new Response(
        JSON.stringify({ ok: false, message: "Credenciais inválidas" }),
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
