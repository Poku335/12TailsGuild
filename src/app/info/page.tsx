import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { listInfoPosts } from "@/backend/repositories/guildRepository";
import InfoBoard from "@/frontend/components/InfoBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

const getCachedInfoPosts = unstable_cache(listInfoPosts, ["info-posts"], { revalidate: 30 });

export default async function InfoPage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const posts = await getCachedInfoPosts();

  return (
    <GuildHubLayout>
      <InfoBoard posts={posts} user={user} />
    </GuildHubLayout>
  );
}
