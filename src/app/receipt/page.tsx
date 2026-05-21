import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/backend/auth/session";
import { listReceiptCards } from "@/backend/repositories/guildRepository";
import ReceiptBoard from "@/frontend/components/ReceiptBoard";
import GuildHubLayout from "@/frontend/layouts/GuildHubLayout";

const getCachedReceiptCards = unstable_cache(listReceiptCards, ["receipt-cards"], { revalidate: 30 });

export default async function ReceiptPage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const cards = await getCachedReceiptCards();

  return (
    <GuildHubLayout>
      <ReceiptBoard initialCards={cards} user={user} />
    </GuildHubLayout>
  );
}
