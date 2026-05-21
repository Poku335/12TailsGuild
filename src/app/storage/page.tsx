import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { listStorageCards, listStorageRequests } from "@/backend/repositories/guildRepository";
import GuildStorageBoard from "@/frontend/components/GuildStorageBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

const getCachedStorageCards = unstable_cache(listStorageCards, ["storage-cards"], { revalidate: 30 });
const getCachedStorageRequests = unstable_cache(listStorageRequests, ["storage-requests"], { revalidate: 30 });

export default async function StoragePage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const [requests, cards] = await Promise.all([getCachedStorageRequests(), getCachedStorageCards()]);

  return (
    <GuildHubLayout>
      <GuildStorageBoard requests={requests} cards={cards} user={user} />
    </GuildHubLayout>
  );
}
