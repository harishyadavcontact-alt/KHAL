"use client";

import { PriorityList, SyncIndicator } from "@khal/ui";
import { DashboardCharts } from "../../components/dashboard-charts";
import { useApiState } from "../../lib/use-api-state";

export default function DashboardPage() {
  const { data, loading, error } = useApiState();

  if (loading) return <p>Loading dashboard...</p>;
  if (error || !data) return <p>Error: {error}</p>;

  return (
    <div className="grid">
      <div className="card">
        <h2>Do Now</h2>
        <SyncIndicator stale={data.sync?.stale ?? false} />
        <PriorityList
          items={(data.dashboard?.doNow ?? []).map((item: any) => ({
            id: `${item.refType}-${item.refId}`,
            title: item.title,
            why: item.why,
            score: item.score
          }))}
        />
      </div>
      <DashboardCharts
        robustnessProgress={data.dashboard?.robustnessProgress ?? 0}
        optionalityIndex={data.dashboard?.optionalityIndex ?? 0}
        affairs={data.state?.affairs ?? []}
        interests={data.state?.interests ?? []}
      />
    </div>
  );
}