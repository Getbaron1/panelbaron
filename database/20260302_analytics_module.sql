-- =====================================================
-- GetBaron Analytics Module (Gabigol)
-- Strict read-only analytics layer
-- =====================================================

-- 1) Product gross margin support (nullable by design)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2);

-- 2) Supporting indexes for peak-hour analytics reads
CREATE INDEX IF NOT EXISTS idx_orders_establishment_created_at
  ON public.orders (establishment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_payment_created_at
  ON public.orders (status, payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_product
  ON public.order_items (order_id, product_id);

CREATE INDEX IF NOT EXISTS idx_products_establishment_available
  ON public.products (establishment_id, available);

-- 3) Heatmap: hour x category (or product)
CREATE OR REPLACE FUNCTION public.analytics_heatmap(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL,
  p_dimension text DEFAULT 'category',
  p_metric text DEFAULT 'revenue',
  p_limit_products integer DEFAULT 10
)
RETURNS TABLE(
  bucket_hour timestamptz,
  hour_label text,
  bucket_label text,
  amount numeric
)
LANGUAGE sql
STABLE
AS $$
WITH paid_orders AS (
  SELECT o.id, o.created_at
  FROM public.orders o
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
    AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
),
base AS (
  SELECT
    date_trunc('hour', po.created_at) AS bucket_hour,
    CASE
      WHEN p_dimension = 'product' THEN COALESCE(pr.name, oi.product_name, 'Produto sem nome')
      ELSE COALESCE(c.name, 'Sem categoria')
    END AS bucket_label,
    CASE
      WHEN p_metric = 'quantity' THEN oi.quantity::numeric
      ELSE oi.total_price::numeric
    END AS metric_value
  FROM paid_orders po
  JOIN public.order_items oi ON oi.order_id = po.id
  LEFT JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.categories c ON c.id = pr.category_id
),
top_products AS (
  SELECT b.bucket_label
  FROM base b
  WHERE p_dimension = 'product'
  GROUP BY b.bucket_label
  ORDER BY SUM(b.metric_value) DESC
  LIMIT GREATEST(p_limit_products, 1)
)
SELECT
  b.bucket_hour,
  to_char(b.bucket_hour, 'HH24:00') AS hour_label,
  b.bucket_label,
  SUM(b.metric_value) AS amount
FROM base b
WHERE p_dimension <> 'product'
   OR b.bucket_label IN (SELECT tp.bucket_label FROM top_products tp)
GROUP BY b.bucket_hour, b.bucket_label
ORDER BY b.bucket_hour, amount DESC;
$$;

-- 4) Menu engineering matrix (BCG-like)
CREATE OR REPLACE FUNCTION public.analytics_menu_engineering(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  category_name text,
  quantity_sold numeric,
  gross_revenue numeric,
  avg_sale_price numeric,
  cost_price numeric,
  gross_margin_percent numeric,
  classification text
)
LANGUAGE sql
STABLE
AS $$
WITH paid_items AS (
  SELECT
    oi.product_id,
    COALESCE(pr.name, oi.product_name) AS product_name,
    c.name AS category_name,
    SUM(oi.quantity)::numeric AS quantity_sold,
    SUM(oi.total_price)::numeric AS gross_revenue,
    CASE WHEN SUM(oi.quantity) > 0
      THEN (SUM(oi.total_price) / SUM(oi.quantity))::numeric
      ELSE 0::numeric
    END AS avg_sale_price,
    pr.cost_price::numeric AS cost_price
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.products pr ON pr.id = oi.product_id
  LEFT JOIN public.categories c ON c.id = pr.category_id
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
    AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
  GROUP BY oi.product_id, COALESCE(pr.name, oi.product_name), c.name, pr.cost_price
),
scored AS (
  SELECT
    pi.*,
    CASE
      WHEN COALESCE(pi.avg_sale_price, 0) <= 0 THEN NULL
      WHEN pi.cost_price IS NULL THEN NULL
      ELSE ((pi.avg_sale_price - pi.cost_price) / NULLIF(pi.avg_sale_price, 0) * 100)::numeric
    END AS gross_margin_percent
  FROM paid_items pi
),
medians AS (
  SELECT
    percentile_cont(0.5) WITHIN GROUP (ORDER BY s.quantity_sold) AS median_qty,
    percentile_cont(0.5) WITHIN GROUP (
      ORDER BY COALESCE(s.gross_margin_percent, 0::numeric)
    ) AS median_margin
  FROM scored s
)
SELECT
  s.product_id,
  s.product_name,
  COALESCE(s.category_name, 'Sem categoria') AS category_name,
  s.quantity_sold,
  s.gross_revenue,
  s.avg_sale_price,
  s.cost_price,
  s.gross_margin_percent,
  CASE
    WHEN s.quantity_sold >= m.median_qty AND COALESCE(s.gross_margin_percent, 0) >= m.median_margin THEN 'star'
    WHEN s.quantity_sold >= m.median_qty AND COALESCE(s.gross_margin_percent, 0) < m.median_margin THEN 'workhorse'
    WHEN s.quantity_sold < m.median_qty AND COALESCE(s.gross_margin_percent, 0) >= m.median_margin THEN 'puzzle'
    ELSE 'dog'
  END AS classification
