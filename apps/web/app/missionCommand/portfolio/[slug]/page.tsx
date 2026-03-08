import { KhalOpsShell } from "../../../../components/ops-shell/KhalOpsShell";
import { PortfolioProjectCommandClient } from "../../../../components/ops-pages/PortfolioProjectCommandClient";

export default async function MissionCommandPortfolioProjectPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <KhalOpsShell title="Portfolio Project" subtitle="Mission Command">
      <PortfolioProjectCommandClient slug={slug} />
    </KhalOpsShell>
  );
}
