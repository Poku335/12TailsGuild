import { searchAll } from "@/backend/repositories/guildRepository";
import SearchBoard from "@/frontend/components/SearchBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query.length >= 2 ? await searchAll(query) : [];

  return (
    <GuildHubLayout>
      <SearchBoard initialQuery={query} initialResults={results} />
    </GuildHubLayout>
  );
}
