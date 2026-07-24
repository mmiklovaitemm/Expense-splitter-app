import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/data";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const groups = await getGroupsForUser(session.user.id);
  if (groups.length > 0) redirect(`/groups/${groups[0].id}`);
  redirect("/groups/new");
}
