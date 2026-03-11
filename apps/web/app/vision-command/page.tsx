"use client";

import Link from "next/link";
import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { buildVisionCommandSnapshot } from "../../lib/war-room/vision-command";
import { useMissionCommandBootstrap } from "../../lib/war-room/useMissionCommandBootstrap";

export default function VisionCommandPage() {
  const { data, loading, error } = useMissionCommandBootstrap();

  if (loading || !data) {
    return (
      <KhalOpsShell title="Vision Command" subtitle="Read-only synthesis">
        <div className="mx-auto max-w-5xl p-5 text-[var(--color-text-muted)]">Loading Vision Command synthesis...</div>
      </KhalOpsShell>
    );
  }

  if (error) {
    return (
      <KhalOpsShell title="Vision Command" subtitle="Read-only synthesis">
        <div className="mx-auto max-w-5xl p-5 text-[var(--color-fragile)]">{error}</div>
      </KhalOpsShell>
    );
  }

  const snapshot = buildVisionCommandSnapshot(data);

  return (
    <KhalOpsShell title="Vision Command" subtitle="Read-only synthesis">
      <div className="mx-auto max-w-5xl p-5 space-y-4">
        <section className="khal-panel-strong rounded-2xl p-4">
          <div className="khal-meta text-[11px]">Vision Command Thin Slice</div>
          <h2 className="khal-title mt-1 text-xl font-semibold">Narrative synthesis before actuation</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">This surface is intentionally read-only while we harden Mission and War Gaming piping parity.</p>
        </section>

        <section className="khal-panel rounded-2xl p-4 grid gap-3 md:grid-cols-4">
          <div>
            <div className="khal-meta text-[10px]">Operator Signal</div>
            <div className="khal-title mt-1 text-lg">{snapshot.signalBand}</div>
          </div>
          <div>
            <div className="khal-meta text-[10px]">Affairs / Interests</div>
            <div className="khal-title mt-1 text-lg">{data.affairs.length} / {data.interests.length}</div>
          </div>
          <div>
            <div className="khal-meta text-[10px]">Unresolved Affairs</div>
            <div className="khal-title mt-1 text-lg">{snapshot.unresolvedAffairs}</div>
          </div>
          <div>
            <div className="khal-meta text-[10px]">Doctrine Gap Domains</div>
            <div className="khal-title mt-1 text-lg">{snapshot.doctrineGapDomainCount}</div>
          </div>
        </section>

        <section className="khal-panel rounded-2xl p-4">
          <div className="khal-meta text-[10px]">Next Operator Moves</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-text-muted)] space-y-1">
            {snapshot.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-3">
            <Link href="/missionCommand" className="khal-button-accent px-3 py-2 text-xs font-semibold">Return to Mission Command</Link>
          </div>
        </section>
      </div>
    </KhalOpsShell>
  );
}
