import type { AlertPayload } from "./types.ts";
import { generateStrategicAlert } from "./services/llmService.ts";
import { sendTelegramAlert } from "./services/telegramService.ts";
import { buildAlertInsight } from "./services/insightsService.ts";

const REQUIRED_FIELDS: Array<keyof AlertPayload> = ["bar_id", "kpi", "value", "status"];

function hasAllRequiredFields(payload: AlertPayload): boolean {
  return REQUIRED_FIELDS.every((field) => {
    const value = payload[field];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
}

function buildFallbackMessage(payload: AlertPayload, strategicAction?: string, evidence?: string[]): string {
  const evidenceText = evidence && evidence.length > 0
    ? `Base: ${evidence.slice(0, 2).join(" | ")}`
    : `Base: KPI ${payload.kpi} em ${payload.value}`;
  return [
    "\u26A0\uFE0F Alerta operacional detectado",
    `Bar: ${payload.bar_id} | KPI: ${payload.kpi} | Valor: ${payload.value}. ${evidenceText}`,
    strategicAction ||
      "Acao: executar plano de contingencia de pico por 30 min e reavaliar indicador em 10 min.",
  ].join("\n");
}

function truncateToThreeLines(message: string): string {
  return message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("\n");
}

function verifyWebhookSecret(req: Request): void {
  const expectedSecret = Deno.env.get("ALERT_WEBHOOK_SECRET");
  if (!expectedSecret) return;

  const receivedSecret = req.headers.get("x-webhook-secret");
  if (!receivedSecret || receivedSecret !== expectedSecret) {
    throw new Error("Webhook nao autorizado");
  }
}

export async function handleSmartAlert(req: Request): Promise<Response> {
  verifyWebhookSecret(req);
  const payload = (await req.json()) as AlertPayload;

  if (!hasAllRequiredFields(payload)) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Payload invalido. Campos obrigatorios: bar_id, kpi, value, status",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const insight = await buildAlertInsight(payload);
  let message = buildFallbackMessage(payload, insight.strategicAction, insight.evidence);
  try {
    message = truncateToThreeLines(await generateStrategicAlert(payload, insight));
  } catch (error) {
    console.error("Falha no LLM. Usando fallback:", error);
  }

  await sendTelegramAlert(message);

  return new Response(
    JSON.stringify({
      ok: true,
      delivered: true,
      preview: message,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
