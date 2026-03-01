import { AffairsClient } from "../../components/ops-pages/AffairsClient";

export default async function AffairsPage({ searchParams }: { searchParams: Promise<{ affairId?: string }> }) {
  const resolved = await searchParams;
  return <AffairsClient initialAffairId={resolved.affairId} />;
}

