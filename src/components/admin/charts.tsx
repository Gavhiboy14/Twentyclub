"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, formatPrice } from "@/lib/utils";

/*
 * Una sola familia de color para todas las series: el crema de la marca en
 * distintas intensidades. Nada de paletas categóricas — las series de este
 * panel son magnitudes del mismo tipo, no categorías que compiten, y el peso
 * lo tiene que dar el valor, no el matiz.
 */
const CREAM = "#efe9dc";
const AXIS = "#807d76";
const GRID = "rgba(239,233,213,0.06)";

const axisProps = {
  stroke: AXIS,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  style: {
    fontFamily: "var(--font-manrope)",
    fontVariantNumeric: "tabular-nums",
  },
} as const;

function TooltipBox({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string | number;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3.5 py-2.5">
      <p className="numeric text-[0.625rem] uppercase tracking-[0.16em] text-ash">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="mt-1 text-[0.8125rem] font-medium text-chalk">
          {entry.name}:{" "}
          {formatter && typeof entry.value === "number"
            ? formatter(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export function OrdersTimeline({
  data,
}: {
  data: Array<{ date: string; pedidos: number; monto: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CREAM} stopOpacity={0.45} />
            <stop offset="100%" stopColor={CREAM} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} allowDecimals={false} width={34} />
        <Tooltip
          cursor={{ stroke: GRID }}
          content={<TooltipBox formatter={formatNumber} />}
        />
        <Area
          type="monotone"
          dataKey="pedidos"
          name="Pedidos"
          stroke={CREAM}
          strokeWidth={2}
          fill="url(#fillOrders)"
          dot={false}
          activeDot={{ r: 4, fill: CREAM, stroke: "#302f2b", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BrandSalesChart({
  data,
}: {
  data: Array<{ brand: string; units: number }>;
}) {
  const max = Math.max(...data.map((d) => d.units), 1);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} />
        <YAxis
          type="category"
          dataKey="brand"
          {...axisProps}
          width={86}
          style={{ fontFamily: "var(--font-manrope)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(239,233,213,0.04)" }}
          content={<TooltipBox formatter={formatNumber} />}
        />
        <Bar dataKey="units" name="Pares vendidos" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            // La opacidad codifica el ranking: la marca líder va sólida.
            <Cell
              key={i}
              fill={CREAM}
              fillOpacity={0.35 + 0.65 * (entry.units / max)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ViewsChart({
  data,
}: {
  data: Array<{ label: string; views: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          {...axisProps}
          tickFormatter={(v: string) => v.split(" ")[0]}
        />
        <YAxis {...axisProps} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(239,233,213,0.04)" }}
          content={<TooltipBox formatter={formatNumber} />}
        />
        <Bar
          dataKey="views"
          name="Visitas"
          fill={CREAM}
          fillOpacity={0.7}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { formatPrice };
