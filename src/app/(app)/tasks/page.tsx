import type { Metadata } from "next";
import { requireOnboardedUser, isAdmin } from "@/lib/auth";
import { getFollowUpTasks } from "@/lib/data/tasks";
import { getDict } from "@/lib/i18n/server";
import { DemoBadge } from "@/components/demo-badge";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata: Metadata = { title: "Tugasan" };

export default async function TasksPage() {
  const user = await requireOnboardedUser();
  const admin = isAdmin(user.role);
  const scope = admin ? {} : { ownerId: user.id };

  const [tasks, dict] = await Promise.all([
    getFollowUpTasks(scope, { admin, userId: user.id }),
    getDict(),
  ]);
  const tt = dict.tasks;

  const stamp = user.profile
    ? {
        name: user.profile.display_name || user.profile.full_name,
        phone: user.profile.whatsapp || user.profile.phone,
        ren: user.profile.ren_number,
        agency: user.profile.agency_name,
      }
    : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tt.title}</h1>
        <p className="text-muted-foreground">
          {admin ? tt.subtitleAdmin : tt.subtitleAgent}
        </p>
        <DemoBadge className="mt-2" />
      </div>

      <TaskBoard tasks={tasks} agent={stamp} />
    </div>
  );
}