FROM scored s
CROSS JOIN medians m
ORDER BY s.gross_revenue DESC;
$$;

-- 5) Operational bottlenecks and stale products
CREATE OR REPLACE FUNCTION public.analytics_operational_alerts(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  avg_kds_minutes numeric,
  avg_order_to_delivery_minutes numeric,
  cancellation_refund_rate numeric,
  cancelled_paid_orders bigint,
  total_paid_orders bigint,
  total_paid_revenue numeric,
  qr_orders_count bigint,
  qr_orders_rate numeric,
  stalled_products_count bigint
)
LANGUAGE sql
STABLE
AS $$
WITH orders_in_range AS (
  SELECT o.*
  FROM public.orders o
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
),
kds AS (
  SELECT
    AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60.0)::numeric AS avg_kds_minutes,
    AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60.0)::numeric AS avg_order_to_delivery_minutes
  FROM orders_in_range o
  WHERE COALESCE(o.payment_status, '') IN ('paid', 'approved')
    AND COALESCE(o.status, '') IN ('completed', 'delivered', 'entregue')
),
cancel_rate AS (
  SELECT
    COUNT(*) FILTER (
      WHERE COALESCE(o.status, '') IN ('cancelled', 'canceled', 'cancelado')
    )::bigint AS cancelled_paid_orders,
    COUNT(*)::bigint AS total_paid_orders,
    COALESCE(SUM(o.total), 0)::numeric AS total_paid_revenue,
    COUNT(*) FILTER (
      WHERE
        COALESCE(lower(o.payment_method), '') IN ('qr', 'qrcode', 'pix_qr', 'pix-qr')
        OR COALESCE(lower(o.payment_method), '') LIKE '%qr%'
        OR COALESCE(o.order_code, '') ILIKE 'QR-%'
    )::bigint AS qr_orders_count,
    CASE WHEN COUNT(*) = 0 THEN 0::numeric
    ELSE (
      COUNT(*) FILTER (
        WHERE COALESCE(o.status, '') IN ('cancelled', 'canceled', 'cancelado')
      )::numeric / COUNT(*)::numeric
    ) * 100
    END AS cancellation_refund_rate
  FROM orders_in_range o
  WHERE COALESCE(o.payment_status, '') IN ('paid', 'approved')
),
sales_by_product AS (
  SELECT oi.product_id, SUM(oi.quantity)::numeric AS qty
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
    AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
  GROUP BY oi.product_id
),
stalled AS (
  SELECT COUNT(*)::bigint AS stalled_products_count
  FROM public.products p
  LEFT JOIN sales_by_product sbp ON sbp.product_id = p.id
  WHERE (p_establishment_id IS NULL OR p.establishment_id = p_establishment_id)
    AND COALESCE(p.available, false) = true
    AND COALESCE(sbp.qty, 0) = 0
)
SELECT
  COALESCE((SELECT avg_kds_minutes FROM kds), 0::numeric) AS avg_kds_minutes,
  COALESCE((SELECT avg_order_to_delivery_minutes FROM kds), 0::numeric) AS avg_order_to_delivery_minutes,
  COALESCE((SELECT cancellation_refund_rate FROM cancel_rate), 0::numeric) AS cancellation_refund_rate,
  COALESCE((SELECT cancelled_paid_orders FROM cancel_rate), 0::bigint) AS cancelled_paid_orders,
  COALESCE((SELECT total_paid_orders FROM cancel_rate), 0::bigint) AS total_paid_orders,
  COALESCE((SELECT total_paid_revenue FROM cancel_rate), 0::numeric) AS total_paid_revenue,
  COALESCE((SELECT qr_orders_count FROM cancel_rate), 0::bigint) AS qr_orders_count,
  CASE
    WHEN COALESCE((SELECT total_paid_orders FROM cancel_rate), 0) = 0 THEN 0::numeric
    ELSE (
      COALESCE((SELECT qr_orders_count FROM cancel_rate), 0)::numeric
      / NULLIF(COALESCE((SELECT total_paid_orders FROM cancel_rate), 0), 0)::numeric
    ) * 100
  END AS qr_orders_rate,
  COALESCE((SELECT stalled_products_count FROM stalled), 0::bigint) AS stalled_products_count;
