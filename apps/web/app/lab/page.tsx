import { KhalOpsShell } from "../../components/ops-shell/KhalOpsShell";
import { LabPageClient } from "../../components/ops-pages/LabPageClient";

export default async function LabPage({
  searchParams
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const resolvedSearch = await searchParams;
  return (
    <KhalOpsShell title="Lab" subtitle="Convex Experiments">
      <LabPageClient focusId={resolvedSearch.focus} />
    </KhalOpsShell>
  );
}

