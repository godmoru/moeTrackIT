"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export interface StatusCount {
  status: string;
  count: string | number;
}

export function StatusBarChart({
  title,
  data,
}: {
  title?: string;
  data: StatusCount[];
}) {
  if (!data || !data.length) return null;

  const labels = data.map((s) => s.status);
  const values = data.map((s) => Number(s.count || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Count",
        data: values,
        backgroundColor: "rgba(22, 163, 74, 0.7)", // green-600
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ctx.raw?.toLocaleString("en-NG") ?? ctx.raw,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  } as const;

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </div>
      )}
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
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

  const palette = [
    "#15803d", // green-700
    "#22c55e", // green-500
    "#4ade80", // green-400
    "#16a34a", // green-600
    "#22c55e",
    "#86efac",
  ];

  const backgroundColor = labels.map((_, i) => palette[i % palette.length]);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 12,
          font: { size: 10 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const label = ctx.label || "";
            const value = Number(ctx.raw || 0).toLocaleString("en-NG", {
              maximumFractionDigits: 2,
            });
            return `${label}: ₦${value}`;
          },
        },
      },
    },
  } as const;

  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </div>
      )}
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}

export function YearlyRevenueBar({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  if (!labels.length || !values.length) return null;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Revenue (NGN)",
        data: values,
        backgroundColor: "rgba(22, 163, 74, 0.7)",
        borderColor: "rgba(22, 163, 74, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            `₦${Number(ctx.raw || 0).toLocaleString("en-NG", {
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val: any) =>
            `₦${Number(val || 0).toLocaleString("en-NG", {
              maximumFractionDigits: 0,
            })}`,
        },
      },
    },
  } as const;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Revenue by Year
      </div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
