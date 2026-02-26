"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  BarElement
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

export function DashboardCharts({ robustnessProgress, optionalityIndex, affairs, interests }: { robustnessProgress: number; optionalityIndex: number; affairs: any[]; interests: any[] }) {
  const radar = {
    labels: ["Robustness", "Optionality", "Affairs", "Interests", "Execution"],
    datasets: [
      {
        label: "State",
        data: [robustnessProgress, Math.min(optionalityIndex, 100), Math.min(affairs.length * 10, 100), Math.min(interests.length * 10, 100), 55],
        borderColor: "#1f2937",
        backgroundColor: "rgba(31, 41, 55, 0.18)"
      }
    ]
  };

  const statusCount = (items: any[]) =>
    items.reduce((acc, item) => {
      const key = item.status || "NOT_STARTED";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const affairStatus = statusCount(affairs);
  const bar = {
    labels: Object.keys(affairStatus),
    datasets: [
      {
        label: "Affairs by Status",
        data: Object.values(affairStatus),
        backgroundColor: ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"]
      }
    ]
  };

  return (
    <div className="grid two">
      <div className="card">
        <h3>Domain Radar</h3>
        <Radar data={radar} />
      </div>
      <div className="card">
        <h3>Status Breakdown</h3>
        <Bar data={bar} />
      </div>
    </div>
  );
}