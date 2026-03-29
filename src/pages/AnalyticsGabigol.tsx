import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Loader2,
  Printer,
  RefreshCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  exportAnalyticsCsv,
  getAnalyticsEstablishments,
  getAnalyticsHeatmap,
  getAnalyticsMenuEngineering,
  getAnalyticsOverview,
  getAnalyticsTicketSeries,
  type HeatmapCell,
  type MenuEngineeringRow,
  type OverviewData,
  type TicketSeriesRow,
} from "@/lib/analyticsService";

type HeatmapDimension = "category" | "product";
type HeatmapMetric = "revenue" | "quantity";
type Preset = "last_30_days" | "last_friday_night";
type HeatmapMatrixRow = { label: string; values: Record<string, number> };

function toLocalInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function getLastFridayNightRange(now: Date): { start: Date; end: Date } {
  const base = new Date(now);
  const day = base.getDay();
  const delta = (day + 2) % 7 || 7;
  base.setDate(base.getDate() - delta);
  const start = new Date(base);
  start.setHours(22, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(5, 0, 0, 0);
  return { start, end };
}

function getPresetRange(preset: Preset): { start: string; end: string } {
  const now = new Date();
  if (preset === "last_friday_night") {
    const { start, end } = getLastFridayNightRange(now);
    return { start: toLocalInputValue(start), end: toLocalInputValue(end) };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  return { start: toLocalInputValue(start), end: toLocalInputValue(now) };
}

function heatColor(value: number, max: number): string {
  if (value <= 0 || max <= 0) return "hsl(0 0% 96%)";
  const intensity = Math.min(value / max, 1);
  return `hsla(0, 84%, 50%, ${0.08 + intensity * 0.75})`;
}

function statusForKds(minutes: number): "success" | "warning" | "danger" {
  if (minutes > 18) return "danger";
  if (minutes > 12) return "warning";
  return "success";
}

function statusForCancellation(rate: number): "success" | "warning" | "danger" {
  if (rate > 8) return "danger";
  if (rate > 4) return "warning";
  return "success";
}

function formatPaymentMethodLabel(raw: string): string {
  const value = (raw || "").trim().toLowerCase();
  if (!value) return "Indefinido";
  if (["pix", "pix_qr", "pix-qr", "qrcode", "qr"].includes(value)) return "PIX / QR";
  if (["credit_card", "cartao_credito", "credito"].includes(value)) return "Cartao de Credito";
  if (["debit_card", "cartao_debito", "debito"].includes(value)) return "Cartao de Debito";
  if (value === "cash") return "Dinheiro";
  return raw;
}

function buildHeatmapMatrix(cells: HeatmapCell[]): {
  hours: string[];
  rows: HeatmapMatrixRow[];
  maxValue: number;
} {
  const unique = new Map<string, string>();
  cells.forEach((cell) => unique.set(cell.bucket_hour, cell.hour_label));
  const hours = Array.from(unique.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1]);

  const rowMap = new Map<string, Record<string, number>>();
  cells.forEach((cell) => {
    if (!rowMap.has(cell.bucket_label)) rowMap.set(cell.bucket_label, {});
    rowMap.get(cell.bucket_label)![cell.hour_label] = Number(cell.amount || 0);
  });

  return {
    hours,
    rows: Array.from(rowMap.entries()).map(([label, values]) => ({ label, values })),
    maxValue: Math.max(0, ...cells.map((cell) => Number(cell.amount || 0))),
  };
}

export default function AnalyticsGabigol() {
  const [preset, setPreset] = useState<Preset>("last_30_days");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [establishmentId, setEstablishmentId] = useState<string>("");
  const [heatmapDimension, setHeatmapDimension] = useState<HeatmapDimension>("category");
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("revenue");
  const [focusHour, setFocusHour] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [customHeatmap, setCustomHeatmap] = useState<HeatmapCell[]>([]);
  const [productHeatmapQty, setProductHeatmapQty] = useState<HeatmapCell[]>([]);
  const [categoryHeatmapRevenue, setCategoryHeatmapRevenue] = useState<HeatmapCell[]>([]);
  const [menuData, setMenuData] = useState<MenuEngineeringRow[]>([]);
  const [ticketSeries, setTicketSeries] = useState<TicketSeriesRow[]>([]);
  const [establishments, setEstablishments] = useState<Array<{ id: string; name: string }>>([]);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const presetRange = getPresetRange("last_30_days");
    setStart(presetRange.start);
    setEnd(presetRange.end);
    void loadEstablishments();
  }, []);

  useEffect(() => {
    if (!start || !end) return;
    void loadAnalytics();
  }, [start, end, establishmentId, heatmapDimension, heatmapMetric]);

  async function loadEstablishments() {
    try {
      const data = await getAnalyticsEstablishments();
      setEstablishments((data || []).map((item) => ({ id: item.id, name: item.name })));
    } catch {
      setEstablishments([]);
    }
  }

  function buildFilters() {
    return {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      establishmentId: establishmentId || null,
    };
  }

  async function loadAnalytics() {
    if (!start || !end) return;
    if (new Date(start) >= new Date(end)) {
      setError("Periodo invalido: a data final deve ser maior que a inicial.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filters = buildFilters();
      const [overviewRes, customHeatmapRes, productHeatmapRes, categoryHeatmapRes, menuRes, ticketRes] =
        await Promise.all([
        getAnalyticsOverview(filters),
        getAnalyticsHeatmap(filters, { dimension: heatmapDimension, metric: heatmapMetric }),
        getAnalyticsHeatmap(filters, { dimension: "product", metric: "quantity" }),
        getAnalyticsHeatmap(filters, { dimension: "category", metric: "revenue" }),
        getAnalyticsMenuEngineering(filters),
        getAnalyticsTicketSeries(filters),
        ]);

      setOverview(overviewRes);
      setCustomHeatmap(customHeatmapRes);
      setProductHeatmapQty(productHeatmapRes);
      setCategoryHeatmapRevenue(categoryHeatmapRes);
      setMenuData(menuRes);
      setTicketSeries(ticketRes);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar analytics.");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(nextPreset: Preset) {
    setPreset(nextPreset);
    const range = getPresetRange(nextPreset);
    setStart(range.start);
    setEnd(range.end);
  }

  async function handleExportCsv() {
    try {
      setLoadingExport(true);
      await exportAnalyticsCsv(buildFilters());
    } catch (err: any) {
      setError(err?.message || "Falha na exportacao CSV.");
    } finally {
      setLoadingExport(false);
    }
  }

  function handleExportPdf() {
    if (!reportRef.current) return;
    const reportHtml = reportRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join("");

    const printWindow = window.open("", "_blank", "width=1440,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>GetBaron - Painel do Consultor</title>
          ${styles}
          <style>
            body { padding: 24px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>${reportHtml}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }

  const customMatrix = useMemo(() => buildHeatmapMatrix(customHeatmap), [customHeatmap]);
  const productQtyMatrix = useMemo(() => buildHeatmapMatrix(productHeatmapQty), [productHeatmapQty]);
  const categoryRevenueMatrix = useMemo(
    () => buildHeatmapMatrix(categoryHeatmapRevenue),
    [categoryHeatmapRevenue],
  );

  const menuAverages = useMemo(() => {
    if (!menuData.length) return { avgVolume: 0, avgMargin: 0 };
    const avgVolume = menuData.reduce((acc, item) => acc + Number(item.quantity_sold || 0), 0) / menuData.length;
    const avgMargin =
      menuData.reduce((acc, item) => acc + Number(item.gross_margin_percent || 0), 0) / menuData.length;
    return { avgVolume, avgMargin };
  }, [menuData]);

  const classificationMeta = {
    star: { label: "Estrela", color: "hsl(142 76% 36%)" },
    workhorse: { label: "Cavalo de Batalha", color: "hsl(38 92% 50%)" },
    puzzle: { label: "Quebra-cabeca", color: "hsl(220 70% 50%)" },
    dog: { label: "Cachorro", color: "hsl(0 84% 50%)" },
  };

  const productLeaderByHour = useMemo(() => {
    const byHour = new Map<string, { product: string; qty: number }>();
    for (const cell of productHeatmapQty) {
      const hour = cell.hour_label;
      const current = byHour.get(hour);
      const qty = Number(cell.amount || 0);
      if (!current || qty > current.qty) {
        byHour.set(hour, { product: cell.bucket_label, qty });
      }
    }
    return Array.from(byHour.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, payload]) => ({ hour, ...payload }));
  }, [productHeatmapQty]);

  const opportunityRanking = useMemo(() => {
    if (!menuData.length) return [];
    const maxQty = Math.max(...menuData.map((row) => Number(row.quantity_sold || 0)), 1);
    const maxMargin = Math.max(
      ...menuData.map((row) => Number(row.gross_margin_percent || 0)),
      1,
    );
    return menuData
      .map((row) => {
        const qtyNorm = (Number(row.quantity_sold || 0) / maxQty) * 100;
        const marginNorm = (Number(row.gross_margin_percent || 0) / maxMargin) * 100;
        const score = qtyNorm * 0.55 + marginNorm * 0.45;
        return { ...row, opportunity_score: score };
      })
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 10);
  }, [menuData]);

  const topVolume = useMemo(
    () =>
      [...menuData]
        .sort((a, b) => Number(b.quantity_sold || 0) - Number(a.quantity_sold || 0))
        .slice(0, 8),
    [menuData],
  );

  const topMargin = useMemo(
    () =>
      [...menuData]
        .filter((row) => row.gross_margin_percent !== null)
        .sort((a, b) => Number(b.gross_margin_percent || 0) - Number(a.gross_margin_percent || 0))
        .slice(0, 8),
    [menuData],
  );

  const ticketPulse = useMemo(
    () =>
      ticketSeries.map((row) => ({
        ...row,
        revenue_proxy: Number(row.avg_ticket || 0) * Number(row.total_orders || 0),
      })),
    [ticketSeries],
  );

  const paymentMixChartData = useMemo(
    () =>
      (overview?.payment_mix || []).map((item) => ({
        ...item,
        payment_method_label: formatPaymentMethodLabel(item.payment_method),
      })),
    [overview],
  );

  const selectedName = establishments.find((est) => est.id === establishmentId)?.name;
  const focusHourOptions = customMatrix.hours;

  const topProductsAtFocusHour = useMemo(() => {
    if (focusHour === "all") return [];
    return productHeatmapQty
      .filter((item) => item.hour_label === focusHour)
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 5);
  }, [focusHour, productHeatmapQty]);

  const topCategoriesAtFocusHour = useMemo(() => {
    if (focusHour === "all") return [];
    return categoryHeatmapRevenue
      .filter((item) => item.hour_label === focusHour)
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 5);
  }, [focusHour, categoryHeatmapRevenue]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel do Consultor (Modulo Gabigol)</h1>
          <p className="text-sm text-muted-foreground">
            Inteligencia operacional e engenharia de cardapio em modo estritamente read-only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" onClick={() => void loadAnalytics()} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="primary" onClick={() => void handleExportCsv()} disabled={loadingExport}>
            {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/15 via-card to-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">BI COMMAND CENTER</p>
            </div>
            <h2 className="text-xl font-bold">Painel de inteligencia para decisoes em tempo de balada</h2>
            <p className="text-sm text-muted-foreground">
              Leitura integrada de consumo por hora, produtos lideres, margem e gargalos operacionais.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Badge variant="primary">Heatmap horario</Badge>
            <Badge variant="warning">Engenharia BCG</Badge>
            <Badge variant="success">Ticket e recorrencia</Badge>
            <Badge variant="danger">Alertas operacionais</Badge>
          </div>
        </div>
      </Card>

      <Card className="no-print">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Preset</label>
            <select
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
              value={preset}
              onChange={(event) => applyPreset(event.target.value as Preset)}
            >
              <option value="last_30_days">Ultimos 30 dias</option>
              <option value="last_friday_night">Sexta passada (22h-05h)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Inicio</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fim</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Estabelecimento</label>
            <select
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
              value={establishmentId}
              onChange={(event) => setEstablishmentId(event.target.value)}
            >
              <option value="">Todos</option>
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Heatmap por</label>
            <select
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
              value={heatmapDimension}
              onChange={(event) => setHeatmapDimension(event.target.value as HeatmapDimension)}
            >
              <option value="category">Categoria</option>
              <option value="product">Top 10 Produtos</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Intensidade</label>
            <select
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
              value={heatmapMetric}
              onChange={(event) => setHeatmapMetric(event.target.value as HeatmapMetric)}
            >
              <option value="revenue">Volume R$</option>
              <option value="quantity">Quantidade</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hora foco</label>
            <select
              className="h-10 w-full rounded-xl border border-border/50 bg-muted/40 px-3 text-sm"
              value={focusHour}
              onChange={(event) => setFocusHour(event.target.value)}
            >
              <option value="all">Todas</option>
              {focusHourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div ref={reportRef} id="gabigol-dashboard" className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Periodo: {new Date(start || Date.now()).toLocaleString("pt-BR")}</Badge>
          <Badge variant="default">ate {new Date(end || Date.now()).toLocaleString("pt-BR")}</Badge>
          {selectedName && <Badge variant="warning">Estabelecimento: {selectedName}</Badge>}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando dados analiticos...</span>
          </div>
        )}

        {error && (
          <Card>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {!loading && !error && overview && (
          <>
            <Card title="Leitura Rapida (modo consultor)">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/50 p-3">
                  <p className="text-xs uppercase text-muted-foreground">1. Operacao</p>
                  <p className="mt-1 text-sm">Comece em Gargalo KDS e Tempo pedido-entrega. Se vermelho, acione cozinha/expedicao.</p>
                </div>
                <div className="rounded-xl border border-border/50 p-3">
                  <p className="text-xs uppercase text-muted-foreground">2. Hora foco</p>
                  <p className="mt-1 text-sm">Selecione a hora foco para ver o que mais gira e o que mais fatura naquele momento.</p>
                </div>
                <div className="rounded-xl border border-border/50 p-3">
                  <p className="text-xs uppercase text-muted-foreground">3. Lucro</p>
                  <p className="mt-1 text-sm">Cruze Top Saida com Top Margem para decidir destaque e promoção de cardapio.</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Gargalo KDS</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold">{overview.avg_kds_minutes.toFixed(1)} min</p>
                  <Badge variant={statusForKds(overview.avg_kds_minutes)}>
                    {statusForKds(overview.avg_kds_minutes) === "danger"
                      ? "Vermelho"
                      : statusForKds(overview.avg_kds_minutes) === "warning"
                        ? "Amarelo"
                        : "Verde"}
                  </Badge>
                </div>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cancelamento / Estorno</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold">{overview.cancellation_refund_rate.toFixed(2)}%</p>
                  <Badge variant={statusForCancellation(overview.cancellation_refund_rate)}>
                    {statusForCancellation(overview.cancellation_refund_rate) === "danger"
                      ? "Vermelho"
                      : statusForCancellation(overview.cancellation_refund_rate) === "warning"
                        ? "Amarelo"
                        : "Verde"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.cancelled_paid_orders} de {overview.total_paid_orders} pedidos pagos
                </p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Produtos Encalhados</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold">{overview.stalled_products_count}</p>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Recorrencia</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold">{overview.avg_orders_per_user_night.toFixed(2)}</p>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">pedidos por usuario/noite</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Faturamento (pedidos pagos)</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(overview.total_paid_revenue)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{overview.total_paid_orders} pedidos pagos</p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos via QR</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-semibold">{overview.qr_orders_count}</p>
                  <Badge variant="primary">{overview.qr_orders_rate.toFixed(1)}%</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">identificados por payment_method/order_code</p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tempo pedido - entrega</p>
                <p className="mt-2 text-2xl font-semibold">{overview.avg_order_to_delivery_minutes.toFixed(1)} min</p>
                <p className="mt-1 text-xs text-muted-foreground">proxy com created_at - updated_at</p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Base de cancelamento</p>
                <p className="mt-2 text-2xl font-semibold">{overview.total_paid_orders}</p>
                <p className="mt-1 text-xs text-muted-foreground">somente pedidos com pagamento aprovado/pago</p>
              </Card>
            </div>

            <Card title="Faturamento e Pedidos por Metodo de Pagamento">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentMixChartData} barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="payment_method_label" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tickFormatter={(value) => `R$ ${value}`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: number, key: string) => {
                        if (key === "revenue") return [formatCurrency(Number(value)), "Faturamento"];
                        return [Number(value).toFixed(0), "Pedidos"];
                      }}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="hsl(0 84% 50%)"
                      radius={[8, 8, 0, 0]}
                      name="Faturamento (R$)"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders_count"
                      fill="hsl(220 70% 50%)"
                      radius={[8, 8, 0, 0]}
                      name="Pedidos (qtd)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Vermelho: faturamento em reais. Azul: quantidade de pedidos.
              </p>
            </Card>

            {focusHour !== "all" && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card title={`Hora foco ${focusHour} - Top Produtos (quantidade)`}>
                  <div className="space-y-2">
                    {topProductsAtFocusHour.map((item) => (
                      <div key={`${item.bucket_label}-${item.hour_label}`} className="rounded-xl border border-border/50 p-3">
                        <p className="text-sm font-medium">{item.bucket_label}</p>
                        <p className="text-xs text-muted-foreground">{Number(item.amount || 0).toFixed(0)} unidades</p>
                      </div>
                    ))}
                    {topProductsAtFocusHour.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem vendas registradas nesse horario.</p>
                    )}
                  </div>
                </Card>

                <Card title={`Hora foco ${focusHour} - Top Categorias (R$)`}>
                  <div className="space-y-2">
                    {topCategoriesAtFocusHour.map((item) => (
                      <div key={`${item.bucket_label}-${item.hour_label}`} className="rounded-xl border border-border/50 p-3">
                        <p className="text-sm font-medium">{item.bucket_label}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(item.amount || 0))}</p>
                      </div>
                    ))}
                    {topCategoriesAtFocusHour.length === 0 && (
                      <p className="text-sm text-muted-foreground">Sem faturamento registrado nesse horario.</p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className="xl:col-span-3" title="Mapa de Calor de Consumo">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-muted-foreground">
                          {heatmapDimension === "category" ? "Categoria" : "Produto"}
                        </th>
                        {customMatrix.hours.map((hour) => (
                          <th
                            key={hour}
                            className={`px-2 py-2 text-center text-xs text-muted-foreground ${
                              focusHour === hour ? "bg-primary/10 font-semibold text-primary" : ""
                            }`}
                          >
                            {hour}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customMatrix.rows.map((row) => (
                        <tr key={row.label}>
                          <td className="border-t border-border/50 px-2 py-2 text-sm font-medium">{row.label}</td>
                          {customMatrix.hours.map((hour) => {
                            const value = Number(row.values[hour] || 0);
                            const intensity = heatColor(value, customMatrix.maxValue);
                            return (
                              <td
                                key={`${row.label}-${hour}`}
                                className={`border-t border-border/50 px-2 py-2 text-center text-xs ${
                                  focusHour === hour ? "ring-1 ring-primary/60" : ""
                                }`}
                                style={{ backgroundColor: intensity }}
                              >
                                {heatmapMetric === "revenue" ? formatCurrency(value) : value.toFixed(0)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="xl:col-span-2" title="Dominancia por Hora (Top produto por faixa)">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productLeaderByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, key: string, payload: any) => {
                          if (key === "qty") return [Number(value).toFixed(0), "Qtde vendida"];
                          return [value, key];
                        }}
                        labelFormatter={(label) => {
                          const row = productLeaderByHour.find((item) => item.hour === label);
                          return `${label} - Lider: ${row?.product || "-"}`;
                        }}
                      />
                      <Bar dataKey="qty" radius={[8, 8, 0, 0]}>
                        {productLeaderByHour.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={`hsla(0, 84%, 50%, ${0.4 + (idx % 4) * 0.12})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className="xl:col-span-3" title="Mapa de Calor Categoria x Hora (R$)">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-muted-foreground">Categoria</th>
                        {categoryRevenueMatrix.hours.map((hour) => (
                          <th key={hour} className="px-2 py-2 text-center text-xs text-muted-foreground">
                            {hour}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRevenueMatrix.rows.map((row) => (
                        <tr key={row.label}>
                          <td className="border-t border-border/50 px-2 py-2 text-sm font-medium">{row.label}</td>
                          {categoryRevenueMatrix.hours.map((hour) => {
                            const value = Number(row.values[hour] || 0);
                            return (
                              <td
                                key={`${row.label}-${hour}`}
                                className="border-t border-border/50 px-2 py-2 text-center text-xs"
                                style={{ backgroundColor: heatColor(value, categoryRevenueMatrix.maxValue) }}
                              >
                                {formatCurrency(value)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="xl:col-span-2" title="Produtos Encalhados (Top 20)">
                <div className="space-y-2">
                  {(overview.stalled_products || []).slice(0, 20).map((item) => (
                    <div key={item.product_id} className="rounded-xl border border-border/50 p-3">
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.category_name}</p>
                    </div>
                  ))}
                  {!overview.stalled_products?.length && (
                    <p className="text-sm text-muted-foreground">Nenhum produto encalhado no periodo.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <Card className="xl:col-span-3" title="Matriz de Engenharia de Cardapio (BCG)">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="quantity_sold"
                        name="Volume"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        type="number"
                        dataKey="gross_margin_percent"
                        name="Margem Bruta (%)"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value: number, key: string) => {
                          if (key === "gross_margin_percent") return [`${Number(value).toFixed(2)}%`, "Margem"];
                          if (key === "gross_revenue") return [formatCurrency(Number(value)), "Receita"];
                          return [Number(value).toFixed(0), "Quantidade"];
                        }}
                      />
                      <Legend />
                      {(Object.keys(classificationMeta) as Array<keyof typeof classificationMeta>).map((key) => (
                        <Scatter
                          key={key}
                          name={classificationMeta[key].label}
                          data={menuData.filter((item) => item.classification === key)}
                          fill={classificationMeta[key].color}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Referencia interna: volume medio {menuAverages.avgVolume.toFixed(1)} e margem media{" "}
                  {menuAverages.avgMargin.toFixed(1)}%.
                </p>
              </Card>

              <Card className="xl:col-span-2" title="Ranking de Oportunidade (saida + margem)">
                <div className="space-y-2">
                  {opportunityRanking.map((row) => (
                    <div key={`${row.product_id}-${row.product_name}`} className="rounded-xl border border-border/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{row.product_name}</p>
                        <Badge variant="default">Score {row.opportunity_score.toFixed(1)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.quantity_sold.toFixed(0)} und | margem{" "}
                        {row.gross_margin_percent !== null ? `${row.gross_margin_percent.toFixed(2)}%` : "N/D"}
                      </p>
                      <p className="mt-1 text-xs text-primary">
                        Classe: {classificationMeta[row.classification].label}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card title="Top Produtos por Saida (Qtde)">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topVolume} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="product_name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [Number(value).toFixed(0), "Quantidade"]} />
                      <Bar dataKey="quantity_sold" fill="hsl(0 84% 50%)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Top Produtos por Margem (%)">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMargin} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="product_name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Margem"]} />
                      <Bar dataKey="gross_margin_percent" fill="hsl(142 76% 36%)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card title="Ticket Medio, Pedidos e Pulso de Receita por Hora">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketPulse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour_label" />
                    <YAxis yAxisId="left" tickFormatter={(value) => `R$ ${value}`} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value: number, key: string) => {
                        if (key === "avg_ticket") return [formatCurrency(Number(value)), "Ticket medio"];
                        if (key === "revenue_proxy") return [formatCurrency(Number(value)), "Pulso de receita"];
                        return [Number(value).toFixed(0), "Pedidos"];
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue_proxy"
                      fill="hsla(0, 84%, 50%, 0.2)"
                      stroke="hsl(0 84% 50%)"
                      strokeWidth={1.5}
                      name="Pulso de receita"
                    />
                    <Line type="monotone" dataKey="avg_ticket" stroke="hsl(0 84% 50%)" strokeWidth={2} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="total_orders"
                      stroke="hsl(220 70% 50%)"
                      strokeWidth={2}
                      name="Pedidos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