$$;

CREATE OR REPLACE FUNCTION public.analytics_payment_mix(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  payment_method text,
  orders_count bigint,
  revenue numeric
)
LANGUAGE sql
STABLE
AS $$
SELECT
  COALESCE(NULLIF(o.payment_method, ''), 'indefinido') AS payment_method,
  COUNT(*)::bigint AS orders_count,
  COALESCE(SUM(o.total), 0)::numeric AS revenue
FROM public.orders o
WHERE o.created_at >= p_start
  AND o.created_at < p_end
  AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
  AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
GROUP BY COALESCE(NULLIF(o.payment_method, ''), 'indefinido')
ORDER BY revenue DESC;
$$;

CREATE OR REPLACE FUNCTION public.analytics_stalled_products(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 25
)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
WITH sales_by_product AS (
  SELECT oi.product_id, SUM(oi.quantity)::numeric AS qty
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
    AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
  GROUP BY oi.product_id
)
SELECT
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(c.name, 'Sem categoria') AS category_name
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id
LEFT JOIN sales_by_product sbp ON sbp.product_id = p.id
WHERE (p_establishment_id IS NULL OR p.establishment_id = p_establishment_id)
  AND COALESCE(p.available, false) = true
  AND COALESCE(sbp.qty, 0) = 0
ORDER BY p.name
LIMIT GREATEST(p_limit, 1);
$$;

-- 6) Ticket and recurrence
CREATE OR REPLACE FUNCTION public.analytics_ticket_timeseries(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  bucket_hour timestamptz,
  hour_label text,
  avg_ticket numeric,
  total_orders bigint
)
LANGUAGE sql
STABLE
AS $$
SELECT
  date_trunc('hour', o.created_at) AS bucket_hour,
  to_char(date_trunc('hour', o.created_at), 'HH24:00') AS hour_label,
  AVG(o.total)::numeric AS avg_ticket,
  COUNT(*)::bigint AS total_orders
FROM public.orders o
WHERE o.created_at >= p_start
  AND o.created_at < p_end
  AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
  AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
GROUP BY date_trunc('hour', o.created_at)
ORDER BY bucket_hour;
$$;

CREATE OR REPLACE FUNCTION public.analytics_recurrence(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  avg_orders_per_user_night numeric
)
LANGUAGE sql
STABLE
AS $$
WITH by_user_night AS (
  SELECT
    COALESCE(NULLIF(o.customer_id::text, ''), NULLIF(o.customer_phone, ''), 'anon:' || o.id::text) AS consumer_key,
    date_trunc('day', o.created_at) AS night_bucket,
    COUNT(*)::numeric AS orders_count
  FROM public.orders o
  WHERE o.created_at >= p_start
    AND o.created_at < p_end
    AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
    AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
  GROUP BY 1, 2
)
SELECT COALESCE(AVG(b.orders_count), 0::numeric) AS avg_orders_per_user_night
FROM by_user_night b;
$$;

-- 7) Raw export dataset
CREATE OR REPLACE FUNCTION public.analytics_export_dataset(
  p_start timestamptz,
  p_end timestamptz,
  p_establishment_id uuid DEFAULT NULL
)
RETURNS TABLE(
  order_id uuid,
  order_code text,
  establishment_id uuid,
  establishment_name text,
  created_at timestamptz,
  order_status text,
  payment_status text,
  customer_name text,
  customer_phone text,
  total numeric,
  product_id uuid,
  product_name text,
  quantity numeric,
  unit_price numeric,
  total_price numeric,
  category_name text
)
LANGUAGE sql
STABLE
AS $$
SELECT
  o.id AS order_id,
  o.order_code,
  o.establishment_id,
  e.name AS establishment_name,
  o.created_at,
  o.status AS order_status,
  o.payment_status,
  o.customer_name,
  o.customer_phone,
  o.total,
  oi.product_id,
  COALESCE(pr.name, oi.product_name) AS product_name,
  oi.quantity::numeric AS quantity,
  oi.unit_price::numeric AS unit_price,
  oi.total_price::numeric AS total_price,
  COALESCE(c.name, 'Sem categoria') AS category_name
FROM public.orders o
JOIN public.establishments e ON e.id = o.establishment_id
JOIN public.order_items oi ON oi.order_id = o.id
LEFT JOIN public.products pr ON pr.id = oi.product_id
LEFT JOIN public.categories c ON c.id = pr.category_id
WHERE o.created_at >= p_start
  AND o.created_at < p_end
  AND (p_establishment_id IS NULL OR o.establishment_id = p_establishment_id)
  AND COALESCE(o.payment_status, '') IN ('paid', 'approved')
ORDER BY o.created_at DESC;
$$;
