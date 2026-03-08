import { KhalOpsShell } from "../../../components/ops-shell/KhalOpsShell";
import { PortfolioWarRoomClient } from "../../../components/ops-pages/PortfolioWarRoomClient";

export default function MissionCommandPortfolioPage() {
  return (
    <KhalOpsShell title="Portfolio War Room" subtitle="Mission Command">
      <PortfolioWarRoomClient />
    </KhalOpsShell>
  );
}
