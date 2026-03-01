import { CraftsLibraryClient } from "../../components/ops-pages/CraftsLibraryClient";

export default async function CraftsLibraryPage({ searchParams }: { searchParams: Promise<{ craftId?: string }> }) {
  const resolved = await searchParams;
  return <CraftsLibraryClient initialCraftId={resolved.craftId} />;
}

