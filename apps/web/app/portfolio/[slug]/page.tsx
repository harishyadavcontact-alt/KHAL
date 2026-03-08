import { redirect } from "next/navigation";

export default async function PortfolioAliasProjectPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/missionCommand/portfolio/${encodeURIComponent(slug)}`);
}
