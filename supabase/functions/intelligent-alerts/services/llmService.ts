import axios from "npm:axios@1.8.4";
import type { AlertInsight, AlertPayload, LlmProvider } from "../types.ts";
import { SYSTEM_PROMPT } from "../brain/prompt.ts";

type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  timeoutMs: number;
};

function resolveProvider(raw: string | undefined): LlmProvider {
  return raw?.toLowerCase() === "gemini" ? "gemini" : "openai";
}

export function getLlmConfig(): LlmConfig {
  const provider = resolveProvider(Deno.env.get("LLM_PROVIDER"));
  const apiKey = Deno.env.get("LLM_API_KEY") || "";
  const timeoutMs = Number(Deno.env.get("LLM_TIMEOUT_MS") || "8000");
  const openAiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
  const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error("LLM_API_KEY nao configurada");
  }

  return {
    provider,
    apiKey,
    model: provider === "gemini" ? geminiModel : openAiModel,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 8000,
  };
}

function buildUserPrompt(payload: AlertPayload, insight: AlertInsight): string {
  const summary = {
    confidence: insight.confidence,
    current_orders: insight.current?.total_paid_orders ?? 0,
    current_kds_minutes: insight.current?.avg_kds_minutes ?? 0,
    current_cancel_rate: insight.current?.cancellation_refund_rate ?? 0,
    current_revenue: insight.current?.total_paid_revenue ?? 0,
    delta_kds_vs_prev_pct: insight.kdsDeltaVsPreviousPercent,
    delta_kds_vs_yesterday_pct: insight.kdsDeltaVsYesterdayPercent,
    delta_ticket_vs_prev_pct: insight.ticketDeltaPercent,
    delta_ticket_vs_yesterday_pct: insight.ticketDeltaVsYesterdayPercent,
    delta_revenue_vs_yesterday_pct: insight.revenueDeltaVsYesterdayPercent,
    delta_orders_vs_yesterday_pct: insight.ordersDeltaVsYesterdayPercent,
  };

  return [
    "Dados do alerta bruto:",
    JSON.stringify(payload),
    "",
    "Resumo executivo para decisao:",
    JSON.stringify(summary),
    "",
    "Contexto oficial calculado via analytics:",
    JSON.stringify(insight),
    "",
    "Se confidence=low, nao invente causa; peça validacao de dados e janela maior.",
    "Use os dados para produzir acao cirurgica e objetiva.",
  ].join("\n");
}

function hasMinimumQuality(message: string): boolean {
  const lines = message.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const hasNumber = /\d/.test(message);
  const hasActionVerb = /(ativar|pausar|bloquear|separar|aplicar|executar|priorizar|oferecer)/i.test(message);
  return lines.length >= 2 && lines.length <= 3 && hasNumber && hasActionVerb;
}

async function generateWithOpenAI(config: LlmConfig, payload: AlertPayload, insight: AlertInsight): Promise<string> {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: config.model,
      temperature: 0.2,
      max_tokens: 140,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(payload, insight) },
      ],
    },
    {
      timeout: config.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
    },
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Resposta vazia do OpenAI");
  }
  return content.trim();
}

async function generateWithGemini(config: LlmConfig, payload: AlertPayload, insight: AlertInsight): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const response = await axios.post(
    url,
    {
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 140,
      },
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(payload, insight)}` }] }],
    },
    {
      timeout: config.timeoutMs,
      headers: { "Content-Type": "application/json" },
    },
  );

  const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content || typeof content !== "string") {
    throw new Error("Resposta vazia do Gemini");
  }
  return content.trim();
}

export async function generateStrategicAlert(payload: AlertPayload, insight: AlertInsight): Promise<string> {
  const config = getLlmConfig();
  const message = config.provider === "gemini"
    ? await generateWithGemini(config, payload, insight)
    : await generateWithOpenAI(config, payload, insight);

  if (!hasMinimumQuality(message)) {
    throw new Error("Resposta do LLM sem qualidade minima");
  }
  return message;
}
