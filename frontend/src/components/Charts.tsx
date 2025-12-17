"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Modern color palettes
const COLORS = {
  primary: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  vibrant: ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#22c55e", "#3b82f6"],
  gradient: {
    green: ["rgba(16, 185, 129, 0.8)", "rgba(16, 185, 129, 0.1)"],
    blue: ["rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.1)"],
    purple: ["rgba(139, 92, 246, 0.8)", "rgba(139, 92, 246, 0.1)"],
  },
};

export interface StatusCount {
  status: string;
  count: string | number;
}

export function StatusBarChart({
  title,
  data,
  horizontal = false,
  showValues = true,
}: {
  title?: string;
  data: StatusCount[];
  horizontal?: boolean;
  showValues?: boolean;
}) {
  if (!data || !data.length) return null;

  const labels = data.map((s) => s.status);
  const values = data.map((s) => Number(s.count || 0));

  // Generate gradient colors for each bar
  const backgroundColors = data.map((_, i) => COLORS.vibrant[i % COLORS.vibrant.length]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Count",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: horizontal ? ("y" as const) : ("x" as const),
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleFont: { size: 12, weight: "bold" as const },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.raw?.toLocaleString("en-NG") ?? ctx.raw;
            return ` ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: !horizontal,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: { size: 11 },
          color: "#6b7280",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: horizontal,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          precision: 0,
          font: { size: 11 },
          color: "#6b7280",
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm font-semibold text-gray-700">{title}</div>
      )}
      <div className={horizontal ? "h-48" : "h-64"}>
        <Bar data={chartData} options={options} />
      </div>
      {showValues && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((item, i) => (
            <div
              key={item.status}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.vibrant[i % COLORS.vibrant.length] }}
              />
              <span className="text-gray-600 capitalize">{item.status}</span>
              <span className="font-semibold text-gray-800">
                {Number(item.count).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RevenueBySourcePie({
  labels,
  values,
  title,
}: {
  labels: string[];
  values: number[];
  title?: string;
}) {
  if (!labels.length || !values.length) return null;

  const total = values.reduce((a, b) => a + b, 0);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS.vibrant,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const value = Number(ctx.raw || 0).toLocaleString("en-NG", {
              maximumFractionDigits: 2,
            });
            const percent = ((ctx.raw / total) * 100).toFixed(1);
            return ` ₦${value} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm font-semibold text-gray-700">{title}</div>
      )}
      <div className="flex items-center gap-6">
        <div className="relative h-48 w-48 flex-shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-bold text-gray-800">
              ₦{(total / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {labels.map((label, i) => {
            const percent = ((values[i] / total) * 100).toFixed(1);
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS.vibrant[i % COLORS.vibrant.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 truncate">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{percent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: COLORS.vibrant[i % COLORS.vibrant.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Modern Donut Chart with center stats
export function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
}: {
  data: StatusCount[];
  title?: string;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  if (!data || !data.length) return null;

  const labels = data.map((s) => s.status);
  const values = data.map((s) => Number(s.count || 0));
  const total = values.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS.vibrant,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const percent = ((ctx.raw / total) * 100).toFixed(1);
            return ` ${ctx.raw.toLocaleString()} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm font-semibold text-gray-700">{title}</div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative h-36 w-36 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-500 uppercase">{centerLabel || "Total"}</div>
            <div className="text-xl font-bold text-gray-800">
              {centerValue ?? total.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {data.map((item, i) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS.vibrant[i % COLORS.vibrant.length] }}
              />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 capitalize truncate">{item.status}</div>
                <div className="text-sm font-semibold text-gray-800">
                  {Number(item.count).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Area Chart for trends
export function TrendAreaChart({
  labels,
  values,
  title,
  color = "green",
  prefix = "",
  suffix = "",
}: {
  labels: string[];
  values: number[];
  title?: string;
  color?: "green" | "blue" | "purple";
  prefix?: string;
  suffix?: string;
}) {
  if (!labels.length || !values.length) return null;

  const gradientColors = COLORS.gradient[color];
  const lineColor = color === "green" ? "#10b981" : color === "blue" ? "#3b82f6" : "#8b5cf6";

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, gradientColors[0]);
          gradient.addColorStop(1, gradientColors[1]);
          return gradient;
        },
        borderColor: lineColor,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const value = Number(ctx.raw || 0).toLocaleString("en-NG");
            return ` ${prefix}${value}${suffix}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#9ca3af" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          callback: (val: any) => `${prefix}${(val / 1000).toFixed(0)}k`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  // Calculate trend
  const lastValue = values[values.length - 1] || 0;
  const prevValue = values[values.length - 2] || lastValue;
  const trendPercent = prevValue ? (((lastValue - prevValue) / prevValue) * 100).toFixed(1) : "0";
  const isUp = lastValue >= prevValue;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {title && <div className="text-sm font-semibold text-gray-700">{title}</div>}
        <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
          <svg className={`w-3 h-3 ${isUp ? "" : "rotate-180"}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {trendPercent}%
        </div>
      </div>
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

// Progress Ring for single metrics
export function ProgressRing({
  value,
  max,
  label,
  color = "green",
  size = "md",
}: {
  value: number;
  max: number;
  label: string;
  color?: "green" | "blue" | "purple" | "orange";
  size?: "sm" | "md" | "lg";
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const percent = Math.min(Math.max((safeValue / safeMax) * 100, 0), 100);
  const colorMap = {
    green: { ring: "#10b981", bg: "#d1fae5" },
    blue: { ring: "#3b82f6", bg: "#dbeafe" },
    purple: { ring: "#8b5cf6", bg: "#ede9fe" },
    orange: { ring: "#f59e0b", bg: "#fef3c7" },
  };
  const sizeMap = {
    sm: { container: "w-16 h-16", text: "text-sm", label: "text-[8px]" },
    md: { container: "w-24 h-24", text: "text-lg", label: "text-[10px]" },
    lg: { container: "w-32 h-32", text: "text-2xl", label: "text-xs" },
  };

  const { ring, bg } = colorMap[color];
  const { container, text, label: labelSize } = sizeMap[size];
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${container}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke={bg} strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-gray-800 ${text}`}>{percent.toFixed(0)}%</span>
        </div>
      </div>
      <div className={`mt-2 text-gray-600 ${labelSize} text-center`}>{label}</div>
    </div>
  );
}

// Stat Card with mini chart
export function StatCardWithTrend({
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendData,
  color = "green",
}: {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendData?: number[];
  color?: "green" | "blue" | "purple";
}) {
  const colorMap = {
    green: { text: "text-green-600", bg: "bg-green-50", line: "#10b981" },
    blue: { text: "text-blue-600", bg: "bg-blue-50", line: "#3b82f6" },
    purple: { text: "text-purple-600", bg: "bg-purple-50", line: "#8b5cf6" },
  };
  const { text: textColor, bg: bgColor, line: lineColor } = colorMap[color];

  const miniChartData = trendData
    ? {
        labels: trendData.map((_, i) => i.toString()),
        datasets: [
          {
            data: trendData,
            borderColor: lineColor,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: false,
          },
        ],
      }
    : null;

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className={`rounded-xl ${bgColor} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase">{title}</div>
          <div className={`mt-1 text-2xl font-bold ${textColor}`}>
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
          </div>
          {trend !== undefined && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              <svg className={`w-3 h-3 ${trend >= 0 ? "" : "rotate-180"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {Math.abs(trend).toFixed(1)}% vs last period
            </div>
          )}
        </div>
        {miniChartData && (
          <div className="w-20 h-10">
            <Line data={miniChartData} options={miniChartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export function YearlyRevenueBar({
  labels,
  values,
  title = "Revenue by Year",
}: {
  labels: string[];
  values: number[];
  title?: string;
}) {
  if (!labels.length || !values.length) return null;

  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Revenue (NGN)",
        data: values,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "#10b981");
          gradient.addColorStop(1, "#059669");
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const value = Number(ctx.raw || 0).toLocaleString("en-NG");
            const percent = ((ctx.raw / total) * 100).toFixed(1);
            return ` ₦${value} (${percent}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#6b7280" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          callback: (val: any) => `₦${(val / 1000000).toFixed(0)}M`,
        },
      },
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">{title}</div>
        <div className="text-xs text-gray-500">
          Total: <span className="font-semibold text-green-600">₦{(total / 1000000).toFixed(1)}M</span>
        </div>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      {/* Mini stats below chart */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">{labels.length}</div>
          <div className="text-[10px] text-gray-500 uppercase">Years</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">₦{(max / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-gray-500 uppercase">Highest</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">₦{((total / labels.length) / 1000000).toFixed(1)}M</div>
          <div className="text-[10px] text-gray-500 uppercase">Average</div>
        </div>
      </div>
    </div>
  );
}

// Horizontal comparison bar chart
export function ComparisonBarChart({
  data,
  title,
  valuePrefix = "",
  valueSuffix = "",
}: {
  data: { label: string; value: number; target?: number }[];
  title?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!data || !data.length) return null;

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.target || 0)));

  return (
    <div className="space-y-3">
      {title && <div className="text-sm font-semibold text-gray-700">{title}</div>}
      <div className="space-y-3">
        {data.map((item, i) => {
          const percent = (item.value / maxValue) * 100;
          const targetPercent = item.target ? (item.target / maxValue) * 100 : null;
          const achieved = item.target ? (item.value / item.target) * 100 : null;

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="font-semibold text-gray-800">
                  {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                  {achieved !== null && (
                    <span className={`ml-2 ${achieved >= 100 ? "text-green-600" : "text-orange-600"}`}>
                      ({achieved.toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: COLORS.vibrant[i % COLORS.vibrant.length],
                  }}
                />
                {targetPercent && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
                    style={{ left: `${targetPercent}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple metric display with icon
export function MetricCard({
  icon,
  label,
  value,
  subValue,
  color = "green",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  color?: "green" | "blue" | "purple" | "orange" | "red";
}) {
  const colorMap = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm">
      <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-800">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {subValue && <div className="text-[10px] text-gray-400">{subValue}</div>}
      </div>
    </div>
  );
}
