"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartData {
  kecamatan: string;
  count: number;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: string;
  className?: string;
}

export default function BarChart({
  data,
  title = "Diagram Batang",
  height = "400px",
  className = "",
}: BarChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`bg-gray-200 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Memuat diagram...</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.kecamatan),
    datasets: [
      {
        label: "Jumlah SPPG",
        data: data.map((item) => item.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue
          "rgba(16, 185, 129, 0.8)", // green
          "rgba(139, 92, 246, 0.8)", // purple
          "rgba(249, 115, 22, 0.8)", // orange
          "rgba(236, 72, 153, 0.8)", // pink
          "rgba(99, 102, 241, 0.8)", // indigo
          "rgba(239, 68, 68, 0.8)", // red
          "rgba(245, 158, 11, 0.8)", // yellow
          "rgba(20, 184, 166, 0.8)", // teal
          "rgba(6, 182, 212, 0.8)", // cyan
          "rgba(132, 204, 22, 0.8)", // lime
          "rgba(245, 158, 11, 0.8)", // amber
          "rgba(16, 185, 129, 0.8)", // emerald
          "rgba(139, 92, 246, 0.8)", // violet
          "rgba(244, 63, 94, 0.8)", // rose
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(249, 115, 22, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(99, 102, 241, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(20, 184, 166, 1)",
          "rgba(6, 182, 212, 1)",
          "rgba(132, 204, 22, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(244, 63, 94, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          title: function (context: any) {
            return context[0].label;
          },
          label: function (context: any) {
            return `${context.parsed.y} SPPG`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 10,
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
      style={{ height }}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height: "calc(100% - 60px)" }}>
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Total: {data.reduce((sum, item) => sum + item.count, 0)} SPPG
      </div>
    </div>
  );
}
