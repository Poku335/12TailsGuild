import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { listPartyPosts } from "@/backend/repositories/guildRepository";
import PartyBoard from "@/frontend/components/PartyBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

const getCachedPartyPosts = unstable_cache(listPartyPosts, ["party-posts"], { revalidate: 30 });

export default async function PartyPage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const posts = await getCachedPartyPosts();

  return (
    <GuildHubLayout>
      <PartyBoard initialPosts={posts} user={user} />
    </GuildHubLayout>
  );
}
