import { KhalOpsShell } from "../../../components/ops-shell/KhalOpsShell";
import { PortfolioWarRoomClient } from "../../../components/ops-pages/PortfolioWarRoomClient";

export default async function MissionCommandPortfolioPage({
  searchParams
}: {
  searchParams: Promise<{ interestId?: string }>;
}) {
  await searchParams;
  return (
    <KhalOpsShell title="Portfolio War Room" subtitle="Mission Command">
      <PortfolioWarRoomClient />
    </KhalOpsShell>
  );
}
