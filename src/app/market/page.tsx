import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { listMarketPosts } from "@/backend/repositories/guildRepository";
import MarketBoard from "@/frontend/components/MarketBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

const getCachedMarketPosts = unstable_cache(listMarketPosts, ["market-posts"], { revalidate: 30 });

export default async function MarketPage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const posts = await getCachedMarketPosts();

  return (
    <GuildHubLayout>
      <MarketBoard initialPosts={posts} user={user} />
    </GuildHubLayout>
  );
}
