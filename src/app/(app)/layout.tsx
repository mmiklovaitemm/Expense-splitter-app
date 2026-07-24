import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGroupsForUser } from "@/lib/data";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { PageTransition } from "@/components/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const groups = await getGroupsForUser(session.user.id);
  const sidebarGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    myNet: g.myNet,
    defaultCurrency: g.defaultCurrency,
  }));

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar groups={sidebarGroups} userName={session.user.name ?? "You"} isGuest={session.user.isGuest} />
      </div>
      <MobileNav groups={sidebarGroups} userName={session.user.name ?? "You"} isGuest={session.user.isGuest} />
      <main className="flex-1 overflow-y-auto">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
